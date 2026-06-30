# AGENTS.md

> 本文件是 Claude Code / Codex 等 AI 编码助手的共享指南。
> `CLAUDE.md` 是指向本文件的软链接 —— **只维护这一份**，两个工具读到的内容一致。

## 项目是什么

**陪玩服务信息平台**（Playmate-Timing / companion-platform）：面向陪玩工作室、陪玩服务者、玩家的信息管理平台。三种角色：

- **玩家 (player)**：查看余额、游玩记录、评价服务
- **陪玩服务者 (provider)**：管理玩家余额、申请加入工作室（`studio_id=0` 表示独立服务者）
- **工作室 (studio)**：管理多个服务者、审批关联申请、统一运营（当前也临时充当管理员角色）

Monorepo，两个独立子项目：`backend/`（Go API）+ `frontend/`（Next.js Web）。

## 技术栈

| | 后端 | 前端 |
|---|---|---|
| 语言/运行时 | Go 1.24.2 | TypeScript 5 / Node 18+ |
| 框架 | Gin (`gin-gonic/gin`) | Next.js 15 (App Router, Turbopack) |
| 数据/状态 | GORM + MySQL 8.0+ | Zustand (persist) |
| 认证 | JWT HS256 (`golang-jwt/jwt/v4`) + bcrypt | localStorage token |
| 其它 | go-cache 内存缓存、gin-contrib/cors | Ant Design 5、Axios、Tailwind CSS v4 |

Go module 名：`companion-platform-backend`（import 路径前缀就是它）。

## 目录结构

```
backend/
  main.go                # 入口：加载配置 → 初始化 JWT/缓存/DB → 注册路由 → 启动
  config/                # config.go(环境变量) + database.go(GORM 连接 + AutoMigrate)
  models/models.go       # 所有 GORM 模型集中在一个文件
  controllers/           # user.go / studio.go / balance.go
  middleware/auth.go     # AuthMiddleware（JWT 解析）+ RequireRole（RBAC）
  routes/routes.go       # 全部路由 + CORS 配置
  utils/                 # auth.go(JWT/bcrypt) response.go(统一响应) cache.go
frontend/src/
  app/                   # App Router 页面：page / layout / auth/{login,register} / dashboard / studios
  lib/api.ts             # Axios 封装的 ApiClient（单例 apiClient）
  store/auth.ts          # Zustand 认证 store（persist key: "auth-storage"）
  types/index.ts         # 所有 TS 类型集中在一个文件
```

## 常用命令

后端（在 `backend/` 下）：
```bash
go mod tidy        # 安装/同步依赖
go run main.go     # 启动，默认 :8080
go build -o companion-platform-backend
go vet ./...       # 静态检查（当前无测试文件，go test ./... 不会执行任何用例）
```

前端（在 `frontend/` 下）：
```bash
npm install
npm run dev        # 开发，:3000，使用 turbopack
npm run build      # 生产构建
npm run start      # 生产启动
npm run lint       # ESLint (eslint-config-next)
```

## 关键约定

### API 响应信封（前后端契约，改一边必须改另一边）
所有业务接口统一返回 `{ code, message, data }`（见 `utils/response.go`）：
- `code === 0` 表示成功；**前端 `lib/api.ts` 据此判断**，`code !== 0` 直接 throw `message`。
- 错误辅助函数：`BadRequest/Unauthorized/Forbidden/NotFound/InternalServerError` 会同时设置匹配的 HTTP status 和 code；而通用 `Error()` 返回 HTTP 200 + 非零 code。
- 分页用 `PageSuccess` → `{ list, total, page, page_size }`。

### 认证 / 鉴权
- 请求头：`Authorization: Bearer <token>`。
- `AuthMiddleware` 解析 JWT，向 gin.Context 注入 `user_id` / `username` / `user_role`；用 `middleware.GetCurrentUserID(c)` 取值。
- 角色限制用 `RequireRole(models.Role...)`。路由分三层：`public`（无需登录）/ `auth`（需登录）/ 角色子组（`/player`、`/provider`、`/studio`、`/admin`）。
- 前端 token 存 `localStorage`，401 时拦截器自动清 token 并跳 `/auth/login`。

### 数据模型
- 实体：`User / Studio / ProviderStudioRelation / Balance / BalanceTransaction / PlayRecord / Review`，全部在 `models/models.go`。
- 余额三种类型：`money / time / point`（`BalanceType`）；交易类型：`recharge/consume/refund/freeze/unfreeze`。
- `studio_id = 0` 是约定值，表示「独立服务者」（无工作室归属）。
- 关联状态：`pending / approved / rejected`。
- 启动时 `config.AutoMigrate()` 自动建表/迁移，**需先有可连接的 MySQL 且目标库已存在**。

### 代码风格
- 注释、用户可见文案以中文为主，与现有代码保持一致。
- 后端模型/控制器倾向「单文件聚合」（models、types 各自一个文件），新增同类内容优先加到既有文件而非新建。
- 前端路径别名：`@/*` → `frontend/src/*`（见 tsconfig）。

## 配置与环境

后端配置全部来自环境变量，带默认值（见 `config/config.go`）：`SERVER_PORT`(8080) `GIN_MODE`(debug) `DB_HOST/PORT/USER/PASSWORD/NAME/CHARSET` `JWT_SECRET`。参考 `backend/.env.example`。

前端：`NEXT_PUBLIC_API_URL`（默认 `http://localhost:8080/api/v1`）、`NEXT_PUBLIC_APP_NAME`，放在 `frontend/.env.local`。

## ⚠️ 注意事项（容易踩的坑）

1. **`.env` 不会被自动加载**。后端没有引入 godotenv，`config.go` 直接读 `os.Getenv`。`cp .env.example .env` 后还需把变量 `export` 到 shell（或用进程环境注入），否则只会使用代码里的默认值。Readme 在这点上有误导。
2. **目前没有任何测试**。Go 无 `*_test.go`；前端 `package.json` 也**没有 `test` 脚本**（只有 dev/build/start/lint），所以 Readme 里的 `npm run test` 会失败。新增逻辑请自带测试。
3. **默认 `JWT_SECRET=your-secret-key-here`**，生产必须覆盖。
4. **Tailwind v4**：通过 `@tailwindcss/postcss` 集成，仓库里**没有 `tailwind.config.ts`**（Readme 提到的是旧写法），配置看 `postcss.config.mjs` 和 `globals.css`。
5. CORS 在 `routes.go` 里硬编码只允许 `localhost:3000` / `127.0.0.1:3000`，换前端域名要同步改。
6. 当前没有独立 admin 角色，`/admin` 组复用了 `studio` 角色做权限校验。

## 修改文件后

- 改了 `models/` 或 API 形状：同步更新 `frontend/src/types/index.ts` 与 `frontend/src/lib/api.ts`，保持前后端契约一致。
- 提交前至少跑通：后端 `go build ./...` + `go vet ./...`；前端 `npm run lint` + `npm run build`。
