package config

import (
	"os"
	"strconv"
	"strings"
	"time"
)

type Config struct {
	Server   ServerConfig
	Database DatabaseConfig
	JWT      JWTConfig
	Cache    CacheConfig
	CORS     CORSConfig
}

// CORSConfig 允许跨域访问的来源。生产环境同源部署时可留空，
// 本地开发默认放行 localhost:3000。
type CORSConfig struct {
	Origins []string
}

type ServerConfig struct {
	Host string // 监听地址：默认仅本机，生产由 Nginx 反向代理
	Port string
	Mode string // gin mode: debug, release, test
}

type DatabaseConfig struct {
	Host     string
	Port     string
	User     string
	Password string
	DBName   string
	Charset  string
}

type JWTConfig struct {
	Secret string
	Expire time.Duration
}

type CacheConfig struct {
	DefaultExpiration time.Duration
	CleanupInterval   time.Duration
}

func GetConfig() *Config {
	return &Config{
		Server: ServerConfig{
			Host: getEnv("SERVER_HOST", "127.0.0.1"),
			Port: getEnv("SERVER_PORT", "8080"),
			Mode: getEnv("GIN_MODE", "debug"),
		},
		Database: DatabaseConfig{
			Host:     getEnv("DB_HOST", "localhost"),
			Port:     getEnv("DB_PORT", "3306"),
			User:     getEnv("DB_USER", "root"),
			Password: getEnv("DB_PASSWORD", "password"),
			DBName:   getEnv("DB_NAME", "companion_platform"),
			Charset:  getEnv("DB_CHARSET", "utf8mb4"),
		},
		JWT: JWTConfig{
			Secret: getEnv("JWT_SECRET", "your-secret-key-here"),
			Expire: time.Duration(getEnvInt("JWT_EXPIRE_HOURS", 24)) * time.Hour,
		},
		Cache: CacheConfig{
			DefaultExpiration: 5 * time.Minute,
			CleanupInterval:   10 * time.Minute,
		},
		CORS: CORSConfig{
			Origins: getEnvList("CORS_ORIGINS", []string{"http://localhost:3000", "http://127.0.0.1:3000"}),
		},
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func getEnvInt(key string, defaultValue int) int {
	if value := os.Getenv(key); value != "" {
		if n, err := strconv.Atoi(value); err == nil {
			return n
		}
	}
	return defaultValue
}

func getEnvList(key string, defaultValue []string) []string {
	value := strings.TrimSpace(os.Getenv(key))
	if value == "" {
		return defaultValue
	}
	parts := strings.Split(value, ",")
	out := make([]string, 0, len(parts))
	for _, p := range parts {
		if p = strings.TrimSpace(p); p != "" {
			out = append(out, p)
		}
	}
	if len(out) == 0 {
		return defaultValue
	}
	return out
}
