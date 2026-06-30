package controllers

import (
	"errors"
	"strconv"

	"companion-platform-backend/models"

	"github.com/gin-gonic/gin"
	"github.com/shopspring/decimal"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

// errInsufficientBalance 余额不足
var errInsufficientBalance = errors.New("余额不足")

// lockForUpdate 仅在 MySQL 上施加行级写锁（SELECT ... FOR UPDATE），
// 防止「读-改-写」并发下的丢失更新；SQLite 写本身串行，无需加锁（也不支持该语法）。
func lockForUpdate(tx *gorm.DB) *gorm.DB {
	if tx.Dialector != nil && tx.Dialector.Name() == "mysql" {
		return tx.Clauses(clause.Locking{Strength: "UPDATE"})
	}
	return tx
}

// adjustBalanceTx 在事务 tx 内，对 (player, provider, studio, type) 余额施加带符号的 delta。
// 加锁读取目标行 → 计算变动前后 → 写回 → 落一条流水。delta 为负时校验可用余额是否充足。
// 余额记录不存在且 delta 为正时自动创建；不存在且 delta 为负时视为余额不足。
func adjustBalanceTx(tx *gorm.DB, playerID, providerID, studioID uint, btype models.BalanceType,
	delta decimal.Decimal, txType models.TransactionType, operatorID uint, desc string) (*models.Balance, error) {

	var balance models.Balance
	err := lockForUpdate(tx).
		Where("player_id = ? AND provider_id = ? AND studio_id = ? AND type = ?",
			playerID, providerID, studioID, btype).
		First(&balance).Error

	if errors.Is(err, gorm.ErrRecordNotFound) {
		if delta.IsNegative() {
			return nil, errInsufficientBalance
		}
		balance = models.Balance{
			PlayerID:   playerID,
			ProviderID: providerID,
			StudioID:   studioID,
			Type:       btype,
			Amount:     decimal.Zero,
		}
		if err := tx.Create(&balance).Error; err != nil {
			return nil, err
		}
	} else if err != nil {
		return nil, err
	}

	before := balance.Amount
	after := before.Add(delta)
	if after.IsNegative() {
		return nil, errInsufficientBalance
	}

	if err := tx.Model(&models.Balance{}).Where("id = ?", balance.ID).
		Update("amount", after).Error; err != nil {
		return nil, err
	}
	balance.Amount = after

	txRow := models.BalanceTransaction{
		BalanceID:    balance.ID,
		Type:         txType,
		Amount:       delta.Abs(),
		BeforeAmount: before,
		AfterAmount:  after,
		Description:  desc,
		OperatorID:   operatorID,
	}
	if err := tx.Create(&txRow).Error; err != nil {
		return nil, err
	}

	return &balance, nil
}

// parseUintParam 解析路径/查询参数为 uint
func parseUintParam(s string) (uint, error) {
	v, err := strconv.ParseUint(s, 10, 32)
	if err != nil {
		return 0, err
	}
	return uint(v), nil
}

// paginate 从 gin 上下文解析分页参数（page>=1，1<=page_size<=100）
func paginate(c *gin.Context) (page, pageSize, offset int) {
	page, _ = strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ = strconv.Atoi(c.DefaultQuery("page_size", "10"))
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 10
	}
	offset = (page - 1) * pageSize
	return
}
