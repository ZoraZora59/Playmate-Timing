package middleware

import (
	"strings"

	"companion-platform-backend/models"
	"companion-platform-backend/utils"

	"github.com/gin-gonic/gin"
)

// AuthMiddleware JWT认证中间件
func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		token := c.GetHeader("Authorization")
		if token == "" {
			utils.Unauthorized(c, "Missing authorization token")
			c.Abort()
			return
		}

		// 移除 "Bearer " 前缀
		if strings.HasPrefix(token, "Bearer ") {
			token = strings.TrimPrefix(token, "Bearer ")
		}

		claims, err := utils.ParseToken(token)
		if err != nil {
			utils.Unauthorized(c, "Invalid token")
			c.Abort()
			return
		}

		// 将用户信息存储到上下文中
		c.Set("user_id", claims.UserID)
		c.Set("username", claims.Username)
		c.Set("user_role", claims.Role)
		c.Next()
	}
}

// RequireRole 角色权限中间件
func RequireRole(roles ...models.UserRole) gin.HandlerFunc {
	return func(c *gin.Context) {
		userRole, exists := c.Get("user_role")
		if !exists {
			utils.Forbidden(c, "User role not found")
			c.Abort()
			return
		}

		role, ok := userRole.(models.UserRole)
		if !ok {
			utils.Forbidden(c, "Invalid user role")
			c.Abort()
			return
		}

		// 检查用户角色是否在允许的角色列表中
		for _, allowedRole := range roles {
			if role == allowedRole {
				c.Next()
				return
			}
		}

		utils.Forbidden(c, "Insufficient permissions")
		c.Abort()
	}
}

// GetCurrentUserID 获取当前用户ID
func GetCurrentUserID(c *gin.Context) (uint, error) {
	userID, exists := c.Get("user_id")
	if !exists {
		return 0, gin.Error{Err: gin.Error{}.Err, Type: gin.ErrorTypePublic}
	}

	id, ok := userID.(uint)
	if !ok {
		return 0, gin.Error{Err: gin.Error{}.Err, Type: gin.ErrorTypePublic}
	}

	return id, nil
}

// GetCurrentUserRole 获取当前用户角色
func GetCurrentUserRole(c *gin.Context) (models.UserRole, error) {
	userRole, exists := c.Get("user_role")
	if !exists {
		return "", gin.Error{Err: gin.Error{}.Err, Type: gin.ErrorTypePublic}
	}

	role, ok := userRole.(models.UserRole)
	if !ok {
		return "", gin.Error{Err: gin.Error{}.Err, Type: gin.ErrorTypePublic}
	}

	return role, nil
}