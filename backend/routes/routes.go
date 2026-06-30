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
	playRecordController := &controllers.PlayRecordController{}
	reviewController := &controllers.ReviewController{}
	dashboardController := &controllers.DashboardController{}

	// API分组
	api := r.Group("/api/v1")

	// 健康检查
	api.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok", "message": "Server is running"})
	})

	// 公开路由（不需要认证）
	public := api.Group("/")
	{
		public.POST("/register", userController.Register)
		public.POST("/login", userController.Login)

		public.GET("/studios", studioController.GetStudioList)
		public.GET("/studios/:id", studioController.GetStudioByID)
		public.GET("/users/:id", userController.GetUserByID)

		// 公开评价查看
		public.GET("/reviews", reviewController.ListByTarget)
		public.GET("/reviews/summary", reviewController.Summary)
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
			player.GET("/dashboard", dashboardController.PlayerDashboard)
			player.GET("/balances", balanceController.GetPlayerBalances)
			player.GET("/balances/provider/:provider_id", balanceController.GetBalanceByProvider)
			player.GET("/balances/:id/transactions", balanceController.GetBalanceTransactions)
			player.GET("/records", playRecordController.ListMine)
			player.POST("/reviews", reviewController.Create)
			player.GET("/reviews", reviewController.ListMine)
		}

		// 服务者路由
		provider := auth.Group("/provider")
		provider.Use(middleware.RequireRole(models.RoleProvider))
		{
			provider.GET("/dashboard", dashboardController.ProviderDashboard)
			provider.GET("/balance-summary", balanceController.GetProviderBalanceSummary)
			provider.GET("/balances/:id/transactions", balanceController.GetBalanceTransactions)
			provider.POST("/balances", balanceController.Recharge)
			provider.POST("/balances/deduct", balanceController.Deduct)
			provider.POST("/balances/refund", balanceController.Refund)
			provider.POST("/play-records", playRecordController.Create)
			provider.PUT("/play-records/:id/complete", playRecordController.Complete)
			provider.PUT("/play-records/:id/cancel", playRecordController.Cancel)
			provider.GET("/play-records", playRecordController.ListHosted)
			provider.GET("/relations", studioController.GetMyRelations)
		}

		// 工作室路由
		studio := auth.Group("/studio")
		{
			// 任何认证用户都可以申请加入工作室
			studio.POST("/:id/apply", studioController.ApplyToJoinStudio)

			// 只有工作室角色可以创建和管理工作室
			studioOnly := studio.Group("/")
			studioOnly.Use(middleware.RequireRole(models.RoleStudio))
			{
				studioOnly.GET("/dashboard", dashboardController.StudioDashboard)
				studioOnly.GET("/members", studioController.GetStudioMembers)
				studioOnly.POST("/", studioController.CreateStudio)
				studioOnly.PUT("/:id", studioController.UpdateStudio)
				studioOnly.GET("/:id/applications", studioController.GetStudioApplications)
				studioOnly.PUT("/applications/:id", studioController.ProcessApplication)
				studioOnly.POST("/balances", balanceController.Recharge)
				studioOnly.POST("/balances/deduct", balanceController.Deduct)
				studioOnly.POST("/balances/refund", balanceController.Refund)
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
