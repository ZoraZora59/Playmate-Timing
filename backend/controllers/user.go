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

type UserController struct{}

// RegisterRequest 注册请求
type RegisterRequest struct {
	Username string           `json:"username" binding:"required,min=3,max=50"`
	Email    string           `json:"email" binding:"required,email"`
	Password string           `json:"password" binding:"required,min=6"`
	Phone    string           `json:"phone"`
	Nickname string           `json:"nickname"`
	Role     models.UserRole  `json:"role" binding:"required,oneof=player provider studio"`
}

// LoginRequest 登录请求
type LoginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

// LoginResponse 登录响应
type LoginResponse struct {
	Token string      `json:"token"`
	User  models.User `json:"user"`
}

// Register 用户注册
func (uc *UserController) Register(c *gin.Context) {
	var req RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}

	db := config.GetDB()

	// 检查用户名是否已存在
	var existingUser models.User
	if err := db.Where("username = ? OR email = ?", req.Username, req.Email).First(&existingUser).Error; err == nil {
		utils.BadRequest(c, "Username or email already exists")
		return
	}

	// 加密密码
	hashedPassword, err := utils.HashPassword(req.Password)
	if err != nil {
		utils.InternalServerError(c, "Failed to hash password")
		return
	}

	// 创建用户
	user := models.User{
		Username: req.Username,
		Email:    req.Email,
		Password: hashedPassword,
		Phone:    req.Phone,
		Nickname: req.Nickname,
		Role:     req.Role,
		IsActive: true,
	}

	if err := db.Create(&user).Error; err != nil {
		utils.InternalServerError(c, "Failed to create user")
		return
	}

	// 生成token
	cfg := config.GetConfig()
	token, err := utils.GenerateToken(&user, cfg.JWT.Expire)
	if err != nil {
		utils.InternalServerError(c, "Failed to generate token")
		return
	}

	utils.Success(c, LoginResponse{
		Token: token,
		User:  user,
	})
}

// Login 用户登录
func (uc *UserController) Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}

	db := config.GetDB()

	// 查找用户
	var user models.User
	if err := db.Where("username = ? OR email = ?", req.Username, req.Username).First(&user).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			utils.BadRequest(c, "Invalid username or password")
			return
		}
		utils.InternalServerError(c, "Database error")
		return
	}

	// 验证密码
	if !utils.CheckPassword(user.Password, req.Password) {
		utils.BadRequest(c, "Invalid username or password")
		return
	}

	// 检查用户是否激活
	if !user.IsActive {
		utils.BadRequest(c, "User account is disabled")
		return
	}

	// 生成token
	cfg := config.GetConfig()
	token, err := utils.GenerateToken(&user, cfg.JWT.Expire)
	if err != nil {
		utils.InternalServerError(c, "Failed to generate token")
		return
	}

	utils.Success(c, LoginResponse{
		Token: token,
		User:  user,
	})
}

// GetProfile 获取当前用户信息
func (uc *UserController) GetProfile(c *gin.Context) {
	userID, err := middleware.GetCurrentUserID(c)
	if err != nil {
		utils.Unauthorized(c, "User not found")
		return
	}

	db := config.GetDB()
	var user models.User
	if err := db.First(&user, userID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			utils.NotFound(c, "User not found")
			return
		}
		utils.InternalServerError(c, "Database error")
		return
	}

	utils.Success(c, user)
}

// UpdateProfile 更新用户信息
func (uc *UserController) UpdateProfile(c *gin.Context) {
	userID, err := middleware.GetCurrentUserID(c)
	if err != nil {
		utils.Unauthorized(c, "User not found")
		return
	}

	var req struct {
		Phone    string `json:"phone"`
		Nickname string `json:"nickname"`
		Avatar   string `json:"avatar"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}

	db := config.GetDB()
	var user models.User
	if err := db.First(&user, userID).Error; err != nil {
		utils.NotFound(c, "User not found")
		return
	}

	// 更新用户信息
	updates := map[string]interface{}{}
	if req.Phone != "" {
		updates["phone"] = req.Phone
	}
	if req.Nickname != "" {
		updates["nickname"] = req.Nickname
	}
	if req.Avatar != "" {
		updates["avatar"] = req.Avatar
	}

	if err := db.Model(&user).Updates(updates).Error; err != nil {
		utils.InternalServerError(c, "Failed to update profile")
		return
	}

	utils.SuccessWithMessage(c, "Profile updated successfully", user)
}

// GetUserList 获取用户列表（管理员功能）
func (uc *UserController) GetUserList(c *gin.Context) {
	db := config.GetDB()
	
	// 分页参数
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "10"))
	role := c.Query("role")
	
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 10
	}

	offset := (page - 1) * pageSize

	query := db.Model(&models.User{})
	if role != "" {
		query = query.Where("role = ?", role)
	}

	var total int64
	query.Count(&total)

	var users []models.User
	if err := query.Offset(offset).Limit(pageSize).Find(&users).Error; err != nil {
		utils.InternalServerError(c, "Failed to get user list")
		return
	}

	utils.PageSuccess(c, users, total, page, pageSize)
}

// GetUserByID 根据ID获取用户信息
func (uc *UserController) GetUserByID(c *gin.Context) {
	id := c.Param("id")
	userID, err := strconv.ParseUint(id, 10, 32)
	if err != nil {
		utils.BadRequest(c, "Invalid user ID")
		return
	}

	db := config.GetDB()
	var user models.User
	if err := db.First(&user, uint(userID)).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			utils.NotFound(c, "User not found")
			return
		}
		utils.InternalServerError(c, "Database error")
		return
	}

	utils.Success(c, user)
}