package controllers

import (
	"strconv"
	"time"

	"companion-platform-backend/config"
	"companion-platform-backend/middleware"
	"companion-platform-backend/models"
	"companion-platform-backend/utils"

	"github.com/gin-gonic/gin"
	"github.com/shopspring/decimal"
	"gorm.io/gorm"
)

type StudioController struct{}

// CreateStudioRequest 创建工作室请求
type CreateStudioRequest struct {
	Name        string `json:"name" binding:"required,min=1,max=100"`
	Description string `json:"description"`
	Logo        string `json:"logo"`
	ContactInfo string `json:"contact_info"`
}

// ApplyProviderRequest 申请加入工作室请求
type ApplyProviderRequest struct {
	ProviderID uint   `json:"provider_id" binding:"required"`
	Notes      string `json:"notes"`
}

// ProcessApplicationRequest 处理申请请求
type ProcessApplicationRequest struct {
	Status models.RelationStatus `json:"status" binding:"required,oneof=approved rejected"`
	Notes  string                `json:"notes"`
}

// CreateStudio 创建工作室
func (sc *StudioController) CreateStudio(c *gin.Context) {
	userID, err := middleware.GetCurrentUserID(c)
	if err != nil {
		utils.Unauthorized(c, "User not found")
		return
	}

	var req CreateStudioRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}

	db := config.GetDB()

	// 一个账号只允许创建一个工作室，避免 dashboard/成员接口按 owner_id 取到多条记录
	var existingStudio models.Studio
	if err := db.Where("owner_id = ?", userID).First(&existingStudio).Error; err == nil {
		utils.BadRequest(c, "你已创建过工作室")
		return
	}

	// 检查工作室名称是否已存在
	if err := db.Where("name = ?", req.Name).First(&existingStudio).Error; err == nil {
		utils.BadRequest(c, "Studio name already exists")
		return
	}

	// 创建工作室
	studio := models.Studio{
		Name:        req.Name,
		Description: req.Description,
		Logo:        req.Logo,
		ContactInfo: req.ContactInfo,
		OwnerID:     userID,
		IsActive:    true,
	}

	if err := db.Create(&studio).Error; err != nil {
		utils.InternalServerError(c, "Failed to create studio")
		return
	}

	// 预加载Owner信息
	db.Preload("Owner").First(&studio, studio.ID)

	utils.SuccessWithMessage(c, "Studio created successfully", studio)
}

// GetStudioList 获取工作室列表
func (sc *StudioController) GetStudioList(c *gin.Context) {
	db := config.GetDB()

	// 分页参数
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "10"))
	keyword := c.Query("keyword")

	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 10
	}

	offset := (page - 1) * pageSize

	query := db.Model(&models.Studio{}).Where("is_active = ?", true)
	if keyword != "" {
		query = query.Where("name LIKE ? OR description LIKE ?", "%"+keyword+"%", "%"+keyword+"%")
	}

	var total int64
	query.Count(&total)

	var studios []models.Studio
	if err := query.Preload("Owner").Offset(offset).Limit(pageSize).Find(&studios).Error; err != nil {
		utils.InternalServerError(c, "Failed to get studio list")
		return
	}
	for i := range studios {
		studios[i].Owner.Sanitize()
	}

	utils.PageSuccess(c, studios, total, page, pageSize)
}

// GetStudioByID 根据ID获取工作室信息
func (sc *StudioController) GetStudioByID(c *gin.Context) {
	id := c.Param("id")
	studioID, err := strconv.ParseUint(id, 10, 32)
	if err != nil {
		utils.BadRequest(c, "Invalid studio ID")
		return
	}

	db := config.GetDB()
	var studio models.Studio
	if err := db.Preload("Owner").Preload("Relations.Provider").First(&studio, uint(studioID)).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			utils.NotFound(c, "Studio not found")
			return
		}
		utils.InternalServerError(c, "Database error")
		return
	}
	studio.Owner.Sanitize()
	for i := range studio.Relations {
		studio.Relations[i].Provider.Sanitize()
	}

	utils.Success(c, studio)
}

// UpdateStudio 更新工作室信息
func (sc *StudioController) UpdateStudio(c *gin.Context) {
	id := c.Param("id")
	studioID, err := strconv.ParseUint(id, 10, 32)
	if err != nil {
		utils.BadRequest(c, "Invalid studio ID")
		return
	}

	userID, err := middleware.GetCurrentUserID(c)
	if err != nil {
		utils.Unauthorized(c, "User not found")
		return
	}

	var req CreateStudioRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}

	db := config.GetDB()
	var studio models.Studio
	if err := db.First(&studio, uint(studioID)).Error; err != nil {
		utils.NotFound(c, "Studio not found")
		return
	}

	// 检查权限：只有工作室所有者可以更新
	if studio.OwnerID != userID {
		utils.Forbidden(c, "Only studio owner can update studio information")
		return
	}

	// 更新工作室信息
	updates := map[string]interface{}{
		"name":         req.Name,
		"description":  req.Description,
		"logo":         req.Logo,
		"contact_info": req.ContactInfo,
	}

	if err := db.Model(&studio).Updates(updates).Error; err != nil {
		utils.InternalServerError(c, "Failed to update studio")
		return
	}

	utils.SuccessWithMessage(c, "Studio updated successfully", studio)
}

// ApplyToJoinStudio 申请加入工作室
func (sc *StudioController) ApplyToJoinStudio(c *gin.Context) {
	id := c.Param("id")
	studioID, err := strconv.ParseUint(id, 10, 32)
	if err != nil {
		utils.BadRequest(c, "Invalid studio ID")
		return
	}

	userID, err := middleware.GetCurrentUserID(c)
	if err != nil {
		utils.Unauthorized(c, "User not found")
		return
	}

	var req struct {
		Notes string `json:"notes"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}

	db := config.GetDB()

	// 只有服务者可以申请加入工作室
	userRole, err := middleware.GetCurrentUserRole(c)
	if err != nil || userRole != models.RoleProvider {
		utils.Forbidden(c, "只有服务者可以申请加入工作室")
		return
	}

	// 检查工作室是否存在且可用
	var studio models.Studio
	if err := db.First(&studio, uint(studioID)).Error; err != nil {
		utils.NotFound(c, "Studio not found")
		return
	}
	if !studio.IsActive {
		utils.BadRequest(c, "该工作室已停止运营")
		return
	}

	// 已有申请/已加入时拒绝重复提交；被拒绝或已移出的关系允许重新申请。
	var existingRelation models.ProviderStudioRelation
	if err := db.Where("provider_id = ? AND studio_id = ?", userID, studioID).First(&existingRelation).Error; err == nil {
		if existingRelation.Status == models.StatusPending || existingRelation.Status == models.StatusApproved {
			utils.BadRequest(c, "Application already exists")
			return
		}
		now := time.Now()
		if err := db.Model(&existingRelation).Updates(map[string]interface{}{
			"status":       models.StatusPending,
			"applied_at":   &now,
			"processed_at": nil,
			"notes":        req.Notes,
		}).Error; err != nil {
			utils.InternalServerError(c, "Failed to create application")
			return
		}
		existingRelation.Status = models.StatusPending
		existingRelation.AppliedAt = now
		existingRelation.ProcessedAt = nil
		existingRelation.Notes = req.Notes
		utils.SuccessWithMessage(c, "Application submitted successfully", existingRelation)
		return
	}

	// 创建申请
	relation := models.ProviderStudioRelation{
		ProviderID: userID,
		StudioID:   uint(studioID),
		Status:     models.StatusPending,
		AppliedAt:  time.Now(),
		Notes:      req.Notes,
	}

	if err := db.Create(&relation).Error; err != nil {
		utils.InternalServerError(c, "Failed to create application")
		return
	}

	utils.SuccessWithMessage(c, "Application submitted successfully", relation)
}

// GetStudioApplications 获取工作室的申请列表
func (sc *StudioController) GetStudioApplications(c *gin.Context) {
	id := c.Param("id")
	studioID, err := strconv.ParseUint(id, 10, 32)
	if err != nil {
		utils.BadRequest(c, "Invalid studio ID")
		return
	}

	userID, err := middleware.GetCurrentUserID(c)
	if err != nil {
		utils.Unauthorized(c, "User not found")
		return
	}

	db := config.GetDB()

	// 检查权限：只有工作室所有者可以查看申请
	var studio models.Studio
	if err := db.First(&studio, uint(studioID)).Error; err != nil {
		utils.NotFound(c, "Studio not found")
		return
	}

	if studio.OwnerID != userID {
		utils.Forbidden(c, "Only studio owner can view applications")
		return
	}

	// 分页参数
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "10"))
	status := c.Query("status")

	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 10
	}

	offset := (page - 1) * pageSize

	query := db.Model(&models.ProviderStudioRelation{}).Where("studio_id = ?", studioID)
	if status != "" {
		query = query.Where("status = ?", status)
	}

	var total int64
	query.Count(&total)

	var relations []models.ProviderStudioRelation
	if err := query.Preload("Provider").Offset(offset).Limit(pageSize).Find(&relations).Error; err != nil {
		utils.InternalServerError(c, "Failed to get applications")
		return
	}
	for i := range relations {
		relations[i].Provider.Sanitize()
	}

	utils.PageSuccess(c, relations, total, page, pageSize)
}

// ProcessApplication 处理申请
func (sc *StudioController) ProcessApplication(c *gin.Context) {
	id := c.Param("id")
	relationID, err := strconv.ParseUint(id, 10, 32)
	if err != nil {
		utils.BadRequest(c, "Invalid relation ID")
		return
	}

	userID, err := middleware.GetCurrentUserID(c)
	if err != nil {
		utils.Unauthorized(c, "User not found")
		return
	}

	var req ProcessApplicationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}

	db := config.GetDB()

	// 查找关联关系
	var relation models.ProviderStudioRelation
	if err := db.Preload("Studio").First(&relation, uint(relationID)).Error; err != nil {
		utils.NotFound(c, "Application not found")
		return
	}

	// 检查权限：只有工作室所有者可以处理申请
	if relation.Studio.OwnerID != userID {
		utils.Forbidden(c, "Only studio owner can process applications")
		return
	}

	// 检查申请状态
	if relation.Status != models.StatusPending {
		utils.BadRequest(c, "Application has already been processed")
		return
	}

	// 更新申请状态
	now := time.Now()
	updates := map[string]interface{}{
		"status":       req.Status,
		"processed_at": &now,
		"notes":        req.Notes,
	}

	if err := db.Model(&relation).Updates(updates).Error; err != nil {
		utils.InternalServerError(c, "Failed to process application")
		return
	}

	utils.SuccessWithMessage(c, "Application processed successfully", relation)
}

// StudioMember 工作室成员（含聚合统计）
type StudioMember struct {
	Provider    models.User           `json:"provider"`
	Status      models.RelationStatus `json:"status"`
	PlayerCount int64                 `json:"player_count"`
	MoneyFlow   decimal.Decimal       `json:"money_flow"`
	Rating      float64               `json:"rating"`
	JoinedAt    *time.Time            `json:"joined_at"`
}

// GetStudioMembers 获取工作室成员列表（工作室所有者查看自己的工作室）
func (sc *StudioController) GetStudioMembers(c *gin.Context) {
	userID, err := middleware.GetCurrentUserID(c)
	if err != nil {
		utils.Unauthorized(c, "User not found")
		return
	}

	db := config.GetDB()
	var studio models.Studio
	if err := db.Where("owner_id = ?", userID).First(&studio).Error; err != nil {
		utils.NotFound(c, "未找到你的工作室，请先创建")
		return
	}

	var relations []models.ProviderStudioRelation
	if err := db.Where("studio_id = ? AND status = ?", studio.ID, models.StatusApproved).
		Preload("Provider").Order("processed_at DESC").Find(&relations).Error; err != nil {
		utils.InternalServerError(c, "Failed to get members")
		return
	}

	members := make([]StudioMember, 0, len(relations))
	for _, rel := range relations {
		provider := rel.Provider
		provider.Sanitize()
		m := StudioMember{
			Provider:  provider,
			Status:    rel.Status,
			JoinedAt:  rel.ProcessedAt,
			MoneyFlow: decimal.Zero,
		}
		db.Model(&models.Balance{}).
			Where("provider_id = ? AND studio_id = ?", rel.ProviderID, studio.ID).
			Distinct("player_id").Count(&m.PlayerCount)
		db.Model(&models.Balance{}).
			Where("provider_id = ? AND studio_id = ? AND type = ?", rel.ProviderID, studio.ID, models.BalanceTypeMoney).
			Select("COALESCE(SUM(amount),0)").Scan(&m.MoneyFlow)
		var avg *float64
		db.Model(&models.Review{}).
			Where("target_type = ? AND target_id = ?", models.ReviewTargetProvider, rel.ProviderID).
			Select("AVG(rating)").Scan(&avg)
		if avg != nil {
			m.Rating = *avg
		}
		members = append(members, m)
	}

	utils.Success(c, members)
}

// RemoveMember 工作室移除已加入的服务者（关系置为 removed，可再次申请）
func (sc *StudioController) RemoveMember(c *gin.Context) {
	userID, err := middleware.GetCurrentUserID(c)
	if err != nil {
		utils.Unauthorized(c, "User not found")
		return
	}

	providerID, err := parseUintParam(c.Param("provider_id"))
	if err != nil {
		utils.BadRequest(c, "Invalid provider ID")
		return
	}

	db := config.GetDB()
	var studio models.Studio
	if err := db.Where("owner_id = ?", userID).First(&studio).Error; err != nil {
		utils.NotFound(c, "未找到你的工作室，请先创建")
		return
	}

	var relation models.ProviderStudioRelation
	if err := db.Where("studio_id = ? AND provider_id = ? AND status = ?",
		studio.ID, providerID, models.StatusApproved).First(&relation).Error; err != nil {
		utils.NotFound(c, "该服务者不在工作室中")
		return
	}

	now := time.Now()
	if err := db.Model(&relation).Updates(map[string]interface{}{
		"status":       models.StatusRemoved,
		"processed_at": &now,
	}).Error; err != nil {
		utils.InternalServerError(c, "移除成员失败")
		return
	}

	relation.Status = models.StatusRemoved
	relation.ProcessedAt = &now
	utils.SuccessWithMessage(c, "已移除该成员", relation)
}

// GetMyRelations 服务者查看自己的工作室归属与申请记录
func (sc *StudioController) GetMyRelations(c *gin.Context) {
	userID, err := middleware.GetCurrentUserID(c)
	if err != nil {
		utils.Unauthorized(c, "User not found")
		return
	}

	db := config.GetDB()
	var relations []models.ProviderStudioRelation
	if err := db.Where("provider_id = ?", userID).
		Preload("Studio").Preload("Studio.Owner").Order("applied_at DESC").Find(&relations).Error; err != nil {
		utils.InternalServerError(c, "Failed to get relations")
		return
	}
	for i := range relations {
		relations[i].Studio.Owner.Sanitize()
	}

	utils.Success(c, relations)
}
