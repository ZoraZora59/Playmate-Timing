package config

import (
	"fmt"
	"log"

	"companion-platform-backend/models"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

// InitDatabase 初始化数据库连接
func InitDatabase(config *Config) error {
	dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?charset=%s&parseTime=True&loc=Local",
		config.Database.User,
		config.Database.Password,
		config.Database.Host,
		config.Database.Port,
		config.Database.DBName,
		config.Database.Charset,
	)

	var err error
	DB, err = gorm.Open(mysql.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Warn),
		// studio_id=0 是「独立服务者」的约定值，与外键引用完整性冲突，
		// 因此关闭迁移时的外键约束生成；关系完整性由应用层校验保证。
		DisableForeignKeyConstraintWhenMigrating: true,
	})
	if err != nil {
		return fmt.Errorf("failed to connect database: %v", err)
	}

	// 自动迁移数据库表
	err = AutoMigrate()
	if err != nil {
		return fmt.Errorf("failed to migrate database: %v", err)
	}

	log.Println("Database connected and migrated successfully")
	return nil
}

// AutoMigrate 自动迁移数据库表
func AutoMigrate() error {
	return DB.AutoMigrate(
		&models.User{},
		&models.Studio{},
		&models.ProviderStudioRelation{},
		&models.Balance{},
		&models.BalanceTransaction{},
		&models.PlayRecord{},
		&models.Review{},
	)
}

// GetDB 获取数据库实例
func GetDB() *gorm.DB {
	return DB
}