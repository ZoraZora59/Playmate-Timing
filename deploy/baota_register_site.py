#!/usr/bin/env python3
"""在宝塔面板中登记 playmate.zorazora.cn 反向代理站点。

使用宝塔官方 panelSite.AddSite，不直接改数据库。
运行前请确保自定义 Nginx 配置已存在于 vhost 路径，脚本会先保存再恢复。
"""
import json
import os
import shutil
import subprocess
import sys

sys.path.insert(0, "/www/server/panel/class")
sys.path.insert(0, "/www/server/panel")

import panelSite  # noqa: E402
import public  # noqa: E402

SITE = "playmate.zorazora.cn"
ROOT = "/www/wwwroot/playmate.zorazora.cn"
VHOST_CONF = f"/www/server/panel/vhost/nginx/{SITE}.conf"
SAVED_CONF = f"{ROOT}/nginx-playmate.conf.saved"


def main() -> int:
    if os.path.exists(VHOST_CONF):
        shutil.copy2(VHOST_CONF, SAVED_CONF)
        print(f"saved custom nginx conf -> {SAVED_CONF}")

    exists = public.M("sites").where("name=?", (SITE,)).count()
    if exists:
        print(f"site already registered: {SITE}")
    else:
        get = public.dict_obj()
        get.webname = json.dumps(
            {"domain": SITE, "domainlist": [f"{SITE}:80"], "count": 0}
        )
        get.path = ROOT
        get.port = "80"
        get.version = "00"
        get.type = "PHP"
        get.ps = "陪玩平台"
        get.type_id = 0
        get.project_type = "proxy"
        get.ftp = "false"
        get.sql = "false"
        get.deploy_type = ""
        res = panelSite.panelSite().AddSite(get)
        print(f"add site result: {res}")

    if os.path.exists(SAVED_CONF):
        shutil.copy2(SAVED_CONF, VHOST_CONF)
        test = subprocess.run(["nginx", "-t"], capture_output=True, text=True)
        print(f"nginx -t exit={test.returncode}")
        if test.returncode == 0:
            subprocess.run(["nginx", "-s", "reload"], check=False)
            print("nginx reloaded")
        else:
            print(test.stderr[-500:])
            return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
