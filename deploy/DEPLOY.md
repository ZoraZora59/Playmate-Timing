# 生产部署说明

## 线上入口

- 正式域名：<https://playmate.zorazora.cn>
- 备用入口：<http://59.110.232.243>（HTTP，仅用于部署验证）
- 宝塔面板：`网站` → `playmate.zorazora.cn`（site id 41）

## 运行架构

```
浏览器
  │ HTTPS 443 / HTTP 80
  ▼
Nginx（宝塔站点 playmate.zorazora.cn）
  ├── /api/*  ──► 127.0.0.1:8090  Go API（systemd: playmate-api）
  └── /*      ──► 127.0.0.1:3002  Next.js standalone（systemd: playmate-web）
                     │
                     └── MySQL 127.0.0.1:3204 / playmate_timing
```

前端与后端同源，浏览器统一请求 `/api/v1`，因此生产环境不需要跨域。

## 服务器路径

| 用途 | 路径 |
|---|---|
| 前端运行目录 | `/www/wwwroot/playmate-web` |
| 后端运行目录 | `/www/wwwroot/playmate-backend` |
| 后端配置（含密钥，勿提交） | `/www/wwwroot/playmate-backend/.env` |
| Nginx 站点配置 | `/www/server/panel/vhost/nginx/playmate.zorazora.cn.conf` |
| Nginx 片段 | `/www/wwwroot/playmate.zorazora.cn/nginx-locations.inc`、`proxy-headers.inc` |
| 访问日志 | `/www/wwwlogs/playmate.access.log` |
| 错误日志 | `/www/wwwlogs/playmate.error.log` |
| 数据库备份 | `/www/backup/playmate/` |

## 进程管理

```bash
systemctl status playmate-api playmate-web
systemctl restart playmate-api playmate-web
journalctl -u playmate-api -u playmate-web -f
```

服务文件见 `deploy/playmate-api.service`、`deploy/playmate-web.service`。API 只监听 `127.0.0.1:8090`，Next 只监听 `127.0.0.1:3002`。

## 构建与发布

### 后端

```bash
cd backend
go test ./...
CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -trimpath -ldflags="-s -w" -o /tmp/playmate-api .
scp /tmp/playmate-api aliyun:/www/wwwroot/playmate-backend/playmate-api
ssh aliyun 'chown www:www /www/wwwroot/playmate-backend/playmate-api && systemctl restart playmate-api'
```

### 前端

```bash
cd frontend
npm ci
npm run build   # .env.production 将 NEXT_PUBLIC_API_URL 固定为 /api/v1

rm -rf /tmp/playmate-web && mkdir -p /tmp/playmate-web/.next
cp -R .next/standalone/. /tmp/playmate-web/
cp -R .next/static /tmp/playmate-web/.next/static
cp -R public /tmp/playmate-web/public
tar czf /tmp/playmate-web.tgz -C /tmp/playmate-web .
scp /tmp/playmate-web.tgz aliyun:/tmp/
ssh aliyun 'tar xzf /tmp/playmate-web.tgz -C /www/wwwroot/playmate-web && chown -R www:www /www/wwwroot/playmate-web && systemctl restart playmate-web'
```

### Nginx

```bash
scp deploy/nginx-playmate.conf aliyun:/www/server/panel/vhost/nginx/playmate.zorazora.cn.conf
scp deploy/nginx-locations.inc deploy/proxy-headers.inc aliyun:/www/wwwroot/playmate.zorazora.cn/
ssh aliyun 'nginx -t && nginx -s reload'
```

### 宝塔登记（首次部署）

```bash
scp deploy/baota_register_site.py aliyun:/www/wwwroot/playmate.zorazora.cn/
ssh aliyun 'btpython /www/wwwroot/playmate.zorazora.cn/baota_register_site.py'
```

脚本使用宝塔官方 `panelSite.AddSite` 登记站点，并在写配置后恢复自定义反向代理配置。

## 环境变量（后端）

`/www/wwwroot/playmate-backend/.env`，权限 `600`，属主 `www`：

```env
SERVER_HOST=127.0.0.1
SERVER_PORT=8090
GIN_MODE=release
DB_HOST=127.0.0.1
DB_PORT=3204
DB_USER=playmate_timing
DB_PASSWORD=...
DB_NAME=playmate_timing
DB_CHARSET=utf8mb4
JWT_SECRET=<openssl rand -hex 32>
JWT_EXPIRE_HOURS=24
CORS_ORIGINS=https://playmate.zorazora.cn,http://59.110.232.243
TZ=Asia/Shanghai
```

生产模式启动时会拒绝默认或短于 32 位的 `JWT_SECRET`。

## 验证清单

```bash
curl -s https://playmate.zorazora.cn/api/v1/health
curl -sI https://playmate.zorazora.cn/
ssh aliyun 'systemctl is-active playmate-api playmate-web; nginx -t'
```

- 页面标题：`陪玩平台 · Companion Hub`
- 安全响应头：CSP、HSTS、X-Frame-Options、Referrer-Policy
- 宝塔 `网站` 列表可见 `playmate.zorazora.cn`

## 安全说明

已落实：

- HTTPS 使用现有 `*.zorazora.cn` 证书，HTTP 域名自动跳转 HTTPS
- 登录 / 注册接口限流（10 次/分钟，burst 5/3）
- API 与 Web 仅监听本机，由 Nginx 对外
- 公开接口不返回邮箱、手机号
- 服务者余额固定写入 `studio_id=0`，不能写入他人工作室账本
- 评价必须关联自己的已完成对局，且同一局同一对象只能评价一次
- 工作室成员移除后可重新申请；申请/审批/移除均校验工作室所有者

建议后续处理：

- 数据库账号 `playmate_timing` 当前拥有 `SUPER` 权限，建议回收为仅本库 `ALL PRIVILEGES`
- MySQL 3204 端口当前对外监听，如无远程连接需求，建议限制安全组/防火墙来源
- JWT 存在 localStorage，XSS 场景下仍有风险；后续可迁移到 HttpOnly Cookie
- 定期轮换 `JWT_SECRET`、备份数据库（`/www/backup/playmate/`）

## 回滚

- 数据库：使用 `/www/backup/playmate/db-*.sql` 恢复
- 宝塔站点库：使用 `/www/backup/playmate/site.db-*` 恢复
- 代码：重新上传上一版本二进制 / standalone 包并重启对应 systemd 服务
