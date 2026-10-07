# 上游仓库对比分析（本地 v1.5.2 → 上游 v3.2.0）

- 本地：`haihaipypy/flare-stack-blog` @ `7a12333`（version **1.5.2**）
- 上游：`du2333/flare-stack-blog` @ `9665b98a`（version **3.2.0**）
- 共同祖先：`17080236`（2026-07-27）
- 差异规模：**1082 个文件变更、+70735 / -65925 行**；本地独有 63 提交，上游独有 **247 提交**

```bash
# 复现方式
git remote add upstream https://github.com/du2333/flare-stack-blog.git
git fetch upstream main
git merge-base HEAD upstream/main
```

---

## 一、结论先说

**原仓库不是"加功能"，而是近乎重写。** 从 1.5.2 到 3.2.0（横跨 2.x、3.x 两个大版本）它把技术底座整个换了一遍：

| 维度 | 本地（1.5.2） | 上游（3.2.0） |
|---|---|---|
| API 层 | Hono + `createServerFn` | **oRPC + OpenAPI** |
| 代码规范 | Biome | **oxlint + oxfmt** |
| TS | TS 5.x | **TS 7** |
| 发布流程 | Cloudflare Workflows | **Durable Object** |
| 公开页缓存 | KV + CDN purge | **Workers Caching** |
| 搜索 | Orama（客户端） | **D1 FTS（服务端）** |
| 主题 | default / fuwari 双主题包 | **单 Fuwari，主题包已删除** |
| 对外接口 | **MCP + OAuth Provider** | **Admin API Keys + HTTP API**（MCP 已删除） |
| 配置 | wrangler.jsonc + 环境变量 | **cloudflare.config.ts** |

> ⚠️ **不能整体 merge / rebase**。上游把本地所有自研改动依赖的底座都拆了，强行合并等于重写整个项目。
> 唯一可行的路线是 **"按功能挑着移植"**。

**好消息**：上游的编辑器增强（Mermaid / 斜杠菜单 / 语言选择器 / 表格 QoL / 就地编辑）与本地**共享同一套基座**——
两边都是 `src/features/posts/editor/extensions/*` + `src/components/tiptap-editor/*`，
本地 `code-block/`、`table/`、`images/`、`upload-image/` 目录在上游是同一批文件的演化版。
**这一类是移植性价比最高的部分。**

---

## 二、A 类：可直接移植（低耦合，风险小）

这些功能改动独立、不依赖 oRPC / Durable Object 等新底座，可以单独 cherry-pick 后小改适配。

| # | 功能 | 上游提交 | 规模 | 本地现状 | 移植要点 |
|---|---|---|---|---|---|
| A1 | **SVG 上传 + 尺寸解析** | `127416d1` | 4 文件 +230 | 白名单只有 jpeg/png/webp/gif | `media.schema.ts` 加 `image/svg+xml`；`image-dimensions.ts` 加 SVG 分支（优先 width/height，回退 viewBox） |
| A2 | **代码块语言 +33 种** | `782ad788` | 2 文件 +240 | `languages.ts` 仅 26 种 | 纯注册表扩充：vue/svelte/astro/scss/less/diff/toml/ini/powershell/nginx/graphql/lua/dart/... 共 33 种。Worker 体积 +0.84 MiB（懒加载） |
| A3 | **语言选择器可搜索** | `b9703d72` | 7 文件 +520 | 无 | 依赖 A2；加搜索框、键盘导航、按 display name / id / alias 排序。需新增 `@floating-ui/dom` |
| A4 | **上一篇 / 下一篇（按日期）** | `ce1751f4` | 12 文件 +161/-290 | 本地有 `RelatedPosts`（相关文章） | 替换 `related-posts` 组件，后端补 `prev/next` 查询。**本地 post 页注释里已写到"后端 schema 未提供 prev/next"**，正好补上 |
| A5 | **版本检测免 GitHub Token** | `701d8d79` | 5 文件 +182 | 本地 `version.service.ts` 依赖 `GITHUB_TOKEN`，且指向自己的仓库 | 改为不依赖 token 的检测方式（避免 401/限流） |
| A6 | **首页 Fuwari 分页** | `7ce2d15d` | 15 文件 +352 | 首页无分页 | 加分页组件 + 路由参数；与本地首页自定义样式需对齐 |
| A7 | **邮件 Fuwari 样式** | `3084a95c` | 13 文件 +488 | 邮件模板是旧样式 | 邮件模板重排，需适配本地主题 token；另含 `6ed60388`（邮件用配置的站点标题） |
| A8 | **文章封面（Cover as Media）** | `13e7decb` | 32 文件 +597 | 无封面字段 | 需加 DB 字段（migration）+ 编辑器 UI + 列表/详情展示，中等工作量 |
| A9 | **静音用户（评论禁言）** | `c61a7eb0` + `1b6fcb1d` | 34 文件 +2158 | **本地无 muted-users 模块** | 全新功能：DB 表 + 后台管理页 + 评论提交校验。工作量较大但完全独立 |
| A10 | **Site Config 可配置导航链接** | `f12331ab` | 17 文件 +674 | 本地是**自研硬编码导航**（关于/隐私下拉 + tools 按钮） | ⚠️ 与本地自研冲突，**二选一**：要么用它替换自研，要么跳过 |

---

## 三、B 类：编辑器增强（共享基座，性价比最高）

本地与上游编辑器同源，但上游做了一系列重构（`@tiptap/suggestion`、`@floating-ui/dom`、统一语言注册表、内容渲染抽到 `src/features/posts/components/content/`）。

**移植难点**：本地是**主题包架构**，内容渲染在
`src/features/theme/themes/{default,fuwari}/components/content/render.tsx`；
上游已统一到 `src/features/posts/components/content/`。移植时需要决定：抽公共层，还是两套主题各改一遍。

| # | 功能 | 上游提交 | 规模 | 说明 |
|---|---|---|---|---|
| B1 | **Mermaid 图表渲染** ⭐ | `71f094db` + `2da6dfab` | 21 文件 +1176 | 发布页把 `mermaid` 代码块渲染成图（浏览器端渲染，不进 Worker bundle）；编辑器静止时预览图、点击回到源码、主题切换重渲。**最推荐** |
| B2 | **斜杠菜单 Slash Menu** ⭐ | `b9793c17` | 12 文件 +943 | 行首 `/` 唤起块菜单，中英文关键词过滤、键盘驱动 |
| B3 | **Markdown 粘贴格式化** | `de46775a` | 9 文件 +686 | 粘贴纯文本 Markdown 自动转富文本，需 `marked` |
| B4 | **链接就地编辑** | `1c4b7e27` | — | `Mod-k` + hover card 就地改链接 |
| B5 | **公式就地编辑** | `e85e5ff7` | — | `$` 输入规则 + 就地编辑面板 |
| B6 | **图片就地占位符** | `2364dbaf` | — | 行内占位符 + 选择器插入图片 |
| B7 | **选区浮动工具栏** | `dd3a87c4` | — | 选中文字弹出格式化菜单 |
| B8 | **表格 QoL** | `f783bd0e`/`56c2871d`/`224aa9a8`/`0abbce7b` | — | 列宽拖拽（按比例）、列对齐、菜单分组、插入前选尺寸 |
| B9 | **编辑器静止预览高亮** | `4bc05507` | 18 文件 +529 | 代码块在编辑器中静止时显示发布后的高亮效果 |

**B 类新增依赖**：`mermaid`、`@tiptap/markdown`、`@tiptap/suggestion`、`@floating-ui/dom`、`@tailwindcss/typography`、`marked`

---

## 四、C 类：不建议移植（架构重写 / 路线已废弃）

| 功能 | 上游提交 | 为什么不要碰 |
|---|---|---|
| oRPC 替换 Hono + createServerFn | `c0c93487` | 动了整个 API 层，本地所有自研 API / MCP 工具都要重写 |
| oxlint/oxfmt 替换 Biome、TS 7 | `d0c4bb0e` `0c50c390` | 工具链替换，收益低、噪音大 |
| 移除 Cloudflare Workflows → Durable Object 发布 | `02aa209f` `ba863e87` | **本地刚修好 workflows 发布流程**（`1aff27e`），换掉等于推翻 |
| Workers Caching 公开页缓存 | `82a613f8` | 本地是 KV + CDN purge 方案，且刚调通 |
| 单 Fuwari 主题（删除主题包） | `37cba522` `9259b111` | 本地是双主题架构，且用户在用 fuwari |
| 后台 Fuwari 全面改版 | `3f23b965` 等一大批 | 纯 UI 重做，与本地自定义后台冲突 |
| **移除 MCP + OAuth Provider，改 Admin API Keys** | `f739148f` `3fea0733` | ⚠️ **本地刚加的 MCP 工具属于上游已废弃路线**。注意：这不代表本地白做——MCP 仍能用，只是上游不再维护 |
| D1 FTS 替代 Orama 搜索 | `8ec18fb6` | 搜索后端替换，本地搜索链完整，收益不确定 |
| cloudflare.config.ts 配置 | `3c0a3558` | 配置体系替换，本地已跑通 wrangler |
| 移除 import/export、AI 审核 | `02aa209f` `681446fc` | 上游砍掉的功能，本地若在用则保留 |

---

## 五、D 类：本地已有等价物，**不要动**

| 功能 | 说明 |
|---|---|
| **文章分类 Category** | 本地是**自研多对多**（`post.categoryIds`）；上游 `cb6382c6` 是"**排他性单一分组**"，语义完全不同 → 移植会破坏本地分类 |
| 导航栏 | 本地自研（关于/隐私下拉、tools 入口）vs 上游 A10 可配置方案 |
| SEO | 本地已有 Baidu 推送、og:image、BlogPosting JSON-LD（`b4cd0d57` `6439eb52`）等自研 |
| 版本检测仓库地址 | 本地指向 `haihaipypy/flare-stack-blog`，移植 A5 时保留自己的仓库地址 |
| 页面浏览统计 | 本地有 `pageview` 模块（上游走 Umami 集成） |

---

## 六、推荐移植顺序（按性价比）

**第一梯队 · 低风险高收益**
1. A1 SVG 上传（最小改动，立竿见影）
2. A2 代码语言 +33 + A3 可搜索选择器
3. B1 Mermaid 图表渲染
4. A4 上一篇/下一篇
5. A5 版本检测免 token

**第二梯队 · 编辑器体验**
6. B2 斜杠菜单
7. B3 Markdown 粘贴
8. B4/B5/B6 就地编辑（链接 / 公式 / 图片）
9. B8 表格 QoL

**第三梯队 · 工作量较大**
10. A6 首页分页
11. A8 文章封面
12. A9 静音用户
13. A7 邮件样式

---

## 七、移植注意事项

1. **主题包架构是最大改造点**：上游内容渲染已统一到 `src/features/posts/components/content/`，本地在 `src/features/theme/themes/*/`。B 类功能建议**先抽一层共享 content 组件**，再让两套主题复用，否则要改两遍。
2. **后端接口要重写**：上游用 oRPC procedure，本地是 Hono + `createServerFn`。凡涉及新增接口的（A1 上传 schema、A4 prev/next 查询、A8 封面字段、A9 静音校验）都要按本地写法重写，不能直接拷。
3. **DB 变更**：A8（封面字段）、A9（静音表）需要 migration；本地已用 Drizzle，migrations 在 `migrations/`。
4. **i18n 可平移**：两边都用 Paraglide（`messages/en.json` + `zh.json`），文案键可基本照搬，注意删掉用不到的键。
5. **依赖**：移植 B 类前先装 `mermaid`、`@tiptap/suggestion`、`@floating-ui/dom`、`@tiptap/markdown`、`marked`、`@tailwindcss/typography`（包管理器同为 bun）。
6. **单功能提取方式**：
   ```bash
   # 看某功能的完整改动
   git show 71f094db
   # 只取某个文件
   git checkout upstream/main -- src/lib/code-languages.ts
   # 生成可 apply 的补丁
   git format-patch -1 127416d1 --stdout > /tmp/svg-upload.patch
   ```
7. **上游的提交说明写得很详细**（含设计权衡和 ADR 编号，见 `docs/adr/`），移植前建议先读 commit body，能省很多试错。

---

_生成时间：2026-10-07 · 基于 `git merge-base` 双向 diff 分析_

---

## 八、第一梯队实施记录（已完成，未提交）

> 状态：代码改完、类型检查 26 处（= 改前基线）、单元测试 163 全绿、biome 无告警。**尚未 commit / push / 部署。**

### A1 · SVG 上传
- `src/features/media/media.schema.ts`：`ACCEPTED_IMAGE_TYPES` 增加 `image/svg+xml`。
- `src/features/media/utils/image-dimensions.ts`：新增 `parseSvgDimensions()`，解析 `<svg>` 根节点的 `width`/`height`（仅 px 或无单位绝对值，`%` 不算），回退 `viewBox`。
- 新增测试 `image-dimensions.svg.test.ts`（6 例）。

### A2 · 代码语言 +33
- 新增 `src/lib/code-languages.ts`：统一语言注册表（67 项，含 `mermaid`），导出 `PLAIN_TEXT` / `MERMAID` / `isPlainTextLanguage` / `isMermaidLanguage` / `resolveCodeLanguage`。Shiki 语法全部走懒加载。
- `src/lib/shiki.ts`：删掉本地 `languageLoaders` / `aliases` 映射，改从注册表解析。
- 删除 `editor/extensions/code-block/languages.ts`（已无人引用）。
- 新增测试 `code-languages.test.ts`（18 例）。

### A3 · 可搜索语言选择器
- 新增 `language-picker.tsx`（搜索框 + 键盘导航 + portal 定位）与 `language-options.ts`（`filterLanguageOptions`，按 label/id/别名匹配，精确 > 前缀 > 包含）。
- `code-block-view.tsx`：`DropdownMenu` 换成 `LanguagePicker`。
- 新增测试 `language-options.test.ts`（6 例）。

### A4 · 上一篇 / 下一篇
- `posts.data.ts`：`findAdjacentPublicPosts()`（按 `publishedAt` 相邻，id 兜底，仅公开文章）。
- `posts.schema.ts`：`AdjacentPostsSchema` + 缓存键 `POSTS_CACHE_KEYS.adjacent`。
- `posts.service.ts`：`getAdjacentPosts()`，走 `CacheService.getVersioned`（7 天）。
- 新增 Hono 路由 `posts.adjacent.route.ts`（`GET /:slug/adjacent`），挂到 `lib/hono/routes.ts`。
- 新增公开 serverFn `getAdjacentPostsFn` + `adjacentPostsQuery`。
- **两套主题各加一个** `post-adjacent-nav.tsx`（fuwari 用 Chevron、default 用 Arrow），并接进各自 `pages/post/page.tsx`。

### A5 · 版本检测免 token
- `version.service.ts`：无 token 时用 `HEAD https://github.com/<repo>/releases/latest` 跟随重定向取版本号（不耗 API 配额）；有 token 仍走 API。失败写入 `recentFailure` 缓存 30 分钟。
- `version.schema.ts`：新增 `VERSION_CACHE_KEYS.recentFailure`。

### B1 · Mermaid 图表渲染
- 新增 `src/components/content/`：`mermaid-render.ts`、`mermaid-theme.ts`、`mermaid-diagram.tsx`、`themed-mermaid-diagram.tsx`。
- `mermaid-theme.ts` 做成**双 token 变体**：`fuwari` 读 `--fuwari-*`（oklch 实色，直接采样），`default` 读 shadcn 的 `--background/--primary/...`（纯 hsl 三元组，包一层 `hsl()`）。用 `OffscreenCanvas` 把任意 CSS 颜色合成到底色后转成不透明 hex，喂给 Mermaid 的 `base` 主题。
- SSR 守卫用 `typeof window === "undefined"`（本地 vitest 下 `import.meta.env.SSR` 恒为 `true`，用它会直接跑不了单测）。Mermaid 本体仍是**动态 import**，只有浏览器里真正挂载图表时才加载。
- 两套主题的 `code-block.tsx` 增加 `diagramSource?` 入参：有值时渲染图表、并以高亮代码作 fallback（且不启用折叠）；`render.tsx` 用 `isMermaidLanguage()` 判定后传入。
- 顺手把两处硬编码的 `LANGUAGE_MAP` 徽章映射删掉，改用 A2 的统一注册表（徽章现在能认全 67 种语言）。
- `fuwari/styles/index.css`：补齐 Mermaid 主题需要的 token（`--fuwari-code-bg`、`--fuwari-fg`、`--fuwari-warning(-bg)`、`--fuwari-danger(-fg)` 及 success/warning/danger hue）。
- i18n：`common_mermaid_render_failed`（zh/en）。
- 新增测试 `mermaid-diagram.test.ts`（6 例，jsdom + mock mermaid）。
- **未做**：编辑器内的 Mermaid 实时预览。上游把预览逻辑塞在重构后的 `code-block-view.tsx` 里，本地该文件是另一套实现，改动面大、风险高，留作后续独立任务。

### 依赖变更
- `package.json` / `bun.lock`：新增 `mermaid@^12.1.0`。

### 后续可选项（本次未做）
- 若 Worker 产物体积吃紧，可在 `vite.config.ts` 给 `ssr` 环境加 `mermaid` 的 alias 桩，把 mermaid 彻底挡在 Worker bundle 外。

