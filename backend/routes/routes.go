package routes

import (
	"companion-platform-backend/controllers"
	"companion-platform-backend/middleware"
	"companion-platform-backend/models"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

// SetupRoutes 设置路由
func SetupRoutes(r *gin.Engine) {
	// CORS中间件
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:3000", "http://127.0.0.1:3000"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}))

	// 初始化控制器
	userController := &controllers.UserController{}
	studioController := &controllers.StudioController{}
	balanceController := &controllers.BalanceController{}

	// API分组
	api := r.Group("/api/v1")

	// 健康检查
	api.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok", "message": "Server is running"})
	})

	// 公开路由（不需要认证）
	public := api.Group("/")
	{
		// 用户认证
		public.POST("/register", userController.Register)
		public.POST("/login", userController.Login)

		// 公开信息查看
		public.GET("/studios", studioController.GetStudioList)
		public.GET("/studios/:id", studioController.GetStudioByID)
		public.GET("/users/:id", userController.GetUserByID)
	}

	// 需要认证的路由
	auth := api.Group("/")
	auth.Use(middleware.AuthMiddleware())
	{
		// 用户相关
		auth.GET("/profile", userController.GetProfile)
		auth.PUT("/profile", userController.UpdateProfile)

		// 玩家路由
		player := auth.Group("/player")
		player.Use(middleware.RequireRole(models.RolePlayer))
		{
			player.GET("/balances", balanceController.GetPlayerBalances)
			player.GET("/balances/provider/:provider_id", balanceController.GetBalanceByProvider)
			player.GET("/balances/:id/transactions", balanceController.GetBalanceTransactions)
		}

		// 服务者路由
		provider := auth.Group("/provider")
		provider.Use(middleware.RequireRole(models.RoleProvider))
		{
			provider.GET("/balance-summary", balanceController.GetProviderBalanceSummary)
			provider.POST("/balances", balanceController.AddBalance)
		}

		// 工作室路由
		studio := auth.Group("/studio")
		{
			// 任何用户都可以申请加入工作室
			studio.POST("/:id/apply", studioController.ApplyToJoinStudio)

			// 只有工作室角色可以创建和管理工作室
			studioOnly := studio.Group("/")
			studioOnly.Use(middleware.RequireRole(models.RoleStudio))
			{
				studioOnly.POST("/", studioController.CreateStudio)
				studioOnly.PUT("/:id", studioController.UpdateStudio)
				studioOnly.GET("/:id/applications", studioController.GetStudioApplications)
				studioOnly.PUT("/applications/:id", studioController.ProcessApplication)
				studioOnly.POST("/balances", balanceController.AddBalance)
			}
		}

		// 管理员路由（暂时使用studio角色作为管理员）
		admin := auth.Group("/admin")
		admin.Use(middleware.RequireRole(models.RoleStudio))
		{
			admin.GET("/users", userController.GetUserList)
		}
	}
}