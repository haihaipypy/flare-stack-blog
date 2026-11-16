# 更新日志

本文件记录本分支（`haihaipypy/flare-stack-blog`）的功能变更，按时间倒序排列。

上游项目：[du2333/flare-stack-blog](https://github.com/du2333/flare-stack-blog)

---

## 2026-11（v1.6.1）

### 移除

- **移除 Google Analytics**：删掉根路由 `head` 里注入的 `googletagmanager.com/gtag/js` 脚本与内联 `gtag('config', …)`，`clientEnv` 不再读 `VITE_GOOGLE_ANALYTICS_ID`；`.env.example`、中英 README 环境变量表、部署工作流的变量注入一并清理。浏览量统计仍由自建 `pageview`（Queue + D1）承担，Umami 保持可选

## 2026-11（v1.6.0）

### 新增

- **封面图焦点**：后台「设置 → 站点」两套主题都新增 16:9 预览框，鼠标拖到哪里，哪里就是画面重心，右下角实时显示 `x 50% · y 12%`，可一键重置居中。取值存 `site.bannerFocus {x, y}`（两主题共用，默认 `50/50` 与旧行为一致），渲染层分别落到 fuwari 横幅 `<img>` 的 `object-position` 与 default 主题背景层的 `background-position` —— 宽图在窄屏被裁切时不再切掉主体
- **编辑冲突保护**：保存时携带打开编辑器时读到的 `updatedAt`，SQL 条件变为 `WHERE id = ? AND updated_at = ?`；更新到 0 行说明中途被别处改过，返回 `POST_CONFLICT` 并附对方最后保存时间，不再静默覆盖。编辑页顶部出现琥珀色横幅，可选「用我的版本覆盖」（跳过锁强制写）或「放弃本地改动」（拉取最新）；冲突未解决前自动保存暂停、离开页面会被拦住

### 优化

- `setPostTags` / `setPostCategories` 新增 `skipTouch`，编辑页传 `true` 并改为「先写正文再改标签分类」，避免额外 touch `updated_at` 打乱乐观锁基准
- 不带 `expectedUpdatedAt` 的调用（MCP 工具、集成测试）行为完全不变，本次无需迁移

## 2026-10

### 移除

- **移除 Google AdSense**：不再向公开页面注入 `adsbygoogle.js` 脚本，删除 `public/ads.txt` 校验文件。广告位改由后续接入的联盟方案承担

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
- **广告位（affiliate）**
  - 位置写在模板里，**历史文章自动生效**，发文不需要任何额外操作：文章正文上方「本文环境」、文末横幅、工具页顶部横幅
  - 每个位置由文章 slug 做**确定性随机**挑选推广位（刷新不变、SSR 与 hydration 一致），文末位自动避开正文上方已选中的那条
  - 推广位内容（平台、标题、优惠文案、链接）在后台 **设置 → 广告** 里维护，改完保存即时生效，**不用改代码也不用重新部署**
  - 四个位置各自独立开关（文章上方、文末、工具页、站外悬浮），关掉后连历史文章一起停
  - 后台内置点击统计：站外来源域名、各推广位、各文章、每日趋势，可切换 7 / 30 / 90 天
  - 「悬浮广告」页直接给出预览入口与嵌入代码，一键复制
  - 所有外链统一走 `/go/:slug` 302 中转，带 `rel="sponsored nofollow"`、披露文案与「广告」标识
  - 新增 `affiliate_clicks` 表，记录每次点击的广告位、来源文章与两位国家码（不存 IP / UA）
  - **站外嵌入**：`/embed/float.js` 一套自包含悬浮脚本，其他网站插一行 `<script data-aff-float>` 即可显示广告；脚本只含 slug，点击一律回流 `/go/:slug`，收益与统计仍归本站
  - `/embed/float` 提供嵌入预览页；`affiliate_clicks` 增加 `source` 列区分来源站点
- **后台用户管理**：新增 `/admin/users`，顶部统计条（总数 / 已验证 / 未验证 / 管理员）+ 四项筛选 + 400ms 防抖搜索 + 分页，全部走 `adminMiddleware`
- **重发验证邮件 / 标记未验证**：用户列表每行两个操作。重发会先把 `email_verified` 落回 `false` 再调官方端点 —— better-auth 的 `sendVerificationEmail` 在 `emailVerified=true` 时直接返回成功且不调发信函数，不改标记永远发不出去
- **GitHub 账号支持邮箱密码登录**：个人中心按 `hasPassword` 分「设置」与「修改」两态。`setPassword` 在 better-auth 里没有注册 HTTP 路由（直接 POST 会 404），改由 serverFn 调 `auth.api.setPassword`；同时开启 `accountLinking`，先密码注册后用 GitHub 登录会合并到同一账号

### 优化

- **缓存层改为内存 → Workers Cache API → D1 三级缓存**：原先每次未命中都读 KV（一次列表页渲染 5~8 次），免费读额度 100k/天很快打满。现在业务数据不再落 KV，KV 只保留版本指针（15 秒内存缓存），搜索的 meta 检查也加了 30 秒内存缓存
- **缓存失效改用版本号**：Workers Cache API 的 `delete` 只清当前数据中心，故把「删单个 key」统一改为 `bumpVersion` 全局失效，新增 `site`（标签云/分类）与 `site:config`（站点/广告配置）两个命名空间。`ENVIRONMENT=test` 仍走原 KV 路径，集成测试行为不变
- **文首广告块瘦身**：卡片由 4 行压成 2 行、删掉「图标 + 本文环境」整行头部、广告标移到底部披露文案前

### 修复

- **站外悬浮脚本不再挑插入位置**：原先要求放在 `</body>` 之前。现在 `<head>`、`<footer>`、后台「页脚代码」输入框、JS 动态注入均可 —— body 已存在就直接挂载，不存在才等 `DOMContentLoaded`；挂载点兜底到 `document.documentElement`。同时加了全页单例标记（贴多份也只出一个卡片）、内层样式改双段选择器（压得住宿主 `.footer a` 之类规则）、可继承属性全部显式覆盖，并在宿主站为深色时跟随 `prefers-color-scheme`
- **悬浮脚本补 `Cross-Origin-Resource-Policy`**：宿主站开启 COEP 时，`/embed/float.js` 会被拦成 `ERR_BLOCKED_BY_RESPONSE`
- **注册验证邮件不再静默失败**：`auth.server.ts` 三处静默点补结构化日志（限流拦截、入队结果、入队异常），显式 `sendOnSignUp`，并对「已存在但未验证」的邮箱补发验证邮件
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

`package.json` 中的版本号沿用了上游的 `1.x` 序列（当前 `1.6.1`）。自 v1.6.0 起，每次提交都会同步升版本号并在此文件记一条：新增功能升 minor（`1.6.0 → 1.7.0`），修复与优化升 patch（`1.6.0 → 1.6.1`）。版本号由 `vite.config.ts` 注入 `__APP_VERSION__`，后台「版本检测」、MCP 服务端的 `version` 字段都读它。
