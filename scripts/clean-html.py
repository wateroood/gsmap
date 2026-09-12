# -*- coding: utf-8 -*-
"""后处理 dist/index.html：清理妙搭平台模板变量与埋点脚本，适配 GitHub Pages 静态托管。"""
import re, io, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
html_path = os.path.join(ROOT, "dist", "index.html")
with io.open(html_path, "r", encoding="utf-8") as f:
    html = f.read()

# 1) 删除平台模板变量注入脚本块（window.appId = "{{appId}}" ... _appInfo）
html = re.sub(
    r'<script>window\.appId = "\{\{appId\}\}"[^<]*?</script>',
    "",
    html,
    flags=re.S,
)

# 2) 删除 Slardar 错误捕获脚本块
html = re.sub(
    r'<script>\(function\(g\)\{[^<]*?if\(!window\[g\]\)\{[^<]*?KSlardarWeb[^<]*?</script>',
    "",
    html,
    flags=re.S,
)

# 3) 删除 Slardar SDK 动态加载脚本块
html = re.sub(
    r'<script>const slardarScript = document\.createElement[^<]*?document\.head\.appendChild\(slardarScript\);?</script>',
    "",
    html,
    flags=re.S,
)

# 4) 删除性能埋点 script
html = re.sub(
    r'<script src="https://sf3-scmcdn-cn\.feishucdn\.com/obj/unpkg/byted/performance[^<]*?</script>',
    "",
    html,
)

# 5) 删除 Tea 埋点脚本块
html = re.sub(
    r'<script>\(function \(win, export_obj\) \{[^<]*?document\.head\.appendChild\(teaScript\);?</script>',
    "",
    html,
    flags=re.S,
)

# 6) 替换残留模板变量为实际值
repl = {
    "{{appId}}": "app_17dscu4gwmx",
    "{{userId}}": "",
    "{{tenantId}}": "",
    "{{csrfToken}}": "",
    "{{environment}}": "online",
    "{{basename}}": "/guose-store-map/",
    "{{appName}}": "国色星洗门店分布图",
    "{{appDescription}}": "国色星洗成都门店分布地图",
    "{{appAvatar}}": "/guose-store-map/favicon.svg",
    "{{appAvatar}}": "/guose-store-map/favicon.svg",
    "{{appDescription}}": "国色星洗成都门店分布地图",
}
for k, v in repl.items():
    html = html.replace(k, v)

# 7) 移除残留的 {{...}} 模板占位（若还有）
html = re.sub(r"\{\{[^}]*\}\}", "", html)

# 8) 清理多余的空白行
html = re.sub(r"\n{3,}", "\n\n", html)

with io.open(html_path, "w", encoding="utf-8") as f:
    f.write(html)

print("done, length:", len(html))
