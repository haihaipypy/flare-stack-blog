<div align="center">

中文 | [English](./docs/README.en.md)

# Flare Stack Blog

「无辣的学习笔记」自用博客系统 — 基于 **Cloudflare Workers** 的全栈博客 CMS<br>
深度集成 D1、R2、KV、Workers、Workflows、Queues 等 Serverless 服务

[![License](https://img.shields.io/github/license/haihaipypy/flare-stack-blog?style=flat-square)](https://github.com/haihaipypy/flare-stack-blog/blob/main/LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/haihaipypy/flare-stack-blog?style=flat-square)](https://github.com/haihaipypy/flare-stack-blog/stargazers)
[![React](https://img.shields.io/badge/React-19-blue?logo=react&style=flat-square)](https://react.dev)
[![TanStack Start](https://img.shields.io/badge/TanStack%20Start-black?logo=tanstack&style=flat-square)](https://tanstack.com/start)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38B2AC?logo=tailwind-css&style=flat-square)](https://tailwindcss.com)

[线上站点](https://blog.1day.vip) · [核心功能](#核心功能) · [部署指南](#部署指南) · [本地开发](#本地开发) · [更新日志](./CHANGELOG.md)

</div>

---

> **来源**：本项目基于 [du2333/flare-stack-blog](https://github.com/du2333/flare-stack-blog) 二次开发，遵循 GPL-3.0 许可。

> **注意**：本项目专为 Cloudflare 生态设计，**仅支持**部署在 Cloudflare Workers。

## 界面预览

<div align="center">
  <img src="docs/assets/home.png" alt="首页预览" width="49%">
  <img src="docs/assets/admin.png" alt="管理后台预览" width="49%">
</div>

## 核心功能

### 内容创作

- **富文本编辑器** — 基于 TipTap 3，支持代码高亮、图片上传、表格、数学公式与草稿/发布流程
- **代码块** — 67 种语言语法高亮，语言选择器支持搜索，语法按需懒加载
- **Mermaid 图表** — 直接写 `mermaid` 代码块即渲染流程图、时序图等，自动跟随主题明暗配色
- **版本历史** — 编辑器自动快照与文章版本回溯，方便恢复误改内容
- **导入导出** — Markdown 导入导出，保留图片资源与 Frontmatter

### 内容组织

- **分类与标签** — 一篇文章可归属多个分类，配合标签形成双维度组织体系
- **全文搜索** — 基于 Orama 的高性能站内搜索
- **上下篇导航** — 文章页按发布时间自动串联前后文
- **URL 治理** — 自定义 slug，历史中文 slug 自动 301 重定向，避免重复内容

### 互动与运营

- **评论系统** — 嵌套回复、邮件通知、AI 辅助审核与上下文化评论审核
- **友情链接** — 用户申请、管理员审核、邮件通知全流程
- **通知系统** — 邮件与 Webhook 多通道，可按事件类型订阅
- **数据统计** — 自建浏览量统计（访客匿名化），可选接入 Umami 与 Google Analytics

### 站点与 SEO

- **SEO 增强** — Canonical URL、Schema.org 结构化数据（BlogPosting）、OG 图、RSS / Sitemap / Robots
- **百度主动推送** — 文章发布时自动推送新 URL 至百度「普通收录」，缩短收录周期
- **站点文档** — 关于、隐私政策、服务条款等独立页面，顶部导航统一入口
- **广告位管理** — 模板内固定广告位（文章上下、工具页横幅、站外悬浮脚本），后台可开关位置、增删推广位、看点击统计并复制嵌入代码；统一经 `/go/:slug` 中转，改链接不用改代码也不用重新部署
- **工具导航页** — 独立 `/tools` 页面，标题/描述/内容均可后台维护

### 平台能力

- **主题系统** — 可扩展的主题模板，支持完整替换所有页面和布局（内置 `default` 与 `fuwari`）
- **用户认证** — 邮箱密码与 GitHub OAuth 双通道登录，权限控制
- **MCP Server** — 29 个工具、9 个模块（文章/评论/标签/分类/友链/媒体/搜索/统计/系统），通过 OAuth 连接 AI 客户端
- **AI 辅助** — Cloudflare Workers AI 集成
- **双语界面** — 中文 / English，基于 Paraglide 编译期 i18n
- **版本更新检查** — 未配置 GitHub Token 时也可检测新版本，不消耗 API 配额

## 技术栈

### Cloudflare 生态

| 服务            | 用途                           |
| :-------------- | :----------------------------- |
| Workers         | 边缘计算与托管                 |
| D1              | SQLite 数据库                  |
| R2              | 对象存储（媒体文件）           |
| KV              | 缓存层                         |
| Durable Objects | 分布式限流                     |
| Workflows       | 异步任务（内容审核、定时发布） |
| Queues          | 消息队列（邮件通知）           |
| Workers AI      | AI 能力                        |
| Turnstile       | 人机验证                       |
| Images          | 图片优化                       |

### 前端

- **框架**：React 19 + TanStack Router / Query
- **样式**：TailwindCSS 4
- **表单**：React Hook Form + Zod
- **图表**：Recharts

### 后端

- **网关层**：Hono（认证路由、媒体服务、缓存控制）
- **业务层**：TanStack Start（SSR、Server Functions）
- **数据库**：Drizzle ORM + drizzle-zod
- **搜索**：Orama
- **认证**：Better Auth（邮箱密码 + GitHub OAuth）

### 编辑器

TipTap 3 富文本 + Shiki 代码高亮 + Mermaid 图表渲染

### 工具链

Bun + Vite 7 + Biome + Vitest

### 目录结构

```
src/
├── features/
│   ├── posts/                  # 文章管理（其他模块结构类似）
│   │   ├── api/                # Server Functions（对外接口）
│   │   ├── data/               # 数据访问层（Drizzle 查询）
│   │   ├── posts.service.ts    # 业务逻辑
│   │   ├── posts.schema.ts     # Zod Schema + 缓存 Key 工厂
│   │   ├── components/         # 功能专属组件
│   │   ├── queries/            # TanStack Query Hooks
│   │   └── workflows/          # Cloudflare Workflows
│   ├── categories/  # 文章分类（多对多）
│   ├── tags/        # 标签管理
│   ├── comments/    # 评论、嵌套回复、审核
│   ├── media/       # 媒体上传、R2 存储
│   ├── search/      # Orama 全文搜索
│   ├── auth/        # 认证、权限控制
│   ├── dashboard/   # 管理后台数据统计
│   ├── pageview/    # 自建浏览量统计
│   ├── email/       # 邮件通知（Resend）
│   ├── notification/# 通知编排（邮件 / Webhook）
│   ├── webhook/     # Webhook 推送
│   ├── cache/       # KV 缓存服务
│   ├── config/      # 博客配置
│   ├── friend-links/# 友情链接（申请、审核）
│   ├── import-export/# Markdown 导入导出
│   ├── site-documents/# 关于、隐私、服务条款
│   ├── seo/         # 百度主动推送等 SEO 能力
│   ├── mcp/         # MCP Server（工具 + OAuth 授权）
│   ├── version/     # 版本更新检查
│   ├── theme/       # 主题系统（契约、注册表、各主题实现）
│   └── ai/          # Workers AI 集成
├── routes/
│   ├── _public/     # 公开页面（首页、文章列表/详情、搜索、工具页、友链）
│   ├── _auth/       # 登录/注册相关页面
│   ├── _user/       # 用户相关页面
│   ├── admin/       # 管理后台（文章、评论、媒体、分类、标签、工具页、设置）
│   ├── oauth/       # OAuth 授权确认页
│   ├── rss[.]xml.ts     # RSS Feed
│   ├── sitemap[.]xml.ts # Sitemap
│   └── robots[.]txt.ts  # Robots.txt
├── components/      # UI 组件（ui/, common/, content/, layout/）
├── lib/             # 基础设施（db/, auth/, hono/, middlewares）
└── hooks/           # 自定义 Hooks
```

### 主题系统

所有面向用户的页面与布局均通过 **主题契约（Theme Contract）** 与业务逻辑解耦。你可以在不修改任何路由或数据逻辑的前提下，完整替换博客的视觉表现层。

→ **[主题开发教程](./docs/theme-guide.md)** — 了解如何从零创建自定义主题。

#### 可用主题

站点个性化配置（标题、描述、社交链接、favicon、默认主题背景图等）统一在后台「设置」页面维护。`src/blog.config.ts` 主要作为默认值与兜底配置；主题开发时，建议结合 [主题开发教程](./docs/theme-guide.md) 查看实际可用的运行时 `siteConfig`。

<table>
  <tr>
    <th>主题</th>
    <th>预览</th>
  </tr>
  <tr>
    <td><code>default</code>（默认）</td>
    <td><img src="docs/assets/home.png" alt="Default theme preview" /></td>
  </tr>
  <tr>
    <td><code>fuwari</code></td>
    <td><img src="docs/assets/fuwari.png" alt="Fuwari theme preview" /></td>
  </tr>
</table>

### 请求流程

```
请求 → Cloudflare CDN（边缘缓存）
         ↓ 未命中
      server.ts（Hono 入口）
         ├── /api/auth/* → Better Auth
         ├── /images/*   → R2 媒体服务
         └── 其他        → TanStack Start
                              ↓
                         中间件注入（db, auth, session）
                              ↓
                         路由匹配 + Loader 执行
                              ↓
                  KV 缓存 ←→ Service 层 ←→ D1 数据库
                              ↓
                         SSR 渲染（带缓存头）
```

## 部署指南

### 前置要求

- Cloudflare 账号（Workers / D1 / R2 / KV 均使用免费额度即可起步）
- 一个托管在 Cloudflare 的域名

### 一、创建 Cloudflare 资源

```bash
npx wrangler d1 create blog-db        # 记下 database_id
npx wrangler r2 bucket create blog-media
npx wrangler kv namespace create CACHE # 记下 id
```

### 二、配置 GitHub OAuth

前往 [GitHub Developer Settings](https://github.com/settings/developers) 创建 OAuth App：

- **Homepage URL**：`https://你的域名`
- **Authorization callback URL**：`https://你的域名/api/auth/callback/github`

### 三、配置环境变量与 Secrets

将资源 ID 与凭证填入 `wrangler.jsonc`（可从 `wrangler.example.jsonc` 复制）和 `.dev.vars`。完整变量清单见下方 [环境变量参考](#环境变量参考)。

### 四、部署

**方式一：GitHub Actions 自动部署**

在仓库 Settings → Secrets and variables 中配置好 secrets 与 vars 后，推送到 `main` 分支即自动部署。

- 默认使用 `custom_domain` 模式绑定域名
- 设置仓库变量 `ROUTE=1` 可切换为 `routes` 模式
- 需要同时绑定多个自定义域名时，用 `EXTRA_DOMAINS` 追加（逗号分隔）

**方式二：本地手动部署**

```bash
cp wrangler.example.jsonc wrangler.jsonc   # 填入资源 ID
bun run db:migrate                          # 应用 D1 迁移
bun run deploy                              # 构建并部署到 Workers
```

更详细的图文步骤参见 [Deployment Guide](./docs/deployment-guide.en.md)。

---

## 环境变量参考

| 文件        | 用途                                   |
| :---------- | :------------------------------------- |
| `.env`      | 客户端变量（`VITE_*`），Vite 读取      |
| `.dev.vars` | 服务端变量，Wrangler 注入 Worker `env` |

### 必填

| 变量名                       | 用途   | 说明                                              |
| :--------------------------- | :----- | :------------------------------------------------ |
| `CLOUDFLARE_API_TOKEN`       | CI/CD  | Cloudflare API Token（Worker 部署 + D1 读写权限） |
| `CLOUDFLARE_ACCOUNT_ID`      | CI/CD  | Cloudflare Account ID                             |
| `D1_DATABASE_ID`             | CI/CD  | D1 数据库 ID                                      |
| `KV_NAMESPACE_ID`            | CI/CD  | KV 命名空间 ID                                    |
| `BUCKET_NAME`                | CI/CD  | R2 存储桶名称                                     |
| `BETTER_AUTH_SECRET`         | 运行时 | 会话加密密钥，运行 `openssl rand -hex 32` 生成    |
| `BETTER_AUTH_URL`            | 运行时 | 应用 URL（如 `https://blog.example.com`）         |
| `ADMIN_EMAIL`                | 运行时 | 管理员邮箱                                        |
| `GITHUB_CLIENT_ID`           | 运行时 | GitHub OAuth Client ID                            |
| `GITHUB_CLIENT_SECRET`       | 运行时 | GitHub OAuth Client Secret                        |
| `CLOUDFLARE_ZONE_ID`         | 运行时 | Cloudflare Zone ID                                |
| `CLOUDFLARE_PURGE_API_TOKEN` | 运行时 | 具有 Purge CDN 权限的 API Token                   |
| `DOMAIN`                     | 运行时 | 博客域名（如 `blog.example.com`）                 |

### 可选

| 变量名                      | 用途   | 说明                                                                                                      |
| :-------------------------- | :----- | :-------------------------------------------------------------------------------------------------------- |
| `THEME`                     | 构建时 | 主题名称，默认 `default`，详见 [可用主题](#可用主题)                                                      |
| `LOCALE`                    | 运行时 | 默认语言，支持 `zh` / `en`，默认 `zh`；通知邮件、Webhook 文本和后台异步任务文案会使用该语言               |
| `EXTRA_DOMAINS`             | CI/CD  | 额外绑定的自定义域名，逗号分隔；用于多域名同时指向同一 Worker                                             |
| `CDN_DOMAIN`                | 运行时 | 独立 CDN 域名（如 `cdn.example.com`），purge 时优先使用；须为当前 Zone 下通过 SaaS CNAME 接入的自定义域名 |
| `ROUTE`                     | CI/CD  | 设为 `1` 时，GitHub Actions 部署自动改用 Cloudflare `routes` 模式                                        |
| `ZONE_NAME`                 | CI/CD  | 可选。仅在 `ROUTE=1` 且 Zone 不是从 `DOMAIN` 自动推导结果时填写                                           |
| `PAGEVIEW_SALT`             | 运行时 | 浏览量统计的访客匿名化 salt，运行 `openssl rand -hex 16` 生成                                             |
| `BAIDU_PUSH_TOKEN`          | 运行时 | 百度搜索资源平台「普通收录」推送 token，不填则跳过推送                                                    |
| `UMAMI_SRC`                 | 运行时 | Umami 客户端埋点代理 URL（如 `https://cloud.umami.is`）                                                   |
| `VITE_UMAMI_WEBSITE_ID`     | 构建时 | Umami Website ID（客户端埋点）                                                                            |
| `VITE_GOOGLE_ANALYTICS_ID`  | 构建时 | Google Analytics 衡量 ID（如 `G-XXXXXXXXXX`），不填则不注入 gtag                                          |
| `TURNSTILE_SECRET_KEY`      | 运行时 | Cloudflare Turnstile 人机验证 Secret Key                                                                  |
| `VITE_TURNSTILE_SITE_KEY`   | 构建时 | Cloudflare Turnstile Site Key                                                                             |
| `GITHUB_TOKEN`              | 运行时 | GitHub API Token（版本更新检查，避免限流；不填也能检测）                                                  |

---

## 本地开发

### 前置要求

- [Bun](https://bun.sh) >= 1.3
- Cloudflare 账号（用于远程 D1/R2/KV 资源）

### 快速开始

```bash
# 安装依赖
bun install

# 配置环境变量
cp .env.example .env        # 客户端变量
cp .dev.vars.example .dev.vars  # 服务端变量

# 配置 Wrangler
cp wrangler.example.jsonc wrangler.jsonc
# 编辑 wrangler.jsonc，填入你的资源 ID
# 默认示例使用 custom_domain，也可以改成 routes 模式（如 blog.example.com/*）

# 启动开发服务器
bun dev
```

### 登录管理后台

**方式一：邮箱密码注册（无需第三方服务）**

1. 访问 `http://localhost:3000` 注册页面，使用 `.dev.vars` 中配置的 `ADMIN_EMAIL` 注册账号
2. 开发环境下验证邮件不会真正发送，验证链接会打印到控制台，复制访问即可完成验证
3. 验证后自动登录，系统根据 `ADMIN_EMAIL` 自动赋予管理员权限

**方式二：GitHub OAuth**

1. 前往 [GitHub Developer Settings](https://github.com/settings/developers) 创建一个 OAuth App
2. Homepage URL 填 `http://localhost:3000`，Authorization callback URL 填 `http://localhost:3000/api/auth/callback/github`
3. 将 Client ID 和 Client Secret 填入 `.dev.vars`

### 常用命令

| 命令                  | 说明                          |
| :-------------------- | :---------------------------- |
| `bun dev`             | 启动开发服务器（端口 3000）   |
| `bun run build`       | 构建生产版本                  |
| `bun run test`        | 运行集成测试（Workers 运行时）|
| `bun run test:node`   | 运行单元测试（Node 环境）     |
| `bun lint`            | Biome 检查                    |
| `bun check`           | 类型检查 + Lint + 格式化      |
| `bun run i18n:compile`| 重新编译 i18n 文案            |

> 修改 `messages/*.json` 后必须执行 `bun run i18n:compile`，否则 `m.*` 的文案类型不会更新。

### 数据库命令

| 命令              | 说明                                |
| :---------------- | :---------------------------------- |
| `bun db:studio`   | 启动 Drizzle Studio（可视化数据库） |
| `bun db:generate` | 生成迁移文件                        |
| `bun db:migrate`  | 安全应用远程 D1 迁移，校验失败自动回滚 |
| `bun db:migrate:local` | 安全应用本地 D1 迁移，校验失败自动恢复 |
| `bun db:migrate:unsafe` | 直接应用远程 D1 迁移，不做校验 |

`bun db:migrate` / `bun db:migrate:local` 会复用 schema 中定义的状态常量，在迁移前后校验以下关键计数是否一致：

- `posts`：总文章数，以及每个文章状态的数量
- `comments`：总评论数、根评论数、子评论数，以及每个评论状态的数量

安全脚本还会额外做这些事情：

- 远程模式：默认只记录 D1 Time Travel bookmark，校验失败时自动执行 restore
- 远程模式：如需额外保留 SQL 快照，可手动运行 `bun scripts/safe-d1-migrate/main.ts --remote --with-export`
- 本地模式：快照 `.wrangler/state`（或你传入的 `--persist-to`），校验失败时自动恢复本地持久化目录

### 本地模拟 Cloudflare 资源

默认配置使用远程 D1/R2/KV 资源。如需完全本地开发，可在 `wrangler.jsonc` 中移除 `remote: true`，Miniflare 会自动模拟这些服务：

```jsonc
{
  "d1_databases": [{ "binding": "DB", ... }],  // 移除 "remote": true
  "r2_buckets": [{ "binding": "R2", ... }],    // 移除 "remote": true
  "kv_namespaces": [{ "binding": "KV", ... }]  // 移除 "remote": true
}
```

> **注意**：本地模拟的数据不会同步到远程，适合初期开发和测试。本地数据库迁移推荐使用：
>
> ```bash
> bun db:migrate:local
> ```

### 域名绑定方式

默认配置使用 `custom_domain`。如果你希望使用 `routes` 方式接管 `blog.example.com/*`，可改成：

```jsonc
{
  "routes": [{ "pattern": "blog.example.com/*", "zone_name": "example.com" }]
}
```

使用仓库内置 GitHub Actions 部署时，不必手改 `wrangler.example.jsonc`：

- 默认：`custom_domain`
- 设置仓库变量 `ROUTE=1`：自动切到 `routes`
- `pattern` 自动使用 `${DOMAIN}/*`
- `zone_name` 默认从 `DOMAIN` 推导；如有子域单独托管场景，可额外设置 `ZONE_NAME`

## 更新日志

本分支的功能变更记录在 **[CHANGELOG.md](./CHANGELOG.md)**，按时间倒序维护。

## 贡献

欢迎报告问题或提出建议。改动业务前建议先阅读 [错误处理与 Result 模式快速上手](./docs/error-handling-quickstart.md)，开发指南与代码规范见 [CONTRIBUTING.md](./CONTRIBUTING.md)。

## 许可

[GPL-3.0](./LICENSE)
