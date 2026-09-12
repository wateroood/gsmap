# 国色星洗门店分布图

成都市区「国色星洗 / 国色1678」门店分布地图。基于高德地图 JS API 2.0（矢量渲染，最大缩放级别 zoom 20，约 10 米级），支持门店检索、分类筛选、点击定位与一键导航。

## 在线访问

- GitHub Pages：<https://wateroood.github.io/gsmap/>

## 功能特性

- 高德矢量底图，缩放可达 zoom 20（约 10 米级，与官网一致）
- 56 家门店（国色星洗 52 家 + 国色1678 4 家）自动带名称标签
- 左侧边栏：门店总数统计、品牌筛选（全部 / 国色星洗 / 国色1678）、关键字模糊搜索
- 点击列表项或地图标记：定位地图并弹出详情，含「导航到这里」直达
- 侧边栏可折叠/展开
- 响应式适配桌面与移动端

## 门店数据

- 门店名称、地址、坐标（GCC-02 坐标系）、营业时间、商圈、评分均来源于公开渠道核验与人工确认，与线上版本保持一致
- 品牌口径：国色星洗（含原国色净衣馆已并入）+ 国色1678 保留

## 技术栈

React 19 + TypeScript 5.9 + Vite 8 + Tailwind CSS 4 + 高德地图 JS API 2.0

> 说明：本仓库源码源自妙搭（feishu.cn 低代码平台）应用导出，已去除平台运行时依赖（AppContainer / 平台埋点 / 模板变量），可直接以静态站点部署。

## 本地开发

```bash
npm install
npm run dev
```

## 本地构建

```bash
# 标准静态构建（产物在 dist/）
npx vite build --outDir dist --emptyOutDir

# 清理产物中的平台模板变量（GitHub Pages 部署必需）
python scripts/clean-html.py
```

> Windows 下如遇 `Cannot find native binding` 报错（npm optional 依赖 bug），补齐原生绑定后重新构建：
> `npm install @rolldown/binding-win32-x64-msvc lightningcss-win32-x64-msvc @tailwindcss/oxide-win32-x64-msvc --no-save`

## 部署（GitHub Pages）

已配置 `base: '/gsmap/'`，使用 HashRouter 路由，无服务器重写要求。

1. 源码推送到 `main` 分支
2. 将 `dist/` 构建产物推送到 `gh-pages` 分支
3. 仓库 Settings → Pages → Source 选择 `gh-pages` 分支 / root

## 高德地图 Key 说明

- 地图 Key 与安全密钥配置于 `index.html`
- 高德开放平台控制台需将域名 `wateroood.github.io` 加入该 Key 的「域名白名单」，否则地图无法加载（报 INVALID_USER_DOMAIN）
- 线上版本（妙搭 aiforce.cloud）与 GitHub Pages 为同一 Key，均已配置对应白名单

## 目录结构

```
src/
  pages/StoreMap/StoreMapPage.tsx   # 门店地图主页面（唯一业务页）
  data/stores.ts                    # 门店数据
scripts/
  clean-html.py                     # 构建产物模板变量清理脚本
```
