proxy_http_version 1.1;
# 宝塔全局 http 段启用了 proxy_cache；本应用页面/接口必须禁用，
# 否则静态首页和 API 可能被缓存旧内容。
proxy_cache off;
proxy_set_header Host $host;
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;
proxy_set_header X-Forwarded-Host $host;
proxy_set_header Connection "";
proxy_connect_timeout 5s;
proxy_read_timeout 60s;
proxy_send_timeout 60s;
