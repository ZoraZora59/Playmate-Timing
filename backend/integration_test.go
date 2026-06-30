package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"path/filepath"
	"strconv"
	"sync"
	"testing"
	"time"

	"companion-platform-backend/config"
	"companion-platform-backend/models"
	"companion-platform-backend/routes"
	"companion-platform-backend/utils"

	"github.com/glebarez/sqlite"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	gormlogger "gorm.io/gorm/logger"
)

// newTestApp 构建一个由内存 SQLite 支撑的完整路由，用于用户故事级集成测试。
func newTestApp(t *testing.T) *gin.Engine {
	t.Helper()
	dbPath := filepath.Join(t.TempDir(), "test.db")
	gdb, err := gorm.Open(sqlite.Open(dbPath), &gorm.Config{
		DisableForeignKeyConstraintWhenMigrating: true,
		Logger:                                   gormlogger.Default.LogMode(gormlogger.Silent),
	})
	if err != nil {
		t.Fatalf("open sqlite: %v", err)
	}
	sqlDB, err := gdb.DB()
	if err != nil {
		t.Fatalf("db handle: %v", err)
	}
	sqlDB.SetMaxOpenConns(1) // SQLite 单写者：串行化写入，避免 "database is locked"

	if err := gdb.AutoMigrate(
		&models.User{}, &models.Studio{}, &models.ProviderStudioRelation{},
		&models.Balance{}, &models.BalanceTransaction{}, &models.PlayRecord{}, &models.Review{},
	); err != nil {
		t.Fatalf("migrate: %v", err)
	}

	config.DB = gdb
	utils.InitJWT("test-secret")
	utils.InitCache(5*time.Minute, 10*time.Minute)
	gin.SetMode(gin.TestMode)
	r := gin.New()
	routes.SetupRoutes(r)
	return r
}

func doReq(t *testing.T, r *gin.Engine, method, path, token string, body any) (int, map[string]any) {
	t.Helper()
	var rdr io.Reader
	if body != nil {
		b, _ := json.Marshal(body)
		rdr = bytes.NewReader(b)
	}
	req := httptest.NewRequest(method, path, rdr)
	req.Header.Set("Content-Type", "application/json")
	if token != "" {
		req.Header.Set("Authorization", "Bearer "+token)
	}
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	var out map[string]any
	_ = json.Unmarshal(w.Body.Bytes(), &out)
	return w.Code, out
}

func register(t *testing.T, r *gin.Engine, role, uname, nick string) (token string, id uint) {
	t.Helper()
	code, resp := doReq(t, r, "POST", "/api/v1/register", "", map[string]any{
		"username": uname, "email": uname + "@t.com", "password": "pass123",
		"nickname": nick, "role": role,
	})
	if code != http.StatusOK {
		t.Fatalf("register %s failed: %d %v", uname, code, resp)
	}
	d := resp["data"].(map[string]any)
	token = d["token"].(string)
	id = uint(d["user"].(map[string]any)["id"].(float64))
	return
}

func mustData(t *testing.T, resp map[string]any) map[string]any {
	t.Helper()
	d, ok := resp["data"].(map[string]any)
	if !ok {
		t.Fatalf("response has no data object: %v", resp)
	}
	return d
}

func decStr(v any) string {
	switch x := v.(type) {
	case string:
		return x
	case float64:
		return strconv.FormatFloat(x, 'f', -1, 64)
	default:
		return fmt.Sprintf("%v", v)
	}
}

func decFloat(v any) float64 {
	f, _ := strconv.ParseFloat(decStr(v), 64)
	return f
}

// --- 用户故事 1：认证 ---

func TestRegisterAndLogin(t *testing.T) {
	r := newTestApp(t)

	_, _ = register(t, r, "player", "alice", "Alice")

	// 重复用户名应被拒绝
	code, resp := doReq(t, r, "POST", "/api/v1/register", "", map[string]any{
		"username": "alice", "email": "alice2@t.com", "password": "pass123", "role": "player",
	})
	if resp["code"].(float64) == 0 {
		t.Fatalf("duplicate username should fail, got %d %v", code, resp)
	}

	// 错误密码登录失败
	_, resp = doReq(t, r, "POST", "/api/v1/login", "", map[string]any{"username": "alice", "password": "wrong"})
	if resp["code"].(float64) == 0 {
		t.Fatal("login with wrong password should fail")
	}

	// 正确登录
	code, resp = doReq(t, r, "POST", "/api/v1/login", "", map[string]any{"username": "alice", "password": "pass123"})
	if code != http.StatusOK || resp["code"].(float64) != 0 {
		t.Fatalf("valid login should succeed: %d %v", code, resp)
	}
}

// --- 用户故事 2：服务者给玩家记账，玩家查看 ---

func TestBalanceUserStory(t *testing.T) {
	r := newTestApp(t)
	ptok, pid := register(t, r, "player", "player1", "小柚")
	vtok, vid := register(t, r, "provider", "prov1", "晚风")

	// 充值 200
	code, resp := doReq(t, r, "POST", "/api/v1/provider/balances", vtok, map[string]any{
		"player_id": pid, "provider_id": vid, "type": "money", "amount": 200.00, "description": "微信充值",
	})
	if code != http.StatusOK || resp["code"].(float64) != 0 {
		t.Fatalf("recharge failed: %d %v", code, resp)
	}
	if got := decFloat(mustData(t, resp)["amount"]); got != 200 {
		t.Fatalf("after recharge amount = %v, want 200", got)
	}

	// 玩家控制台
	_, resp = doReq(t, r, "GET", "/api/v1/player/dashboard", ptok, nil)
	d := mustData(t, resp)
	if decFloat(d["money_total"]) != 200 {
		t.Fatalf("dashboard money_total = %v, want 200", d["money_total"])
	}
	if d["provider_count"].(float64) != 1 {
		t.Fatalf("provider_count = %v, want 1", d["provider_count"])
	}

	// 扣费 50 -> 150
	_, resp = doReq(t, r, "POST", "/api/v1/provider/balances/deduct", vtok, map[string]any{
		"player_id": pid, "provider_id": vid, "type": "money", "amount": 50.00,
	})
	if decFloat(mustData(t, resp)["amount"]) != 150 {
		t.Fatalf("after deduct amount = %v, want 150", mustData(t, resp)["amount"])
	}

	// 透支应失败
	_, resp = doReq(t, r, "POST", "/api/v1/provider/balances/deduct", vtok, map[string]any{
		"player_id": pid, "provider_id": vid, "type": "money", "amount": 9999,
	})
	if resp["code"].(float64) == 0 {
		t.Fatal("overdraft deduct should fail")
	}

	// 退款 30 -> 180
	_, resp = doReq(t, r, "POST", "/api/v1/provider/balances/refund", vtok, map[string]any{
		"player_id": pid, "provider_id": vid, "type": "money", "amount": 30.00,
	})
	if decFloat(mustData(t, resp)["amount"]) != 180 {
		t.Fatalf("after refund amount = %v, want 180", mustData(t, resp)["amount"])
	}

	// 服务者只能操作自己名下的余额：用 provider 身份给别的 provider 充值应失败
	_, resp = doReq(t, r, "POST", "/api/v1/provider/balances", vtok, map[string]any{
		"player_id": pid, "provider_id": vid + 999, "type": "money", "amount": 10,
	})
	if resp["code"].(float64) == 0 {
		t.Fatal("provider should not recharge under another provider")
	}
}

// --- 用户故事 3：陪玩记录开始-完成-结算 ---

func TestPlayRecordSettlement(t *testing.T) {
	r := newTestApp(t)
	ptok, pid := register(t, r, "player", "player2", "小柚")
	vtok, vid := register(t, r, "provider", "prov2", "晚风")

	// 先充值 100
	doReq(t, r, "POST", "/api/v1/provider/balances", vtok, map[string]any{
		"player_id": pid, "provider_id": vid, "type": "money", "amount": 100.00,
	})

	// 开始一局
	_, resp := doReq(t, r, "POST", "/api/v1/provider/play-records", vtok, map[string]any{
		"player_id": pid, "game_name": "王者荣耀", "game_mode": "巅峰赛", "settle_type": "money",
	})
	recID := uint(mustData(t, resp)["id"].(float64))

	// 完成并结算 40
	_, resp = doReq(t, r, "PUT", fmt.Sprintf("/api/v1/provider/play-records/%d/complete", recID), vtok, map[string]any{
		"duration": 92, "amount": 40.00, "settle": true,
	})
	if mustData(t, resp)["status"].(string) != "completed" {
		t.Fatalf("record status = %v, want completed", mustData(t, resp)["status"])
	}

	// 余额应为 60
	_, resp = doReq(t, r, "GET", "/api/v1/player/dashboard", ptok, nil)
	if decFloat(mustData(t, resp)["money_total"]) != 60 {
		t.Fatalf("money after settlement = %v, want 60", mustData(t, resp)["money_total"])
	}

	// 玩家可见该记录
	_, resp = doReq(t, r, "GET", "/api/v1/player/records", ptok, nil)
	if mustData(t, resp)["total"].(float64) != 1 {
		t.Fatalf("player records total = %v, want 1", mustData(t, resp)["total"])
	}
}

// --- 用户故事 4：服务者申请加入工作室，工作室审批 ---

func TestStudioApprovalFlow(t *testing.T) {
	r := newTestApp(t)
	vtok, _ := register(t, r, "provider", "prov3", "晚风")
	stok, _ := register(t, r, "studio", "studio1", "星轨")

	// 工作室创建
	_, resp := doReq(t, r, "POST", "/api/v1/studio/", stok, map[string]any{"name": "星轨陪玩", "description": "FPS/MOBA"})
	sid := uint(mustData(t, resp)["id"].(float64))

	// 服务者申请
	code, resp := doReq(t, r, "POST", fmt.Sprintf("/api/v1/studio/%d/apply", sid), vtok, map[string]any{"notes": "想加入"})
	if code != http.StatusOK || resp["code"].(float64) != 0 {
		t.Fatalf("apply failed: %d %v", code, resp)
	}

	// 工作室看到 1 条待审批
	_, resp = doReq(t, r, "GET", "/api/v1/studio/dashboard", stok, nil)
	if mustData(t, resp)["pending_count"].(float64) != 1 {
		t.Fatalf("pending_count = %v, want 1", mustData(t, resp)["pending_count"])
	}

	// 取出申请并批准
	_, resp = doReq(t, r, "GET", fmt.Sprintf("/api/v1/studio/%d/applications", sid), stok, nil)
	list := mustData(t, resp)["list"].([]any)
	relID := uint(list[0].(map[string]any)["id"].(float64))
	_, resp = doReq(t, r, "PUT", fmt.Sprintf("/api/v1/studio/applications/%d", relID), stok, map[string]any{"status": "approved"})
	if resp["code"].(float64) != 0 {
		t.Fatalf("approve failed: %v", resp)
	}

	// 成员列表出现该服务者
	_, resp = doReq(t, r, "GET", "/api/v1/studio/members", stok, nil)
	members := resp["data"].([]any)
	if len(members) != 1 {
		t.Fatalf("members = %d, want 1", len(members))
	}

	// 重复申请应失败
	_, resp = doReq(t, r, "POST", fmt.Sprintf("/api/v1/studio/%d/apply", sid), vtok, map[string]any{"notes": "再申请"})
	if resp["code"].(float64) == 0 {
		t.Fatal("duplicate application should fail")
	}
}

// --- 用户故事 5：玩家评价服务者，评分汇总 ---

func TestReviewFlow(t *testing.T) {
	r := newTestApp(t)
	ptok, _ := register(t, r, "player", "player4", "小柚")
	_, vid := register(t, r, "provider", "prov4", "晚风")

	for _, rating := range []int{5, 4} {
		_, resp := doReq(t, r, "POST", "/api/v1/player/reviews", ptok, map[string]any{
			"target_type": "provider", "target_id": vid, "rating": rating, "content": "不错",
		})
		if resp["code"].(float64) != 0 {
			t.Fatalf("create review failed: %v", resp)
		}
	}

	_, resp := doReq(t, r, "GET", fmt.Sprintf("/api/v1/reviews/summary?target_type=provider&target_id=%d", vid), "", nil)
	d := mustData(t, resp)
	if d["count"].(float64) != 2 {
		t.Fatalf("review count = %v, want 2", d["count"])
	}
	if avg := d["average_rating"].(float64); avg < 4.4 || avg > 4.6 {
		t.Fatalf("average_rating = %v, want ~4.5", avg)
	}
}

// --- 并发：N 次充值不丢失更新 ---

func TestConcurrentRechargeNoLostUpdate(t *testing.T) {
	r := newTestApp(t)
	_, pid := register(t, r, "player", "player5", "小柚")
	vtok, vid := register(t, r, "provider", "prov5", "晚风")

	const n = 20
	var wg sync.WaitGroup
	wg.Add(n)
	for i := 0; i < n; i++ {
		go func() {
			defer wg.Done()
			doReq(t, r, "POST", "/api/v1/provider/balances", vtok, map[string]any{
				"player_id": pid, "provider_id": vid, "type": "money", "amount": 10.00,
			})
		}()
	}
	wg.Wait()

	_, resp := doReq(t, r, "GET", "/api/v1/player/dashboard", ptokOf(t, r, pid), nil)
	_ = resp
	// 用 provider 汇总核对总额，避免再次登录
	_, resp = doReq(t, r, "GET", "/api/v1/provider/balance-summary", vtok, nil)
	rows := resp["data"].([]any)
	if len(rows) != 1 {
		t.Fatalf("summary rows = %d, want 1", len(rows))
	}
	if got := decFloat(rows[0].(map[string]any)["total_amount"]); got != float64(n*10) {
		t.Fatalf("concurrent recharge total = %v, want %d (lost update!)", got, n*10)
	}
}

// ptokOf 重新登录拿到玩家 token（并发测试里玩家未保存 token）
func ptokOf(t *testing.T, r *gin.Engine, _ uint) string {
	_, resp := doReq(t, r, "POST", "/api/v1/login", "", map[string]any{"username": "player5", "password": "pass123"})
	return mustData(t, resp)["token"].(string)
}
