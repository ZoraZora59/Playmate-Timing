package models

import (
	"time"

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
	Username  string         `json:"username" gorm:"unique;not null;size:50"`
	Email     string         `json:"email" gorm:"unique;not null;size:100"`
	Password  string         `json:"-" gorm:"not null"`
	Phone     string         `json:"phone" gorm:"size:20"`
	Nickname  string         `json:"nickname" gorm:"size:50"`
	Avatar    string         `json:"avatar" gorm:"size:255"`
	Role      UserRole       `json:"role" gorm:"not null;default:'player'"`
	IsActive  bool           `json:"is_active" gorm:"default:true"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`

	// 关联
	ProviderRelations []ProviderStudioRelation `json:"provider_relations,omitempty" gorm:"foreignKey:ProviderID"`
	StudioRelations   []ProviderStudioRelation `json:"studio_relations,omitempty" gorm:"foreignKey:StudioID"`
	Balances          []Balance                `json:"balances,omitempty"`
	PlayRecords       []PlayRecord             `json:"play_records,omitempty" gorm:"foreignKey:PlayerID"`
	Reviews           []Review                 `json:"reviews,omitempty" gorm:"foreignKey:PlayerID"`
}

// Studio 工作室表
type Studio struct {
	ID          uint           `json:"id" gorm:"primaryKey"`
	Name        string         `json:"name" gorm:"not null;size:100"`
	Description string         `json:"description" gorm:"type:text"`
	Logo        string         `json:"logo" gorm:"size:255"`
	ContactInfo string         `json:"contact_info" gorm:"type:text"`
	IsActive    bool           `json:"is_active" gorm:"default:true"`
	OwnerID     uint           `json:"owner_id" gorm:"not null"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `json:"-" gorm:"index"`

	// 关联
	Owner     User                     `json:"owner" gorm:"foreignKey:OwnerID"`
	Relations []ProviderStudioRelation `json:"relations,omitempty" gorm:"foreignKey:StudioID"`
	Reviews   []Review                 `json:"reviews,omitempty" gorm:"foreignKey:StudioID"`
}

// RelationStatus 关联状态枚举
type RelationStatus string

const (
	StatusPending  RelationStatus = "pending"  // 待审核
	StatusApproved RelationStatus = "approved" // 已批准
	StatusRejected RelationStatus = "rejected" // 已拒绝
)

// ProviderStudioRelation 服务者-工作室关联表
type ProviderStudioRelation struct {
	ID         uint           `json:"id" gorm:"primaryKey"`
	ProviderID uint           `json:"provider_id" gorm:"not null"`
	StudioID   uint           `json:"studio_id" gorm:"not null"`
	Status     RelationStatus `json:"status" gorm:"not null;default:'pending'"`
	AppliedAt  time.Time      `json:"applied_at"`
	ProcessedAt *time.Time    `json:"processed_at"`
	Notes      string         `json:"notes" gorm:"type:text"`
	CreatedAt  time.Time      `json:"created_at"`
	UpdatedAt  time.Time      `json:"updated_at"`
	DeletedAt  gorm.DeletedAt `json:"-" gorm:"index"`

	// 关联
	Provider User   `json:"provider" gorm:"foreignKey:ProviderID"`
	Studio   Studio `json:"studio" gorm:"foreignKey:StudioID"`

	// 索引
	_ struct{} `gorm:"uniqueIndex:idx_provider_studio,priority:1"`
}

// BalanceType 余额类型枚举
type BalanceType string

const (
	BalanceTypeMoney BalanceType = "money" // 金额
	BalanceTypeTime  BalanceType = "time"  // 时间（分钟）
	BalanceTypePoint BalanceType = "point" // 点数
)

// Balance 余额表
type Balance struct {
	ID         uint        `json:"id" gorm:"primaryKey"`
	PlayerID   uint        `json:"player_id" gorm:"not null"`
	ProviderID uint        `json:"provider_id" gorm:"not null"`
	StudioID   uint        `json:"studio_id" gorm:"not null;default:0"` // 0表示独立服务者
	Type       BalanceType `json:"type" gorm:"not null"`
	Amount     float64     `json:"amount" gorm:"not null;default:0"`
	FrozenAmount float64   `json:"frozen_amount" gorm:"not null;default:0"`
	CreatedAt  time.Time   `json:"created_at"`
	UpdatedAt  time.Time   `json:"updated_at"`

	// 关联
	Player   User `json:"player" gorm:"foreignKey:PlayerID"`
	Provider User `json:"provider" gorm:"foreignKey:ProviderID"`
	Studio   *Studio `json:"studio,omitempty" gorm:"foreignKey:StudioID"`

	// 唯一索引
	_ struct{} `gorm:"uniqueIndex:idx_balance_unique,priority:1"`
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
	ID          uint            `json:"id" gorm:"primaryKey"`
	BalanceID   uint            `json:"balance_id" gorm:"not null"`
	Type        TransactionType `json:"type" gorm:"not null"`
	Amount      float64         `json:"amount" gorm:"not null"`
	BeforeAmount float64        `json:"before_amount" gorm:"not null"`
	AfterAmount float64         `json:"after_amount" gorm:"not null"`
	Description string          `json:"description" gorm:"size:255"`
	OperatorID  uint            `json:"operator_id"` // 操作者ID
	CreatedAt   time.Time       `json:"created_at"`

	// 关联
	Balance  Balance `json:"balance" gorm:"foreignKey:BalanceID"`
	Operator *User   `json:"operator,omitempty" gorm:"foreignKey:OperatorID"`
}

// PlayRecord 游玩记录表
type PlayRecord struct {
	ID          uint      `json:"id" gorm:"primaryKey"`
	PlayerID    uint      `json:"player_id" gorm:"not null"`
	ProviderID  uint      `json:"provider_id" gorm:"not null"`
	StudioID    uint      `json:"studio_id" gorm:"not null;default:0"`
	GameName    string    `json:"game_name" gorm:"size:100"`
	GameMode    string    `json:"game_mode" gorm:"size:50"`
	StartTime   time.Time `json:"start_time" gorm:"not null"`
	EndTime     *time.Time `json:"end_time"`
	Duration    uint      `json:"duration"` // 游玩时长（分钟）
	Amount      float64   `json:"amount"`   // 消费金额
	Status      string    `json:"status" gorm:"size:20;default:'active'"` // active, completed, cancelled
	Description string    `json:"description" gorm:"type:text"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`

	// 关联
	Player   User    `json:"player" gorm:"foreignKey:PlayerID"`
	Provider User    `json:"provider" gorm:"foreignKey:ProviderID"`
	Studio   *Studio `json:"studio,omitempty" gorm:"foreignKey:StudioID"`
}

// Review 评价表
type Review struct {
	ID         uint      `json:"id" gorm:"primaryKey"`
	PlayerID   uint      `json:"player_id" gorm:"not null"`
	TargetType string    `json:"target_type" gorm:"not null"` // provider, studio
	TargetID   uint      `json:"target_id" gorm:"not null"`
	Rating     float32   `json:"rating" gorm:"not null"` // 1-5星评分
	Content    string    `json:"content" gorm:"type:text"`
	Tags       string    `json:"tags" gorm:"size:255"` // JSON格式的标签
	IsAnonymous bool     `json:"is_anonymous" gorm:"default:false"`
	PlayRecordID *uint   `json:"play_record_id"` // 关联的游玩记录
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`

	// 关联
	Player     User        `json:"player" gorm:"foreignKey:PlayerID"`
	PlayRecord *PlayRecord `json:"play_record,omitempty" gorm:"foreignKey:PlayRecordID"`
}

// TableName 设置表名
func (User) TableName() string                     { return "users" }
func (Studio) TableName() string                   { return "studios" }
func (ProviderStudioRelation) TableName() string   { return "provider_studio_relations" }
func (Balance) TableName() string                  { return "balances" }
func (BalanceTransaction) TableName() string       { return "balance_transactions" }
func (PlayRecord) TableName() string               { return "play_records" }
func (Review) TableName() string                   { return "reviews" }