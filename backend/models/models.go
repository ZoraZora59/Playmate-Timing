package models

import (
	"time"

	"github.com/shopspring/decimal"
	"gorm.io/gorm"
)

// UserRole 用户角色枚举
type UserRole string

const (
	RolePlayer   UserRole = "player"   // 玩家
	RoleProvider UserRole = "provider" // 陪玩服务者
	RoleStudio   UserRole = "studio"   // 工作室
)

// User 用户表
type User struct {
	ID        uint           `json:"id" gorm:"primaryKey"`
	Username  string         `json:"username" gorm:"uniqueIndex;not null;size:50"`
	Email     string         `json:"email" gorm:"uniqueIndex;not null;size:100"`
	Password  string         `json:"-" gorm:"not null"`
	Phone     string         `json:"phone" gorm:"size:20"`
	Nickname  string         `json:"nickname" gorm:"size:50"`
	Avatar    string         `json:"avatar" gorm:"size:255"`
	Role      UserRole       `json:"role" gorm:"not null;default:'player';size:20;index"`
	IsActive  bool           `json:"is_active" gorm:"default:true"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`

	// 关联
	ProviderRelations []ProviderStudioRelation `json:"provider_relations,omitempty" gorm:"foreignKey:ProviderID"`
	Balances          []Balance                `json:"balances,omitempty" gorm:"foreignKey:PlayerID"`
	PlayRecords       []PlayRecord             `json:"play_records,omitempty" gorm:"foreignKey:PlayerID"`
	Reviews           []Review                 `json:"reviews,omitempty" gorm:"foreignKey:PlayerID"`
}

// Studio 工作室表
type Studio struct {
	ID          uint           `json:"id" gorm:"primaryKey"`
	Name        string         `json:"name" gorm:"not null;size:100;index"`
	Description string         `json:"description" gorm:"type:text"`
	Logo        string         `json:"logo" gorm:"size:255"`
	ContactInfo string         `json:"contact_info" gorm:"type:text"`
	IsActive    bool           `json:"is_active" gorm:"default:true"`
	OwnerID     uint           `json:"owner_id" gorm:"not null;index"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `json:"-" gorm:"index"`

	// 关联
	Owner     User                     `json:"owner" gorm:"foreignKey:OwnerID"`
	Relations []ProviderStudioRelation `json:"relations,omitempty" gorm:"foreignKey:StudioID"`
	Reviews   []Review                 `json:"reviews,omitempty" gorm:"-"` // 多态评价，按 target_type/target_id 手动查询
}

// RelationStatus 关联状态枚举
type RelationStatus string

const (
	StatusPending  RelationStatus = "pending"  // 待审核
	StatusApproved RelationStatus = "approved" // 已批准
	StatusRejected RelationStatus = "rejected" // 已拒绝
)

// ProviderStudioRelation 服务者-工作室关联表
// (provider_id, studio_id) 唯一：一个服务者对一个工作室只保留一条关系记录，状态在其上流转。
type ProviderStudioRelation struct {
	ID          uint           `json:"id" gorm:"primaryKey"`
	ProviderID  uint           `json:"provider_id" gorm:"not null;uniqueIndex:idx_provider_studio,priority:1"`
	StudioID    uint           `json:"studio_id" gorm:"not null;uniqueIndex:idx_provider_studio,priority:2"`
	Status      RelationStatus `json:"status" gorm:"not null;default:'pending';size:20;index"`
	AppliedAt   time.Time      `json:"applied_at"`
	ProcessedAt *time.Time     `json:"processed_at"`
	Notes       string         `json:"notes" gorm:"type:text"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `json:"-" gorm:"index"`

	// 关联
	Provider User   `json:"provider" gorm:"foreignKey:ProviderID"`
	Studio   Studio `json:"studio,omitempty" gorm:"foreignKey:StudioID"`
}

// BalanceType 余额类型枚举
type BalanceType string

const (
	BalanceTypeMoney BalanceType = "money" // 金额（元，decimal）
	BalanceTypeTime  BalanceType = "time"  // 时间（分钟）
	BalanceTypePoint BalanceType = "point" // 点数
)

// Balance 余额表
// 余额按 (player_id, provider_id, studio_id, type) 唯一记账：玩家在每位服务者处、每种类型各一条。
// studio_id = 0 表示独立服务者（无工作室归属）。外键约束在迁移时关闭，故 0 是合法约定值。
type Balance struct {
	ID           uint            `json:"id" gorm:"primaryKey"`
	PlayerID     uint            `json:"player_id" gorm:"not null;uniqueIndex:idx_balance_unique,priority:1;index:idx_balance_player"`
	ProviderID   uint            `json:"provider_id" gorm:"not null;uniqueIndex:idx_balance_unique,priority:2;index:idx_balance_provider"`
	StudioID     uint            `json:"studio_id" gorm:"not null;default:0;uniqueIndex:idx_balance_unique,priority:3"`
	Type         BalanceType     `json:"type" gorm:"not null;size:20;uniqueIndex:idx_balance_unique,priority:4"`
	Amount       decimal.Decimal `json:"amount" gorm:"type:decimal(14,2);not null;default:0"`
	FrozenAmount decimal.Decimal `json:"frozen_amount" gorm:"type:decimal(14,2);not null;default:0"`
	CreatedAt    time.Time       `json:"created_at"`
	UpdatedAt    time.Time       `json:"updated_at"`

	// 关联
	Player   User    `json:"player,omitempty" gorm:"foreignKey:PlayerID"`
	Provider User    `json:"provider,omitempty" gorm:"foreignKey:ProviderID"`
	Studio   *Studio `json:"studio,omitempty" gorm:"foreignKey:StudioID"`
}

// TransactionType 交易类型枚举
type TransactionType string

const (
	TransactionTypeRecharge TransactionType = "recharge" // 充值
	TransactionTypeConsume  TransactionType = "consume"  // 消费
	TransactionTypeRefund   TransactionType = "refund"   // 退款
	TransactionTypeFreeze   TransactionType = "freeze"   // 冻结
	TransactionTypeUnfreeze TransactionType = "unfreeze" // 解冻
)

// BalanceTransaction 余额变动记录表
type BalanceTransaction struct {
	ID           uint            `json:"id" gorm:"primaryKey"`
	BalanceID    uint            `json:"balance_id" gorm:"not null;index:idx_tx_balance"`
	Type         TransactionType `json:"type" gorm:"not null;size:20;index"`
	Amount       decimal.Decimal `json:"amount" gorm:"type:decimal(14,2);not null"`            // 本次变动（正数）
	BeforeAmount decimal.Decimal `json:"before_amount" gorm:"type:decimal(14,2);not null"`     // 变动前
	AfterAmount  decimal.Decimal `json:"after_amount" gorm:"type:decimal(14,2);not null"`      // 变动后
	Description  string          `json:"description" gorm:"size:255"`
	OperatorID   uint            `json:"operator_id" gorm:"index"` // 操作者ID
	CreatedAt    time.Time       `json:"created_at" gorm:"index"`

	// 关联
	Balance  Balance `json:"balance,omitempty" gorm:"foreignKey:BalanceID"`
	Operator *User   `json:"operator,omitempty" gorm:"foreignKey:OperatorID"`
}

// PlayStatus 游玩记录状态枚举
type PlayStatus string

const (
	PlayStatusActive    PlayStatus = "active"    // 进行中
	PlayStatusCompleted PlayStatus = "completed" // 已完成
	PlayStatusCancelled PlayStatus = "cancelled" // 已取消
)

// PlayRecord 游玩记录表
type PlayRecord struct {
	ID          uint            `json:"id" gorm:"primaryKey"`
	PlayerID    uint            `json:"player_id" gorm:"not null;index:idx_record_player"`
	ProviderID  uint            `json:"provider_id" gorm:"not null;index:idx_record_provider"`
	StudioID    uint            `json:"studio_id" gorm:"not null;default:0"`
	GameName    string          `json:"game_name" gorm:"size:100"`
	GameMode    string          `json:"game_mode" gorm:"size:50"`
	StartTime   time.Time       `json:"start_time" gorm:"not null"`
	EndTime     *time.Time      `json:"end_time"`
	Duration    uint            `json:"duration"`                                        // 游玩时长（分钟）
	Amount      decimal.Decimal `json:"amount" gorm:"type:decimal(14,2);not null;default:0"` // 消费数额（按 settle_type 计）
	SettleType  BalanceType     `json:"settle_type" gorm:"size:20;default:'money'"`      // 结算余额类型
	Status      PlayStatus      `json:"status" gorm:"size:20;default:'active';index"`
	Description string          `json:"description" gorm:"type:text"`
	CreatedAt   time.Time       `json:"created_at"`
	UpdatedAt   time.Time       `json:"updated_at"`

	// 关联
	Player   User    `json:"player,omitempty" gorm:"foreignKey:PlayerID"`
	Provider User    `json:"provider,omitempty" gorm:"foreignKey:ProviderID"`
	Studio   *Studio `json:"studio,omitempty" gorm:"foreignKey:StudioID"`
}

// ReviewTargetType 评价对象类型枚举
type ReviewTargetType string

const (
	ReviewTargetProvider ReviewTargetType = "provider" // 评价服务者
	ReviewTargetStudio   ReviewTargetType = "studio"   // 评价工作室
)

// Review 评价表（多态：target_type + target_id 指向服务者或工作室）
type Review struct {
	ID           uint             `json:"id" gorm:"primaryKey"`
	PlayerID     uint             `json:"player_id" gorm:"not null;index"`
	TargetType   ReviewTargetType `json:"target_type" gorm:"not null;size:20;index:idx_review_target,priority:1"`
	TargetID     uint             `json:"target_id" gorm:"not null;index:idx_review_target,priority:2"`
	Rating       int              `json:"rating" gorm:"not null"` // 1-5 星
	Content      string           `json:"content" gorm:"type:text"`
	Tags         string           `json:"tags" gorm:"size:255"` // JSON 数组字符串
	IsAnonymous  bool             `json:"is_anonymous" gorm:"default:false"`
	PlayRecordID *uint            `json:"play_record_id" gorm:"index"` // 关联的游玩记录
	CreatedAt    time.Time        `json:"created_at"`
	UpdatedAt    time.Time        `json:"updated_at"`

	// 关联
	Player     User        `json:"player,omitempty" gorm:"foreignKey:PlayerID"`
	PlayRecord *PlayRecord `json:"play_record,omitempty" gorm:"foreignKey:PlayRecordID"`
}

// TableName 设置表名
func (User) TableName() string                   { return "users" }
func (Studio) TableName() string                 { return "studios" }
func (ProviderStudioRelation) TableName() string { return "provider_studio_relations" }
func (Balance) TableName() string                { return "balances" }
func (BalanceTransaction) TableName() string     { return "balance_transactions" }
func (PlayRecord) TableName() string             { return "play_records" }
func (Review) TableName() string                 { return "reviews" }
