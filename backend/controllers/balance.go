package controllers

import (
	"strconv"

	"companion-platform-backend/config"
	"companion-platform-backend/middleware"
	"companion-platform-backend/models"
	"companion-platform-backend/utils"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type BalanceController struct{}

// AddBalanceRequest 添加余额请求
type AddBalanceRequest struct {
	PlayerID   uint                `json:"player_id" binding:"required"`
	ProviderID uint                `json:"provider_id" binding:"required"`
	StudioID   uint                `json:"studio_id"`
	Type       models.BalanceType  `json:"type" binding:"required,oneof=money time point"`
	Amount     float64             `json:"amount" binding:"required,gt=0"`
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

	// 分页参数
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "10"))
	balanceType := c.Query("type")

	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 10
	}

	offset := (page - 1) * pageSize

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

	providerID := c.Param("provider_id")
	pid, err := strconv.ParseUint(providerID, 10, 32)
	if err != nil {
		utils.BadRequest(c, "Invalid provider ID")
		return
	}

	studioID := c.DefaultQuery("studio_id", "0")
	sid, _ := strconv.ParseUint(studioID, 10, 32)

	db := config.GetDB()
	var balances []models.Balance
	if err := db.Where("player_id = ? AND provider_id = ? AND studio_id = ?", userID, uint(pid), uint(sid)).
		Preload("Provider").Preload("Studio").Find(&balances).Error; err != nil {
		utils.InternalServerError(c, "Failed to get balance")
		return
	}

	utils.Success(c, balances)
}

// AddBalance 添加余额（工作室或服务者操作）
func (bc *BalanceController) AddBalance(c *gin.Context) {
	userID, err := middleware.GetCurrentUserID(c)
	if err != nil {
		utils.Unauthorized(c, "User not found")
		return
	}

	userRole, err := middleware.GetCurrentUserRole(c)
	if err != nil || (userRole != models.RoleProvider && userRole != models.RoleStudio) {
		utils.Forbidden(c, "Only providers and studios can add balance")
		return
	}

	var req AddBalanceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}

	db := config.GetDB()

	// 开始事务
	tx := db.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// 验证权限：检查当前用户是否有权限为该服务者添加余额
	if userRole == models.RoleProvider {
		// 如果是服务者，只能为自己添加余额
		if req.ProviderID != userID {
			tx.Rollback()
			utils.Forbidden(c, "Providers can only add balance for themselves")
			return
		}
	} else if userRole == models.RoleStudio {
		// 如果是工作室，需要检查服务者是否关联到该工作室
		var studio models.Studio
		if err := tx.Where("owner_id = ?", userID).First(&studio).Error; err != nil {
			tx.Rollback()
			utils.NotFound(c, "Studio not found")
			return
		}

		// 检查服务者是否关联到该工作室
		var relation models.ProviderStudioRelation
		if err := tx.Where("provider_id = ? AND studio_id = ? AND status = ?", 
			req.ProviderID, studio.ID, models.StatusApproved).First(&relation).Error; err != nil {
			tx.Rollback()
			utils.Forbidden(c, "Provider is not associated with your studio")
			return
		}

		req.StudioID = studio.ID
	}

	// 查找或创建余额记录
	var balance models.Balance
	if err := tx.Where("player_id = ? AND provider_id = ? AND studio_id = ? AND type = ?",
		req.PlayerID, req.ProviderID, req.StudioID, req.Type).First(&balance).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			// 创建新的余额记录
			balance = models.Balance{
				PlayerID:   req.PlayerID,
				ProviderID: req.ProviderID,
				StudioID:   req.StudioID,
				Type:       req.Type,
				Amount:     0,
			}
			if err := tx.Create(&balance).Error; err != nil {
				tx.Rollback()
				utils.InternalServerError(c, "Failed to create balance record")
				return
			}
		} else {
			tx.Rollback()
			utils.InternalServerError(c, "Database error")
			return
		}
	}

	// 记录交易前余额
	beforeAmount := balance.Amount

	// 更新余额
	balance.Amount += req.Amount
	if err := tx.Save(&balance).Error; err != nil {
		tx.Rollback()
		utils.InternalServerError(c, "Failed to update balance")
		return
	}

	// 创建交易记录
	transaction := models.BalanceTransaction{
		BalanceID:    balance.ID,
		Type:         models.TransactionTypeRecharge,
		Amount:       req.Amount,
		BeforeAmount: beforeAmount,
		AfterAmount:  balance.Amount,
		Description:  req.Description,
		OperatorID:   userID,
	}

	if err := tx.Create(&transaction).Error; err != nil {
		tx.Rollback()
		utils.InternalServerError(c, "Failed to create transaction record")
		return
	}

	// 提交事务
	if err := tx.Commit().Error; err != nil {
		utils.InternalServerError(c, "Failed to commit transaction")
		return
	}

	// 预加载关联数据
	db.Preload("Provider").Preload("Studio").First(&balance, balance.ID)

	utils.SuccessWithMessage(c, "Balance added successfully", balance)
}

// GetBalanceTransactions 获取余额变动记录
func (bc *BalanceController) GetBalanceTransactions(c *gin.Context) {
	userID, err := middleware.GetCurrentUserID(c)
	if err != nil {
		utils.Unauthorized(c, "User not found")
		return
	}

	id := c.Param("id")
	balanceID, err := strconv.ParseUint(id, 10, 32)
	if err != nil {
		utils.BadRequest(c, "Invalid balance ID")
		return
	}

	db := config.GetDB()

	// 检查余额记录是否属于当前用户
	var balance models.Balance
	if err := db.Where("id = ? AND player_id = ?", uint(balanceID), userID).First(&balance).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			utils.Forbidden(c, "Access denied")
			return
		}
		utils.InternalServerError(c, "Database error")
		return
	}

	// 分页参数
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "10"))
	transactionType := c.Query("type")

	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 10
	}

	offset := (page - 1) * pageSize

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

// GetProviderBalanceSummary 获取服务者的余额汇总（服务者查看）
func (bc *BalanceController) GetProviderBalanceSummary(c *gin.Context) {
	userID, err := middleware.GetCurrentUserID(c)
	if err != nil {
		utils.Unauthorized(c, "User not found")
		return
	}

	userRole, err := middleware.GetCurrentUserRole(c)
	if err != nil || userRole != models.RoleProvider {
		utils.Forbidden(c, "Only providers can view balance summary")
		return
	}

	db := config.GetDB()

	type BalanceSummary struct {
		Type         models.BalanceType `json:"type"`
		TotalAmount  float64            `json:"total_amount"`
		PlayerCount  int64              `json:"player_count"`
	}

	var summary []BalanceSummary
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