# 陪玩服务信息平台

一个专业的陪玩工作室、陪玩服务者、玩家客户使用的信息管理平台。

## 🎯 项目概述

该平台为陪玩行业提供全方位的信息管理服务，支持三种用户角色：
- **玩家**: 查看余额、游玩记录、评价服务
- **陪玩服务者**: 管理客户余额、申请加入工作室  
- **工作室**: 管理多个服务者、统一业务运营

## ✨ 功能特性

### 👥 多角色支持
- 玩家、陪玩服务者、工作室三种角色
- 基于角色的权限控制
- 灵活的用户注册和认证系统

### 🏢 工作室管理
- 工作室创建和信息管理
- 服务者关联申请审批
- 关联关系的解绑和管理
- 支持独立服务者（组ID为0）

### 💰 余额管理系统
- 支持多种余额类型：金额、时间、点数
- 完整的余额变动记录
- 工作室和服务者可为玩家充值
- 实时余额查询和统计

### 📊 游玩记录
- 详细的游玩服务记录
- 游戏名称、模式、时长统计
- 消费金额和状态跟踪

### ⭐ 评价评分系统
- 玩家对工作室/服务者评价
- 星级评分和文字评价
- 匿名评价支持
- 评价统计和展示

### 🔗 关联管理
- 服务者申请加入工作室
- 工作室审批关联申请
- 支持多工作室关联
- 关联状态管理（待审核、已批准、已拒绝）

## 🛠 技术栈

### 后端 (Go)
- **框架**: Gin Web Framework
- **数据库**: MySQL 8.0+
- **ORM**: GORM
- **金额**: shopspring/decimal（列 `decimal(14,2)`，JSON 序列化为字符串）
- **认证**: JWT (golang-jwt/jwt)
- **缓存**: go-cache (内存缓存)
- **跨域**: gin-contrib/cors
- **密码加密**: bcrypt
- **配置**: godotenv 自动加载 `.env`
- **测试**: 标准 `testing` + 内存 SQLite 的用户故事级集成测试

### 前端 (TypeScript)
- **框架**: Next.js 15 (App Router, Turbopack)
- **语言**: TypeScript
- **UI库**: Ant Design 5（自定义设计主题）
- **状态管理**: Zustand (persist)
- **HTTP客户端**: Axios
- **样式**: Tailwind CSS v4 + 设计令牌 (`lib/theme.ts`)
- **图标**: Ant Design Icons
- **测试**: Vitest（单测）+ Playwright（用户故事 E2E）

## 🏗 项目结构

```
Playmate-Timing/
├── backend/                 # 后端项目 (Go + Gin)
│   ├── main.go             # 入口（godotenv 加载 .env → 初始化 → 路由 → 启动）
│   ├── config/             # config.go(环境变量) + database.go(连接/迁移, 关闭迁移期外键)
│   ├── models/models.go    # 全部 GORM 模型（金额用 decimal，复合唯一索引）
│   ├── controllers/        # user / studio / balance / playrecord / review / dashboard / helpers
│   ├── middleware/auth.go  # JWT 认证 + RequireRole 鉴权
│   ├── routes/routes.go    # 全部路由 + CORS
│   ├── utils/              # auth(JWT/bcrypt) response cache + *_test.go
│   ├── integration_test.go # 用户故事级集成测试（内存 sqlite 跑全路由）
│   └── .env / .env.example # 环境变量（.env 已 gitignore）
├── frontend/               # 前端项目 (Next.js 15)
│   ├── src/
│   │   ├── app/
│   │   │   ├── (app)/      # 认证后应用壳：dashboard / player/* / provider/* / studio/* / studios / settings
│   │   │   ├── page.tsx    # 落地首页
│   │   │   ├── layout.tsx  # 根布局（注入设计主题 + 字体）
│   │   │   └── auth/       # 登录 / 注册
│   │   ├── components/     # AppShell / BalanceOpModal / ui.tsx / dashboards/*View.tsx
│   │   ├── lib/            # api.ts(全端点) theme.ts(设计令牌) format.ts(金额格式化)
│   │   ├── store/auth.ts   # Zustand 认证 store
│   │   └── types/index.ts  # 全部 TS 类型（decimal 金额为 string）
│   ├── e2e/                # Playwright 用户故事 E2E
│   ├── vitest.config.ts / playwright.config.ts
│   └── .env.local          # 环境变量（已 gitignore）
├── docs/                   # 产品与前端设计说明
├── AGENTS.md / CLAUDE.md   # AI 助手共享指南（CLAUDE.md 是软链接）
└── Readme.md               # 项目说明
```

## 🚀 快速开始

### 前置要求
- Go 1.19+
- Node.js 18+
- MySQL 8.0+
- Git

### 1. 克隆项目
```bash
git clone <repository-url>
cd companion-platform
```

### 2. 后端设置

#### 安装依赖
```bash
cd backend
go mod tidy
```

#### 配置环境变量
```bash
cp .env.example .env
# 编辑 .env 配置数据库连接等；启动时由 godotenv 自动加载（无需手动 export）
```

#### 创建数据库
```sql
CREATE DATABASE companion_platform CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```
> 表结构在启动时由 `AutoMigrate` 自动创建，只需保证目标库已存在且可连接。

#### 启动后端服务
```bash
go run main.go
```

后端服务在 `SERVER_PORT` 指定端口启动（默认 8080；本地开发用 8090，因 8080 常被占用）。前端 `NEXT_PUBLIC_API_URL` 需与之一致。

### 3. 前端设置

#### 安装依赖
```bash
cd frontend
npm install
```

#### 配置环境变量
```bash
# .env.local 文件已预配置，如需修改API地址请编辑
```

#### 启动前端服务
```bash
npm run dev
```

前端服务将在 `http://localhost:3000` 启动

## 📋 API文档

### 认证接口
- `POST /api/v1/register` - 用户注册
- `POST /api/v1/login` - 用户登录

### 用户接口
- `GET /api/v1/profile` - 获取用户信息
- `PUT /api/v1/profile` - 更新用户信息
- `GET /api/v1/users/:id` - 获取指定用户信息

### 工作室接口
- `GET /api/v1/studios` - 获取工作室列表
- `GET /api/v1/studios/:id` - 获取工作室详情
- `POST /api/v1/studio` - 创建工作室（需认证）
- `PUT /api/v1/studio/:id` - 更新工作室信息
- `POST /api/v1/studio/:id/apply` - 申请加入工作室

### 控制台聚合接口
- `GET /api/v1/player/dashboard` - 玩家控制台（余额合计、最近流水、进行中陪玩）
- `GET /api/v1/provider/dashboard` - 服务者控制台（收益、活跃玩家、近 7 天趋势、待办）
- `GET /api/v1/studio/dashboard` - 工作室控制台（成员数、流水、评分、待审批）

### 余额接口
- `GET /api/v1/player/balances` - 获取玩家余额列表
- `GET /api/v1/player/balances/:id/transactions` - 获取某条余额的流水
- `GET /api/v1/provider/balance-summary` - 服务者收益汇总
- `POST /api/v1/provider|studio/balances` - 充值
- `POST /api/v1/provider|studio/balances/deduct` - 扣费/消费（含透支校验）
- `POST /api/v1/provider|studio/balances/refund` - 退款

### 游玩记录接口
- `POST /api/v1/provider/play-records` - 服务者发起一局陪玩
- `PUT /api/v1/provider/play-records/:id/complete` - 完成（可同时结算扣费）
- `PUT /api/v1/provider/play-records/:id/cancel` - 取消
- `GET /api/v1/player/records` - 玩家查看自己的游玩记录
- `GET /api/v1/provider/play-records` - 服务者查看主持的记录

### 评价接口
- `POST /api/v1/player/reviews` - 玩家创建评价
- `GET /api/v1/reviews?target_type=&target_id=` - 查看某对象的评价（公开）
- `GET /api/v1/reviews/summary?target_type=&target_id=` - 评分汇总（平均分/数量/分布）

### 工作室与成员接口
- `GET /api/v1/studio/:id/applications` - 待审批申请
- `PUT /api/v1/studio/applications/:id` - 审批（approved/rejected）
- `GET /api/v1/studio/members` - 工作室成员（含聚合统计）
- `GET /api/v1/provider/relations` - 服务者的工作室归属与申请进度

## 🔧 配置说明

### 后端配置 (.env)
```env
# 服务器配置
SERVER_PORT=8080
GIN_MODE=debug

# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=password
DB_NAME=companion_platform
DB_CHARSET=utf8mb4

# JWT配置
JWT_SECRET=your-secret-key-here
```

### 前端配置 (.env.local)
```env
# API配置
NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1

# 应用配置
NEXT_PUBLIC_APP_NAME=陪玩服务信息平台
```

## 📱 功能演示

### 用户注册和登录
1. 访问 `http://localhost:3000`
2. 点击"注册"按钮
3. 选择用户角色（玩家/服务者/工作室）
4. 填写注册信息并提交
5. 自动跳转到控制台页面

### 工作室管理
1. 以工作室角色登录
2. 在控制台点击"工作室管理"
3. 创建工作室信息
4. 审批服务者加入申请

### 余额管理
1. 以服务者或工作室角色登录
2. 在控制台点击"余额管理"
3. 为玩家充值余额
4. 查看余额变动记录

## 🧪 测试

### 后端测试
```bash
cd backend
go test ./...        # utils 单测 + integration_test.go 用户故事级集成测试（内存 sqlite）
```

### 前端测试
```bash
cd frontend
npm test             # Vitest 单测（格式化/纯逻辑）
npm run e2e          # Playwright 用户故事 E2E（需后端 :8090 + 前端 :3000 运行）
```

> 三类测试已覆盖：**单测** + **功能测试（用户故事视角）** + **UE / E2E**。

## 📦 部署

### 后端部署
1. 编译二进制文件：
```bash
cd backend
go build -o companion-platform-backend
```

2. 配置生产环境变量
3. 启动服务：
```bash
./companion-platform-backend
```

### 前端部署
1. 构建生产版本：
```bash
cd frontend
npm run build
```

2. 启动生产服务：
```bash
npm run start
```

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 📞 联系方式

如有问题或建议，请通过以下方式联系：
- 邮箱: contact@example.com
- GitHub Issues: [项目Issues页面]

## 🔮 未来计划

- [x] 单元测试 / 集成测试 / E2E 三层测试体系
- [x] 按设计稿重建前端（深色侧栏 + 设计令牌 + 角色化控制台）
- [x] 余额事务一致性（行锁 + 透支校验 + decimal）
- [ ] 余额冻结/解冻（freeze/unfreeze）完整流程
- [ ] 添加实时消息通知
- [ ] 集成第三方支付系统
- [ ] 移动端适配优化
- [ ] API 文档自动生成（OpenAPI）
- [ ] Docker 容器化部署