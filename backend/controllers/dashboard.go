package controllers

import (
	"time"

	"companion-platform-backend/config"
	"companion-platform-backend/middleware"
	"companion-platform-backend/models"
	"companion-platform-backend/utils"

	"github.com/gin-gonic/gin"
	"github.com/shopspring/decimal"
)

type DashboardController struct{}

// PlayerDashboard 玩家控制台聚合数据
func (dc *DashboardController) PlayerDashboard(c *gin.Context) {
	userID, err := middleware.GetCurrentUserID(c)
	if err != nil {
		utils.Unauthorized(c, "User not found")
		return
	}

	db := config.GetDB()

	// 按类型汇总余额
	var typeRows []struct {
		Type  models.BalanceType
		Total decimal.Decimal
	}
	db.Model(&models.Balance{}).
		Select("type, COALESCE(SUM(amount),0) as total").
		Where("player_id = ?", userID).
		Group("type").Scan(&typeRows)

	totals := map[models.BalanceType]decimal.Decimal{
		models.BalanceTypeMoney: decimal.Zero,
		models.BalanceTypeTime:  decimal.Zero,
		models.BalanceTypePoint: decimal.Zero,
	}
	for _, r := range typeRows {
		totals[r.Type] = r.Total
	}

	var providerCount int64
	db.Model(&models.Balance{}).Where("player_id = ?", userID).Distinct("provider_id").Count(&providerCount)

	// 最近流水（跨所有余额）
	var recent []models.BalanceTransaction
	db.Model(&models.BalanceTransaction{}).
		Joins("JOIN balances ON balances.id = balance_transactions.balance_id").
		Where("balances.player_id = ?", userID).
		Preload("Balance.Provider").Preload("Operator").
		Order("balance_transactions.created_at DESC").Limit(8).Find(&recent)

	// 进行中的陪玩
	var ongoing []models.PlayRecord
	db.Where("player_id = ? AND status = ?", userID, models.PlayStatusActive).
		Preload("Provider").Order("start_time DESC").Find(&ongoing)

	utils.Success(c, gin.H{
		"money_total":         totals[models.BalanceTypeMoney],
		"time_total":          totals[models.BalanceTypeTime],
		"point_total":         totals[models.BalanceTypePoint],
		"provider_count":      providerCount,
		"recent_transactions": recent,
		"ongoing_records":     ongoing,
	})
}

// providerPlayerAgg 服务者视角下单个玩家的余额聚合
type providerPlayerAgg struct {
	PlayerID   uint            `json:"player_id"`
	Nickname   string          `json:"nickname"`
	Username   string          `json:"username"`
	Money      decimal.Decimal `json:"money"`
	Time       decimal.Decimal `json:"time"`
	Point      decimal.Decimal `json:"point"`
	LastActive *time.Time      `json:"last_active"`
}

// ProviderDashboard 服务者控制台聚合数据
func (dc *DashboardController) ProviderDashboard(c *gin.Context) {
	userID, err := middleware.GetCurrentUserID(c)
	if err != nil {
		utils.Unauthorized(c, "User not found")
		return
	}

	db := config.GetDB()

	// 收益汇总（按类型）
	var earnings []BalanceSummaryRow
	db.Model(&models.Balance{}).
		Select("type, COALESCE(SUM(amount),0) as total_amount, COUNT(DISTINCT player_id) as player_count").
		Where("provider_id = ?", userID).
		Group("type").Scan(&earnings)

	// 玩家余额按玩家聚合
	var balances []models.Balance
	db.Where("provider_id = ?", userID).Preload("Player").Find(&balances)

	aggMap := map[uint]*providerPlayerAgg{}
	order := []uint{}
	for _, b := range balances {
		agg, ok := aggMap[b.PlayerID]
		if !ok {
			agg = &providerPlayerAgg{
				PlayerID: b.PlayerID,
				Nickname: b.Player.Nickname,
				Username: b.Player.Username,
				Money:    decimal.Zero, Time: decimal.Zero, Point: decimal.Zero,
			}
			aggMap[b.PlayerID] = agg
			order = append(order, b.PlayerID)
		}
		switch b.Type {
		case models.BalanceTypeMoney:
			agg.Money = agg.Money.Add(b.Amount)
		case models.BalanceTypeTime:
			agg.Time = agg.Time.Add(b.Amount)
		case models.BalanceTypePoint:
			agg.Point = agg.Point.Add(b.Amount)
		}
	}

	// 每个玩家最近一次陪玩时间
	var lastRows []struct {
		PlayerID uint
		Last     time.Time
	}
	db.Model(&models.PlayRecord{}).
		Select("player_id, MAX(start_time) as last").
		Where("provider_id = ?", userID).
		Group("player_id").Scan(&lastRows)
	for _, r := range lastRows {
		if agg, ok := aggMap[r.PlayerID]; ok {
			t := r.Last
			agg.LastActive = &t
		}
	}

	activePlayers := make([]providerPlayerAgg, 0, len(order))
	todos := make([]providerPlayerAgg, 0)
	lowThreshold := decimal.NewFromInt(50)
	for _, pid := range order {
		agg := aggMap[pid]
		activePlayers = append(activePlayers, *agg)
		if agg.Money.LessThan(lowThreshold) {
			todos = append(todos, *agg)
		}
	}

	// 近 7 天每日陪玩局数
	weekly := dc.weeklyPlayCounts(userID)

	utils.Success(c, gin.H{
		"earnings":           earnings,
		"player_count":       int64(len(order)),
		"active_players":     activePlayers,
		"weekly_play_counts": weekly,
		"todos":              todos,
	})
}

type dayCount struct {
	Date  string `json:"date"`
	Count int    `json:"count"`
}

func (dc *DashboardController) weeklyPlayCounts(providerID uint) []dayCount {
	db := config.GetDB()
	now := time.Now()
	start := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location()).AddDate(0, 0, -6)

	var records []models.PlayRecord
	db.Select("start_time").Where("provider_id = ? AND start_time >= ?", providerID, start).Find(&records)

	buckets := map[string]int{}
	for _, r := range records {
		buckets[r.StartTime.Format("2006-01-02")]++
	}

	out := make([]dayCount, 0, 7)
	for i := 0; i < 7; i++ {
		d := start.AddDate(0, 0, i).Format("2006-01-02")
		out = append(out, dayCount{Date: d, Count: buckets[d]})
	}
	return out
}

// StudioDashboard 工作室控制台聚合数据
func (dc *DashboardController) StudioDashboard(c *gin.Context) {
	userID, err := middleware.GetCurrentUserID(c)
	if err != nil {
		utils.Unauthorized(c, "User not found")
		return
	}

	db := config.GetDB()

	var studio models.Studio
	if err := db.Where("owner_id = ?", userID).First(&studio).Error; err != nil {
		utils.NotFound(c, "未找到你的工作室，请先创建")
		return
	}

	var memberCount int64
	db.Model(&models.ProviderStudioRelation{}).
		Where("studio_id = ? AND status = ?", studio.ID, models.StatusApproved).Count(&memberCount)

	var servedPlayers int64
	db.Model(&models.Balance{}).Where("studio_id = ?", studio.ID).Distinct("player_id").Count(&servedPlayers)

	now := time.Now()
	startOfMonth := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, now.Location())
	var monthlyFlow decimal.Decimal
	db.Model(&models.BalanceTransaction{}).
		Joins("JOIN balances ON balances.id = balance_transactions.balance_id").
		Where("balances.studio_id = ? AND balance_transactions.type = ? AND balance_transactions.created_at >= ?",
			studio.ID, models.TransactionTypeRecharge, startOfMonth).
		Select("COALESCE(SUM(balance_transactions.amount),0)").Scan(&monthlyFlow)

	var avgRating *float64
	db.Model(&models.Review{}).
		Where("target_type = ? AND target_id = ?", models.ReviewTargetStudio, studio.ID).
		Select("AVG(rating)").Scan(&avgRating)
	rating := 0.0
	if avgRating != nil {
		rating = *avgRating
	}

	var pendingCount int64
	db.Model(&models.ProviderStudioRelation{}).
		Where("studio_id = ? AND status = ?", studio.ID, models.StatusPending).Count(&pendingCount)

	var pending []models.ProviderStudioRelation
	db.Where("studio_id = ? AND status = ?", studio.ID, models.StatusPending).
		Preload("Provider").Order("applied_at DESC").Limit(10).Find(&pending)

	utils.Success(c, gin.H{
		"studio":               studio,
		"member_count":         memberCount,
		"served_player_count":  servedPlayers,
		"monthly_flow":         monthlyFlow,
		"average_rating":       rating,
		"pending_count":        pendingCount,
		"pending_applications": pending,
	})
}
