# 更新日志

本文件记录本分支（`haihaipypy/flare-stack-blog`）的功能变更，按时间倒序排列。

上游项目：[du2333/flare-stack-blog](https://github.com/du2333/flare-stack-blog)

---

## 2026-10

### 新增

- **移植上游 v3.2.0 第一梯队功能**
  - 媒体库支持 **SVG 上传**，并自动从 `<svg>` 根节点或 `viewBox` 解析尺寸
  - 代码语言扩展至 **67 种**，统一为单一语言注册表，语法全部懒加载
  - 编辑器代码语言选择器支持 **搜索**（精确 > 前缀 > 包含 匹配排序）
  - 文章页新增 **上一篇 / 下一篇** 导航，按发布时间相邻查询并过滤非公开文章
  - 版本更新检查 **免 GitHub Token**：改用 `releases/latest` 重定向取版本号，不消耗 API 配额；检测失败写入 30 分钟缓存避免反复请求
  - **Mermaid 图表渲染**：`mermaid` 代码块直接渲染流程图/时序图，主题色分 `fuwari`(oklch) 与 `default`(hsl) 两套 token，经 `OffscreenCanvas` 转 hex 注入 Mermaid base 主题；渲染失败时保留源码兜底
  - 代码块语言徽章改用统一注册表，支持全部 67 种语言
- MCP 新增 `system_reset_cache` 工具，可一键重置全站缓存

### 修复

- **修复 26 处类型错误**：`src/routeTree.gen.ts` 由旧版生成器产出，缺失 `@tanstack/react-start` 的 `Register` 模块增强（`router` 注册项），导致全局路由类型退化为 `AnyRouter` —— `useRouteContext({ from: "__root__" })` 返回 `any`、`navigate({ search: (prev) => … })` 的 `prev` 隐式 `any`。重新生成该文件后类型检查归零，pre-push 钩子恢复正常

## 2026-09

### 新增

- **SEO**：为历史中文 slug 添加 **301 重定向**，消除重复内容
- **MCP**：新增分类工具（`categories_*`）与 `posts_set_categories`，文章支持 `categoryIds`
- 顶部导航增加「关于 / 隐私」入口，并拆分站点简介（`bio`），以满足 AdSense 审核要求
- 新增「服务条款」页面；关于/隐私合并为下拉菜单，解决菜单串行问题
- 集成 **Google Analytics**（gtag.js）

### 优化

- 后台设置页移除工具页管理字段（改由工具页专属入口维护）
- CDN 缓存 purge 改用全计划可用的 URL / Everything 接口

### 修复

- `posts_update` 修改发布状态时补跑发布流程，避免状态与流程不一致

## 2026-08

### 新增

- **工具导航页**：独立 `/tools` 路由，标题 / 描述 / 内容均可在后台编辑
- **Google AdSense** 接入公开页面，并添加 `ads.txt` 校验文件
- 部署支持 **多个自定义域名**（`EXTRA_DOMAINS`）

### 优化

- 导航栏「工具」按钮调整到分类与友链之间
- `fuwari` 主题下工具页隐藏侧边栏（仅影响 `/tools` 路由）

### 修复

- 工具页描述与内容不生效、顶部与壁纸重叠、标题重复等问题
- CDN 缓存 purge 覆盖全部自定义域名
- `EXTRA_DOMAINS` 解析时裁剪空白，避免域名绑定失败

## 2026-07（v1.5.2）

### 新增

- **文章分类功能**：分类与文章多对多，后台可增删改查
- **SEO**：文章发布时自动推送 URL 至百度「普通收录」；文章页补充 `og:image`，结构化数据升级为 `BlogPosting`
- 头像预设库选择器（基础设置）
- `fuwari` 主题：首页全屏 banner + 半透明卡片、导航栏分类下拉、分类侧边栏（与标签同时吸顶）、文章标题显示分类前缀

### 优化

- 合并上游缓存与标签筛选重构，同时保留本地分类功能
- 首页最近文章数提升至 10；首页卡片桌面端显示两行摘要
- 消除首页加载/刷新时的白闪

### 修复

- 修复分类缓存失效链路：`setPostCategories`、`invalidatePostCaches`、`invalidateSiteCache` 均补齐分类缓存清理
- 分类表迁移改用 `IF NOT EXISTS`；手工加列补齐 `created_at` / `updated_at` / `sort_order` 默认值
- 首次发布时缓存失效不生效的问题
- 加固认证 IP 解析、归档重定向与快照错误处理
- 确保百度推送不会被工作流吞掉

## 2026-05 ~ 2026-06（v1.5.1 及更早）

- 修复竖图在双主题及编辑器中不居中、过度拉长的问题
- 重构站点文档与路由的 execution context 处理
- 升级 TailwindCSS 及相关依赖
- 避免在 RSS 等 feed 中暴露管理员邮箱
- 更新页脚布局与链接

---

## 关于版本号

`package.json` 中的版本号沿用了上游的 `1.x` 序列（当前 `1.5.2`）。本分支自 v1.5.2 之后的功能变更按上述时间线累积，未逐次打 tag。
