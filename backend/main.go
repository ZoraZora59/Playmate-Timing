package main

import (
	"log"

	"companion-platform-backend/config"
	"companion-platform-backend/routes"
	"companion-platform-backend/utils"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	// 加载 .env（若存在）。已存在的进程环境变量优先，不会被覆盖。
	_ = godotenv.Load()

	// 加载配置
	cfg := config.GetConfig()

	// 设置Gin模式
	gin.SetMode(cfg.Server.Mode)

	// 初始化JWT
	utils.InitJWT(cfg.JWT.Secret)

	// 初始化缓存
	utils.InitCache(cfg.Cache.DefaultExpiration, cfg.Cache.CleanupInterval)

	// 初始化数据库
	if err := config.InitDatabase(cfg); err != nil {
		log.Fatal("Failed to connect database:", err)
	}

	// 创建Gin引擎
	r := gin.New()

	// 添加中间件
	r.Use(gin.Logger())
	r.Use(gin.Recovery())

	// 设置路由
	routes.SetupRoutes(r)

	// 启动服务器
	log.Printf("Server starting on port %s", cfg.Server.Port)
	if err := r.Run(":" + cfg.Server.Port); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}