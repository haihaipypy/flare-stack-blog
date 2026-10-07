# 是否需要升级到上游 v3.2.0 · 数据可移植性分析

- 分析对象：本地 `haihaipypy/flare-stack-blog` @ `7a12333`（v1.5.2，63 个自研提交）→ 上游 `du2333/flare-stack-blog` @ `9665b98a`（v3.2.0，247 个新提交）
- 共同祖先：`17080236`（2026-07-27）

---

## 一、直接结论

### 要不要升级？
**作为"把现有站点替换成 v3.2.0"的操作——不建议。** 三点硬伤：

1. 你要丢掉约 **4800 行自研功能**（129 个文件），其中一部分（分类系统、MCP、主题定制）在新架构下**根本搬不回去**；
2. 上游**主动删除**了你在用的功能：import/export、AI 评论审核、页面浏览统计、MCP + OAuth、主题系统；
3. 部署方式从 GitHub Actions 改成 **Cloudflare Workers Builds**，且上游代码里明确写了**一旦这样部署就无法回退**。

### 数据好不好搬？
**好搬。** 基础 schema（迁移 `0000`–`0010`）与上游**逐字节完全一致**，文章、标签、评论、媒体、用户、友链、配置数据都能直接带走，R2 图片零搬迁。只有 **5 处会丢或需要转换**。

---

## 二、数据可移植性详解

### ✅ 完全可复用（不需要动）

| 资源 | 结论 | 依据 |
|---|---|---|
| **D1 基础表** | 结构一致 | 迁移 `0000`–`0010` 与上游 md5 完全相同 |
| **R2 媒体文件** | 桶可直接复用，图片零搬迁 | `media` 表结构、`key`/`url` 格式两边完全一致 |
| **KV 命名空间** | `KV` 可复用 | 同名绑定；`OAUTH_KV` 上游已不需要 |
| **Queue** | 现有 `blog-queue` 可用 | 上游通过 `QUEUE_NAME` 环境变量指定 |

涉及表：`posts`、`tags`、`post_tags`、`comments`、`media`、`post_media`、`user`(better-auth)、`session`、`account`、`friend_links`、`system_config`、`post_revisions`

### ⚠️ 会丢 / 需转换（5 处）

| # | 项目 | 上游动作 | 影响 | 处理方式 |
|---|---|---|---|---|
| 1 | **分类关系** | `0018` 新增 `posts.category_id`（单一） | **本地是多对多**（`post_categories`），一篇文章挂多个分类时只能保留一个 | 写映射脚本（建议取 `sort_order` 最小/最早绑定的那个） |
| 2 | **页面浏览量** | `0014` `DROP TABLE page_views` | 数据 + 功能一起消失 | 想留得自己改代码；否则只能接受 |
| 3 | **评论正文** | `0013` 把 TipTap JSON 转纯文本 | **加粗/斜体/代码等格式丢失**，链接变成"文字 + 空格 + URL" | 迁移脚本自动转换，无需手工 |
| 4 | **友链联系邮箱** | `0021` `DROP COLUMN contact_email` | 旧友链申请的联系邮箱丢失 | 上游改用注册用户 `user.email` |
| 5 | **阅读时长** | `0011` `DROP COLUMN read_time_in_minutes` | 字段丢失 | 上游改为前端估算或去掉 |

### ⚠️ 迁移脚本冲突（必须手工处理，否则直接报错）

```
本地 journal:  0000 ── 0010  ✅ 一致
                          └─ 0011_category_feature.sql   ← 手工建的，不在 journal 里
上游 journal:  0000 ── 0010  ✅ 一致
                          └─ 0011 … 0021            ← 11 个新迁移
```

三个坑：

1. **本地 `_journal.json` 只记录到 `idx 10`**，`0011_category_feature.sql` 不在其中 —— 分类表是当时手工建的，`wrangler d1 migrations apply` 根本没跑过它；
2. 上游 `0018_category` 是 `CREATE TABLE categories`（**没有 `IF NOT EXISTS`**）→ 本地已有同名表 → **执行必然失败**；
3. `0011_publish_public_snapshot` 会 `ADD COLUMN public_snapshot_json/public_slug` 并 `DROP` 本地在用的 `public_content_json`、`read_time_in_minutes`。

**正确顺序**：
```
导出分类数据 → DROP post_categories / categories
→ 替换为上游 migrations（0011–0021）→ apply
→ 导回分类名 → 把多对多关系映射成单一 category_id
```

---

## 三、升级要付的代价

### 会丢的自研功能（相对共同祖先：129 文件 / +4802 行）

| 类别 | 具体内容 | 能否搬回 v3.2.0 |
|---|---|---|
| **分类系统** | 多对多分类 + 后台管理 + MCP 工具 + 缓存失效逻辑 | ❌ 语义冲突（上游是"排他单一分组"） |
| **工具导航页** | `/tools` 页面 + 后台编辑入口 + i18n | 🟡 需重写（上游无此概念） |
| **AD 变现** | Google AdSense 脚本 + ads.txt | 🟡 UI 重做后可搬 |
| **SEO** | 百度主动推送、og:image、BlogPosting JSON-LD | 🟡 逻辑可搬，接口要重写 |
| **导航改造** | 关于/隐私下拉、tools 入口 | ❌ 与上游 Site Config 方案冲突 |
| **MCP 工具集** | categories、system_reset_cache 等 | ❌ 上游已删除 MCP |
| **首页定制** | 全屏 banner、透明卡片、2 行摘要、10 篇 | ❌ 上游首页已重写 |
| **头像预设库** | 15 张预设头像 | 🟡 静态资源可搬 |
| **其他** | pageview、import-export、AI 审核 | ❌ 上游已删除 |
| **主题系统** | default / fuwari 双主题包 | ❌ 上游已删除主题包 |
| **多域名** | `EXTRA_DOMAINS` 支持 | 🟡 上游有 DOMAIN 环境变量 |

### 上游主动删除、但你在用的功能

- `import/export`（`02aa209f`）
- AI 评论审核（`681446fc`）
- 页面浏览统计（`0014`）
- MCP + OAuth Provider（`f739148f`）
- 主题系统（`37cba522`）

### 部署方式变更（⚠️ 不可回退）

| | 本地 | 上游 v3.2.0 |
|---|---|---|
| 部署 | GitHub Actions + `wrangler deploy` | **Cloudflare Workers Builds** |
| 配置 | 自建 `wrangler.jsonc` | `cloudflare.config.ts` + 环境变量 |
| 环境变量 | `D1_DATABASE_ID` 等 | `WORKER_NAME` `QUEUE_NAME` `BUCKET_NAME` `D1_DATABASE_ID` `KV_NAMESPACE_ID` `DOMAIN` `ZONE_NAME` |

> 上游 `cloudflare.config.ts` 原注释：
> *"Once deployed this way, rolling back to a `migrations`-based wrangler config is rejected."*
> → **一旦用新方式部署，就回不去了。**

---

## 四、三条路线对比

| 路线 | 做法 | 数据处理 | 工作量 | 可回滚 | 建议 |
|---|---|---|---|---|---|
| **A 按需移植** | 现有站点不动，选择性移植上游功能（见上一份报告 A/B 类） | 不动 | 低–中 | ✅ | ✅ **推荐** |
| **B 双轨并行** | 新建 Worker + 新 D1 部署上游 v3.2.0，导数据验证，满意后切域名 | 一次性转换 5 处 | 中–高 | ✅ 旧站不动 | 🟡 想要新功能时可选 |
| **C 整体升级** | 迁到 v3.2.0 后把 4800 行自研再搬回去 | 转换 5 处 + 重写 | **极高（≈重写）** | ❌ | ❌ 不建议 |

**注意 B 方案不免费**：新站点是"原汁原味"的上游，AdSense、百度推送、SEO JSON-LD、分类体系、tools 页 **都得重新做一遍**，否则等于功能倒退。

---

## 五、如果走 B 方案，具体步骤

```bash
# 1. 备份现有 D1（双保险）
wrangler d1 export DB --remote --output backup-$(date +%F).sql
#    本地已有 safe-d1-migrate 的 time-travel 恢复点能力，可另存 bookmark

# 2. 记录现有资源
#    R2 桶名 / KV namespace id / Queue 名(blog-queue) / 域名 / 现有 secrets 清单

# 3. 新建一个 Worker（新名字，如 blog-v3）+ 新 D1（建议新库，便于回滚）

# 4. 部署上游 v3.2.0，在 Cloudflare Workers Builds 配置环境变量

# 5. 数据转换脚本处理 5 处差异（分类映射 / 评论已在迁移内自动转 / 浏览量放弃）

# 6. 导入新 D1，用临时域名验证（确认分类、图片、评论都正常）

# 7. 验证通过后再切主域名；旧 Worker 保留 1–2 周再删
```

---

## 六、我的建议

**先走 A（按需移植）**，理由：

- 你的定制已经形成了自己的产品形态（AdSense 变现、百度 SEO、分类体系、MCP 自动化），这些是有价值的私有资产，上游给不了；
- 上游 v3.2.0 刚发布，是单人项目，稳定性还需要观察；
- A 方案风险最低、随时可停。

**触发转向 B 的信号**（满足任意两条再考虑）：

1. 你想移植的上游功能超过 8–10 个，且都依赖新架构（oRPC / Durable Object / 单主题）；
2. 上游持续快速迭代，你感到"追不上"，且愿意放弃部分自研定制；
3. 你愿意接受浏览量丢失、分类变单一、评论丢格式这三项数据降级；
4. 你愿意把部署迁到 Cloudflare Workers Builds 并接受不可回退。

---

_生成时间：2026-10-07 · 基于 `git merge-base` 双向 diff + 迁移文件逐字节比对_
