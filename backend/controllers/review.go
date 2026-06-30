package controllers

import (
	"companion-platform-backend/config"
	"companion-platform-backend/middleware"
	"companion-platform-backend/models"
	"companion-platform-backend/utils"

	"github.com/gin-gonic/gin"
)

type ReviewController struct{}

// CreateReviewRequest 创建评价请求
type CreateReviewRequest struct {
	TargetType   models.ReviewTargetType `json:"target_type" binding:"required,oneof=provider studio"`
	TargetID     uint                    `json:"target_id" binding:"required"`
	Rating       int                     `json:"rating" binding:"required,min=1,max=5"`
	Content      string                  `json:"content"`
	Tags         string                  `json:"tags"`
	IsAnonymous  bool                    `json:"is_anonymous"`
	PlayRecordID *uint                   `json:"play_record_id"`
}

// Create 玩家创建评价
func (rc *ReviewController) Create(c *gin.Context) {
	userID, err := middleware.GetCurrentUserID(c)
	if err != nil {
		utils.Unauthorized(c, "User not found")
		return
	}

	var req CreateReviewRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}

	db := config.GetDB()

	// 校验评价对象存在
	if req.TargetType == models.ReviewTargetProvider {
		var u models.User
		if err := db.Where("id = ? AND role = ?", req.TargetID, models.RoleProvider).First(&u).Error; err != nil {
			utils.BadRequest(c, "评价的服务者不存在")
			return
		}
	} else {
		var s models.Studio
		if err := db.First(&s, req.TargetID).Error; err != nil {
			utils.BadRequest(c, "评价的工作室不存在")
			return
		}
	}

	review := models.Review{
		PlayerID:     userID,
		TargetType:   req.TargetType,
		TargetID:     req.TargetID,
		Rating:       req.Rating,
		Content:      req.Content,
		Tags:         req.Tags,
		IsAnonymous:  req.IsAnonymous,
		PlayRecordID: req.PlayRecordID,
	}

	if err := db.Create(&review).Error; err != nil {
		utils.InternalServerError(c, "Failed to create review")
		return
	}

	utils.SuccessWithMessage(c, "评价已提交", review)
}

// ListByTarget 查看某个对象（服务者/工作室）的评价列表（公开）
func (rc *ReviewController) ListByTarget(c *gin.Context) {
	targetType := c.Query("target_type")
	targetID := c.Query("target_id")
	if targetType == "" || targetID == "" {
		utils.BadRequest(c, "缺少 target_type 或 target_id")
		return
	}

	db := config.GetDB()
	page, pageSize, offset := paginate(c)

	query := db.Model(&models.Review{}).Where("target_type = ? AND target_id = ?", targetType, targetID)

	var total int64
	query.Count(&total)

	var reviews []models.Review
	if err := query.Preload("Player").Order("created_at DESC").Offset(offset).Limit(pageSize).Find(&reviews).Error; err != nil {
		utils.InternalServerError(c, "Failed to get reviews")
		return
	}

	// 匿名评价隐藏玩家身份
	for i := range reviews {
		if reviews[i].IsAnonymous {
			reviews[i].Player = models.User{Nickname: "匿名用户"}
			reviews[i].PlayerID = 0
		}
	}

	utils.PageSuccess(c, reviews, total, page, pageSize)
}

// ReviewSummary 评分汇总
type ReviewSummary struct {
	AverageRating float64       `json:"average_rating"`
	Count         int64         `json:"count"`
	Distribution  map[int]int64 `json:"distribution"` // 各星级数量
}

// Summary 某个对象的评分汇总（平均分、数量、星级分布）
func (rc *ReviewController) Summary(c *gin.Context) {
	targetType := c.Query("target_type")
	targetID := c.Query("target_id")
	if targetType == "" || targetID == "" {
		utils.BadRequest(c, "缺少 target_type 或 target_id")
		return
	}

	db := config.GetDB()

	var rows []struct {
		Rating int
		Cnt    int64
	}
	if err := db.Model(&models.Review{}).
		Select("rating, COUNT(*) as cnt").
		Where("target_type = ? AND target_id = ?", targetType, targetID).
		Group("rating").Scan(&rows).Error; err != nil {
		utils.InternalServerError(c, "Failed to get review summary")
		return
	}

	summary := ReviewSummary{Distribution: map[int]int64{1: 0, 2: 0, 3: 0, 4: 0, 5: 0}}
	var weighted, count int64
	for _, r := range rows {
		summary.Distribution[r.Rating] = r.Cnt
		weighted += int64(r.Rating) * r.Cnt
		count += r.Cnt
	}
	summary.Count = count
	if count > 0 {
		summary.AverageRating = float64(weighted) / float64(count)
	}

	utils.Success(c, summary)
}

// ListMine 玩家查看自己的评价
func (rc *ReviewController) ListMine(c *gin.Context) {
	userID, err := middleware.GetCurrentUserID(c)
	if err != nil {
		utils.Unauthorized(c, "User not found")
		return
	}

	db := config.GetDB()
	page, pageSize, offset := paginate(c)

	query := db.Model(&models.Review{}).Where("player_id = ?", userID)
	var total int64
	query.Count(&total)

	var reviews []models.Review
	if err := query.Preload("PlayRecord").Order("created_at DESC").Offset(offset).Limit(pageSize).Find(&reviews).Error; err != nil {
		utils.InternalServerError(c, "Failed to get reviews")
		return
	}

	utils.PageSuccess(c, reviews, total, page, pageSize)
}
