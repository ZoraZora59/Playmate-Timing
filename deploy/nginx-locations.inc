# 安全响应头（server 级；location 内不要再声明 add_header，否则会被覆盖）
add_header X-Content-Type-Options "nosniff" always;
add_header X-Frame-Options "DENY" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; connect-src 'self'; worker-src 'self' blob:; object-src 'none'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'" always;

# 登录 / 注册限流
location = /api/v1/login {
    limit_req zone=playmate_auth burst=5 nodelay;
    limit_req_status 429;
    proxy_pass http://playmate_api;
    include /www/wwwroot/playmate.zorazora.cn/proxy-headers.inc;
}

location = /api/v1/register {
    limit_req zone=playmate_auth burst=3 nodelay;
    limit_req_status 429;
    proxy_pass http://playmate_api;
    include /www/wwwroot/playmate.zorazora.cn/proxy-headers.inc;
}

# 后端 API
location /api/ {
    proxy_pass http://playmate_api;
    include /www/wwwroot/playmate.zorazora.cn/proxy-headers.inc;
}

# Next.js 前端
location / {
    proxy_pass http://playmate_web;
    include /www/wwwroot/playmate.zorazora.cn/proxy-headers.inc;
}
