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
- **认证**: JWT (golang-jwt/jwt)
- **缓存**: go-cache (内存缓存)
- **跨域**: gin-contrib/cors
- **密码加密**: bcrypt

### 前端 (TypeScript)
- **框架**: Next.js 14 (App Router)
- **语言**: TypeScript
- **UI库**: Ant Design 5
- **状态管理**: Zustand
- **HTTP客户端**: Axios
- **样式**: Tailwind CSS
- **图标**: Ant Design Icons

## 🏗 项目结构

```
/workspace
├── backend/                 # 后端项目
│   ├── main.go             # 应用入口
│   ├── config/             # 配置管理
│   │   ├── config.go       # 配置结构和加载
│   │   └── database.go     # 数据库连接
│   ├── models/             # 数据模型
│   │   └── models.go       # 所有数据模型定义
│   ├── controllers/        # 控制器
│   │   ├── user.go         # 用户相关API
│   │   ├── studio.go       # 工作室相关API
│   │   └── balance.go      # 余额相关API
│   ├── middleware/         # 中间件
│   │   └── auth.go         # JWT认证中间件
│   ├── routes/             # 路由配置
│   │   └── routes.go       # API路由定义
│   ├── utils/              # 工具函数
│   │   ├── auth.go         # JWT和密码处理
│   │   ├── response.go     # 统一响应格式
│   │   └── cache.go        # 缓存工具
│   ├── go.mod              # Go模块依赖
│   └── .env.example        # 环境变量示例
├── frontend/               # 前端项目
│   ├── src/
│   │   ├── app/            # Next.js App Router页面
│   │   │   ├── page.tsx    # 首页
│   │   │   ├── layout.tsx  # 根布局
│   │   │   ├── auth/       # 认证页面
│   │   │   ├── dashboard/  # 控制台
│   │   │   └── studios/    # 工作室相关页面
│   │   ├── types/          # TypeScript类型定义
│   │   │   └── index.ts    # 所有类型定义
│   │   ├── lib/            # 库和工具
│   │   │   └── api.ts      # API客户端
│   │   ├── store/          # 状态管理
│   │   │   └── auth.ts     # 认证状态
│   │   └── components/     # 可复用组件
│   ├── package.json        # 依赖配置
│   ├── tailwind.config.ts  # Tailwind配置
│   ├── tsconfig.json       # TypeScript配置
│   └── .env.local          # 环境变量
└── README.md               # 项目说明
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
# 编辑 .env 文件，配置数据库连接等信息
```

#### 创建数据库
```sql
CREATE DATABASE companion_platform CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

#### 启动后端服务
```bash
go run main.go
```

后端服务将在 `http://localhost:8080` 启动

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

### 余额接口
- `GET /api/v1/player/balances` - 获取玩家余额列表
- `GET /api/v1/player/balances/provider/:id` - 获取指定服务者余额
- `POST /api/v1/provider/balances` - 服务者添加余额
- `POST /api/v1/studio/balances` - 工作室添加余额

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
go test ./...
```

### 前端测试
```bash
cd frontend
npm run test
```

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

- [ ] 添加实时消息通知
- [ ] 集成第三方支付系统
- [ ] 移动端适配优化
- [ ] 数据统计和分析功能
- [ ] API文档自动生成
- [ ] 单元测试覆盖率提升
- [ ] Docker容器化部署
- [ ] 微服务架构重构