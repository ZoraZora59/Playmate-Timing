package controllers

import (
	"errors"
	"time"

	"companion-platform-backend/config"
	"companion-platform-backend/middleware"
	"companion-platform-backend/models"
	"companion-platform-backend/utils"

	"github.com/gin-gonic/gin"
	"github.com/shopspring/decimal"
	"gorm.io/gorm"
)

type PlayRecordController struct{}

// CreatePlayRecordRequest 创建游玩记录（服务者发起一局陪玩）
type CreatePlayRecordRequest struct {
	PlayerID    uint               `json:"player_id" binding:"required"`
	StudioID    uint               `json:"studio_id"`
	GameName    string             `json:"game_name" binding:"required"`
	GameMode    string             `json:"game_mode"`
	SettleType  models.BalanceType `json:"settle_type" binding:"omitempty,oneof=money time point"`
	Description string             `json:"description"`
}

// CompletePlayRecordRequest 完成游玩记录（可同时结算扣费）
type CompletePlayRecordRequest struct {
	Duration uint            `json:"duration"`
	Amount   decimal.Decimal `json:"amount"`
	Settle   *bool           `json:"settle"` // 是否从玩家余额结算扣费，默认 true
}

// Create 服务者发起一局陪玩（状态 active）
func (pc *PlayRecordController) Create(c *gin.Context) {
	userID, err := middleware.GetCurrentUserID(c)
	if err != nil {
		utils.Unauthorized(c, "User not found")
		return
	}

	var req CreatePlayRecordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}

	settleType := req.SettleType
	if settleType == "" {
		settleType = models.BalanceTypeMoney
	}

	record := models.PlayRecord{
		PlayerID:    req.PlayerID,
		ProviderID:  userID,
		StudioID:    req.StudioID,
		GameName:    req.GameName,
		GameMode:    req.GameMode,
		StartTime:   time.Now(),
		SettleType:  settleType,
		Status:      models.PlayStatusActive,
		Description: req.Description,
		Amount:      decimal.Zero,
	}

	if err := config.GetDB().Create(&record).Error; err != nil {
		utils.InternalServerError(c, "Failed to create play record")
		return
	}

	utils.SuccessWithMessage(c, "陪玩已开始", record)
}

// Complete 服务者完成一局陪玩，可选从玩家余额结算扣费
func (pc *PlayRecordController) Complete(c *gin.Context) {
	userID, err := middleware.GetCurrentUserID(c)
	if err != nil {
		utils.Unauthorized(c, "User not found")
		return
	}

	recordID, err := parseUintParam(c.Param("id"))
	if err != nil {
		utils.BadRequest(c, "Invalid record ID")
		return
	}

	var req CompletePlayRecordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}
	settle := req.Settle == nil || *req.Settle

	db := config.GetDB()
	var record models.PlayRecord
	if err := db.First(&record, recordID).Error; err != nil {
		utils.NotFound(c, "游玩记录不存在")
		return
	}
	if record.ProviderID != userID {
		utils.Forbidden(c, "只有该局的服务者可以操作")
		return
	}
	if record.Status != models.PlayStatusActive {
		utils.BadRequest(c, "该局已结束或已取消")
		return
	}

	now := time.Now()
	txErr := db.Transaction(func(tx *gorm.DB) error {
		// 结算扣费
		if settle && req.Amount.GreaterThan(decimal.Zero) {
			desc := record.GameName
			if record.GameMode != "" {
				desc += " · " + record.GameMode
			}
			if _, err := adjustBalanceTx(tx, record.PlayerID, record.ProviderID, record.StudioID,
				record.SettleType, req.Amount.Neg(), models.TransactionTypeConsume, userID, desc); err != nil {
				return err
			}
		}
		updates := map[string]interface{}{
			"end_time": &now,
			"duration": req.Duration,
			"amount":   req.Amount,
			"status":   models.PlayStatusCompleted,
		}
		return tx.Model(&record).Updates(updates).Error
	})

	if txErr != nil {
		if errors.Is(txErr, errInsufficientBalance) {
			utils.BadRequest(c, "玩家余额不足，无法结算")
			return
		}
		utils.InternalServerError(c, "完成结算失败")
		return
	}

	db.First(&record, recordID)
	utils.SuccessWithMessage(c, "陪玩已完成", record)
}

// Cancel 服务者取消一局陪玩
func (pc *PlayRecordController) Cancel(c *gin.Context) {
	userID, err := middleware.GetCurrentUserID(c)
	if err != nil {
		utils.Unauthorized(c, "User not found")
		return
	}

	recordID, err := parseUintParam(c.Param("id"))
	if err != nil {
		utils.BadRequest(c, "Invalid record ID")
		return
	}

	db := config.GetDB()
	var record models.PlayRecord
	if err := db.First(&record, recordID).Error; err != nil {
		utils.NotFound(c, "游玩记录不存在")
		return
	}
	if record.ProviderID != userID {
		utils.Forbidden(c, "只有该局的服务者可以操作")
		return
	}
	if record.Status != models.PlayStatusActive {
		utils.BadRequest(c, "该局已结束或已取消")
		return
	}

	now := time.Now()
	if err := db.Model(&record).Updates(map[string]interface{}{
		"status":   models.PlayStatusCancelled,
		"end_time": &now,
	}).Error; err != nil {
		utils.InternalServerError(c, "取消失败")
		return
	}

	db.First(&record, recordID)
	utils.SuccessWithMessage(c, "陪玩已取消", record)
}

// ListMine 玩家查看自己的游玩记录
func (pc *PlayRecordController) ListMine(c *gin.Context) {
	userID, err := middleware.GetCurrentUserID(c)
	if err != nil {
		utils.Unauthorized(c, "User not found")
		return
	}
	pc.list(c, "player_id = ?", userID)
}

// ListHosted 服务者查看自己主持的游玩记录
func (pc *PlayRecordController) ListHosted(c *gin.Context) {
	userID, err := middleware.GetCurrentUserID(c)
	if err != nil {
		utils.Unauthorized(c, "User not found")
		return
	}
	pc.list(c, "provider_id = ?", userID)
}

func (pc *PlayRecordController) list(c *gin.Context, cond string, arg interface{}) {
	db := config.GetDB()
	page, pageSize, offset := paginate(c)
	status := c.Query("status")

	query := db.Model(&models.PlayRecord{}).Where(cond, arg)
	if status != "" {
		query = query.Where("status = ?", status)
	}

	var total int64
	query.Count(&total)

	var records []models.PlayRecord
	if err := query.Preload("Player").Preload("Provider").Preload("Studio").
		Order("start_time DESC").Offset(offset).Limit(pageSize).Find(&records).Error; err != nil {
		utils.InternalServerError(c, "Failed to get play records")
		return
	}

	utils.PageSuccess(c, records, total, page, pageSize)
}
