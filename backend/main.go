package main

import (
	"log"
	"net/http"

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

	// 生产环境禁止使用默认/过短的 JWT 密钥
	if cfg.Server.Mode == "release" && (cfg.JWT.Secret == "your-secret-key-here" || len(cfg.JWT.Secret) < 32) {
		log.Fatal("JWT_SECRET must be set to a strong value (>=32 chars) in release mode")
	}

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
	// 生产环境位于 Nginx 之后，仅信任本机代理传入的 X-Forwarded-For。
	if err := r.SetTrustedProxies([]string{"127.0.0.1", "::1"}); err != nil {
		log.Printf("Failed to set trusted proxies: %v", err)
	}

	// 添加中间件
	r.Use(gin.Logger())
	r.Use(gin.Recovery())
	// API 请求体上限 1 MiB，避免超大 JSON 拖垮进程。
	r.Use(func(c *gin.Context) {
		if c.Request.Body != nil {
			c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, 1<<20)
		}
		c.Header("X-Content-Type-Options", "nosniff")
		c.Header("X-Frame-Options", "DENY")
		c.Header("Referrer-Policy", "strict-origin-when-cross-origin")
		c.Next()
	})

	// 设置路由
	routes.SetupRoutes(r)

	// 启动服务器
	log.Printf("Server starting on %s:%s", cfg.Server.Host, cfg.Server.Port)
	if err := r.Run(cfg.Server.Host + ":" + cfg.Server.Port); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}
