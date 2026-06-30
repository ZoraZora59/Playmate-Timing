package controllers

import (
	"errors"

	"companion-platform-backend/config"
	"companion-platform-backend/middleware"
	"companion-platform-backend/models"
	"companion-platform-backend/utils"

	"github.com/gin-gonic/gin"
	"github.com/shopspring/decimal"
	"gorm.io/gorm"
)

type BalanceController struct{}

// BalanceOpRequest 余额操作请求（充值 / 扣费 / 退款共用）
type BalanceOpRequest struct {
	PlayerID    uint               `json:"player_id" binding:"required"`
	ProviderID  uint               `json:"provider_id" binding:"required"`
	StudioID    uint               `json:"studio_id"`
	Type        models.BalanceType `json:"type" binding:"required,oneof=money time point"`
	Amount      decimal.Decimal    `json:"amount"`
	Description string             `json:"description"`
}

// GetPlayerBalances 获取玩家的余额列表
func (bc *BalanceController) GetPlayerBalances(c *gin.Context) {
	userID, err := middleware.GetCurrentUserID(c)
	if err != nil {
		utils.Unauthorized(c, "User not found")
		return
	}

	db := config.GetDB()
	page, pageSize, offset := paginate(c)
	balanceType := c.Query("type")

	query := db.Model(&models.Balance{}).Where("player_id = ?", userID)
	if balanceType != "" {
		query = query.Where("type = ?", balanceType)
	}

	var total int64
	query.Count(&total)

	var balances []models.Balance
	if err := query.Preload("Provider").Preload("Studio").Offset(offset).Limit(pageSize).Find(&balances).Error; err != nil {
		utils.InternalServerError(c, "Failed to get balances")
		return
	}

	utils.PageSuccess(c, balances, total, page, pageSize)
}

// GetBalanceByProvider 获取玩家在特定服务者的余额
func (bc *BalanceController) GetBalanceByProvider(c *gin.Context) {
	userID, err := middleware.GetCurrentUserID(c)
	if err != nil {
		utils.Unauthorized(c, "User not found")
		return
	}

	pid, err := parseUintParam(c.Param("provider_id"))
	if err != nil {
		utils.BadRequest(c, "Invalid provider ID")
		return
	}

	sid, _ := parseUintParam(c.DefaultQuery("studio_id", "0"))

	db := config.GetDB()
	var balances []models.Balance
	if err := db.Where("player_id = ? AND provider_id = ? AND studio_id = ?", userID, pid, sid).
		Preload("Provider").Preload("Studio").Find(&balances).Error; err != nil {
		utils.InternalServerError(c, "Failed to get balance")
		return
	}

	utils.Success(c, balances)
}

// Recharge 充值（服务者 / 工作室操作）
func (bc *BalanceController) Recharge(c *gin.Context) {
	bc.operate(c, models.TransactionTypeRecharge)
}

// AddBalance 充值（保留旧路由别名）
func (bc *BalanceController) AddBalance(c *gin.Context) {
	bc.operate(c, models.TransactionTypeRecharge)
}

// Deduct 扣费 / 消费（服务者 / 工作室操作）
func (bc *BalanceController) Deduct(c *gin.Context) {
	bc.operate(c, models.TransactionTypeConsume)
}

// Refund 退款（服务者 / 工作室操作）
func (bc *BalanceController) Refund(c *gin.Context) {
	bc.operate(c, models.TransactionTypeRefund)
}

// operate 充值/扣费/退款的统一处理：鉴权 → 事务内加锁调整余额 → 落流水
func (bc *BalanceController) operate(c *gin.Context, txType models.TransactionType) {
	userID, err := middleware.GetCurrentUserID(c)
	if err != nil {
		utils.Unauthorized(c, "User not found")
		return
	}

	userRole, err := middleware.GetCurrentUserRole(c)
	if err != nil || (userRole != models.RoleProvider && userRole != models.RoleStudio) {
		utils.Forbidden(c, "只有服务者和工作室可以操作余额")
		return
	}

	var req BalanceOpRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}
	if req.Amount.LessThanOrEqual(decimal.Zero) {
		utils.BadRequest(c, "金额必须大于 0")
		return
	}

	db := config.GetDB()

	// 鉴权：解析有效的 studio_id 并校验操作权限
	studioID := req.StudioID
	if userRole == models.RoleProvider {
		// 服务者只能操作「以自己为服务者」的余额
		if req.ProviderID != userID {
			utils.Forbidden(c, "服务者只能操作自己名下的玩家余额")
			return
		}
	} else { // RoleStudio
		var studio models.Studio
		if err := db.Where("owner_id = ?", userID).First(&studio).Error; err != nil {
			utils.NotFound(c, "未找到你的工作室")
			return
		}
		// 校验该服务者已通过审批加入本工作室
		var relation models.ProviderStudioRelation
		if err := db.Where("provider_id = ? AND studio_id = ? AND status = ?",
			req.ProviderID, studio.ID, models.StatusApproved).First(&relation).Error; err != nil {
			utils.Forbidden(c, "该服务者未加入你的工作室")
			return
		}
		studioID = studio.ID
	}

	// 变动方向：消费为负，充值/退款为正
	delta := req.Amount
	if txType == models.TransactionTypeConsume {
		delta = req.Amount.Neg()
	}

	var balance *models.Balance
	txErr := db.Transaction(func(tx *gorm.DB) error {
		b, err := adjustBalanceTx(tx, req.PlayerID, req.ProviderID, studioID, req.Type,
			delta, txType, userID, req.Description)
		if err != nil {
			return err
		}
		balance = b
		return nil
	})

	if txErr != nil {
		if errors.Is(txErr, errInsufficientBalance) {
			utils.BadRequest(c, "余额不足，无法扣费")
			return
		}
		utils.InternalServerError(c, "余额操作失败")
		return
	}

	db.Preload("Provider").Preload("Studio").First(balance, balance.ID)

	verb := map[models.TransactionType]string{
		models.TransactionTypeRecharge: "充值成功",
		models.TransactionTypeConsume:  "扣费成功",
		models.TransactionTypeRefund:   "退款成功",
	}[txType]
	utils.SuccessWithMessage(c, verb, balance)
}

// GetBalanceTransactions 获取余额变动记录
func (bc *BalanceController) GetBalanceTransactions(c *gin.Context) {
	userID, err := middleware.GetCurrentUserID(c)
	if err != nil {
		utils.Unauthorized(c, "User not found")
		return
	}

	balanceID, err := parseUintParam(c.Param("id"))
	if err != nil {
		utils.BadRequest(c, "Invalid balance ID")
		return
	}

	db := config.GetDB()

	// 校验余额记录归属：玩家本人，或该余额对应的服务者
	role, _ := middleware.GetCurrentUserRole(c)
	var balance models.Balance
	q := db.Where("id = ?", balanceID)
	if role == models.RoleProvider {
		q = q.Where("provider_id = ?", userID)
	} else {
		q = q.Where("player_id = ?", userID)
	}
	if err := q.First(&balance).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			utils.Forbidden(c, "无权访问该余额记录")
			return
		}
		utils.InternalServerError(c, "Database error")
		return
	}

	page, pageSize, offset := paginate(c)
	transactionType := c.Query("type")

	query := db.Model(&models.BalanceTransaction{}).Where("balance_id = ?", balanceID)
	if transactionType != "" {
		query = query.Where("type = ?", transactionType)
	}

	var total int64
	query.Count(&total)

	var transactions []models.BalanceTransaction
	if err := query.Preload("Operator").Order("created_at DESC").Offset(offset).Limit(pageSize).Find(&transactions).Error; err != nil {
		utils.InternalServerError(c, "Failed to get transactions")
		return
	}

	utils.PageSuccess(c, transactions, total, page, pageSize)
}

// BalanceSummaryRow 余额汇总行
type BalanceSummaryRow struct {
	Type        models.BalanceType `json:"type"`
	TotalAmount decimal.Decimal    `json:"total_amount"`
	PlayerCount int64              `json:"player_count"`
}

// GetProviderBalanceSummary 获取服务者的余额汇总（服务者查看）
func (bc *BalanceController) GetProviderBalanceSummary(c *gin.Context) {
	userID, err := middleware.GetCurrentUserID(c)
	if err != nil {
		utils.Unauthorized(c, "User not found")
		return
	}

	userRole, err := middleware.GetCurrentUserRole(c)
	if err != nil || userRole != models.RoleProvider {
		utils.Forbidden(c, "只有服务者可以查看收益汇总")
		return
	}

	db := config.GetDB()
	var summary []BalanceSummaryRow
	if err := db.Model(&models.Balance{}).
		Select("type, SUM(amount) as total_amount, COUNT(DISTINCT player_id) as player_count").
		Where("provider_id = ?", userID).
		Group("type").
		Scan(&summary).Error; err != nil {
		utils.InternalServerError(c, "Failed to get balance summary")
		return
	}

	utils.Success(c, summary)
}
