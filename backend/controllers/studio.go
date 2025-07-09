package controllers

import (
	"strconv"
	"time"

	"companion-platform-backend/config"
	"companion-platform-backend/middleware"
	"companion-platform-backend/models"
	"companion-platform-backend/utils"

	"github.com/gin-gonic/gin"
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

	// 检查工作室名称是否已存在
	var existingStudio models.Studio
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

	// 检查工作室是否存在
	var studio models.Studio
	if err := db.First(&studio, uint(studioID)).Error; err != nil {
		utils.NotFound(c, "Studio not found")
		return
	}

	// 检查是否已经有关联关系
	var existingRelation models.ProviderStudioRelation
	if err := db.Where("provider_id = ? AND studio_id = ?", userID, studioID).First(&existingRelation).Error; err == nil {
		utils.BadRequest(c, "Application already exists")
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