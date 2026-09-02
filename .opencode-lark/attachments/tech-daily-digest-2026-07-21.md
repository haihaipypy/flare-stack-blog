# 无辣的学习笔记 — 每日教程精选

> 2026年7月21日 星期二 · 今日精选 8 条 · 涵盖 Docker/NAS/免费工具/AI/安全

---

## 🔥 今日推荐教程

### 1. 为知笔记 Docker 私有部署全流程教程

🎯 **难度**: ⭐⭐ &nbsp;|&nbsp; ⏱️ **预计耗时**: 20 分钟 &nbsp;|&nbsp; 🏷️ **标签**: Docker/自托管

📝 **你能学到**: 用一条 `docker run` 在自己服务器或 NAS 上跑起为知笔记私有服务，5 个账号以内永久免费，数据全留本地，告别订阅制笔记。

🔧 **所需工具/环境**: 一台已装 Docker 的 Linux 服务器 / NAS（x64 或 ARM 均可），2G 以上内存。

💡 **学习建议**: 步骤非常直白——建数据目录、拉镜像、跑容器、浏览器访问即可。注意默认管理员账号 `admin@wiz.cn` / 密码 `123456`，**登进去第一件事就是改密码**。镜像更新直接删容器重拉即可，文末附了更新脚本。适合想拥有私有人知识库、又嫌 Obsidian 同步麻烦的朋友。缺点：收藏/通知等高级功能仍需付费许可，纯笔记场景完全够用。

🔗 **来源**: [阿里云开发者社区](https://developer.aliyun.com/article/1724509) &nbsp;|&nbsp; 👤 阿里云用户

---

### 2. Docker 一键部署：写公众号、小红书都不乱的排版神器

🎯 **难度**: ⭐⭐ &nbsp;|&nbsp; ⏱️ **预计耗时**: 10 分钟 &nbsp;|&nbsp; 🏷️ **标签**: Docker/自托管

📝 **你能学到**: 在飞牛 NAS / 任意 Docker 环境一键部署 NeuraPress——一个专为公众号、小红书作者设计的 Markdown 编辑器，所见即所得、一键复制 HTML，排版到微信/小红书后台不错位。

🔧 **所需工具/环境**: 飞牛 NAS（或任意装了 Docker 的机器），docker-compose。

💡 **学习建议**: 给的是现成 docker-compose 片段，改个端口就能跑，浏览器访问 `http://IP:3090` 即用。对经常写公众号/小红书、被排版折磨的人非常实用。作者提醒唯一缺点是不能调间距，且建议走 HTTPS 下使用（可用 Nginx Proxy Manager 反代）。低成本、零代码，小白友好。

🔗 **来源**: [飞牛私有云论坛](https://club.fnnas.com/forum.php?mod=viewthread&tid=42036) &nbsp;|&nbsp; 👤 徐大大

---

### 3. 零成本架构：用 Cloudflare 免费服务搭建生产级 Web 应用

🎯 **难度**: ⭐⭐⭐ &nbsp;|&nbsp; ⏱️ **预计耗时**: 40 分钟 &nbsp;|&nbsp; 🏷️ **标签**: 免费工具/白嫖

📝 **你能学到**: 一套经过验证的「零元架构」——用户请求经 Cloudflare CDN → Pages（前端）→ Workers（API）→ R2/D1/KV（存储）→ 私有网络连自有 VPS。月流量不超标成本就是 0 元，几万月活的产品都能扛。

🔧 **所需工具/环境**: Cloudflare 免费账号、一个域名（几块钱/年）、GitHub 仓库、Wrangler CLI。

💡 **学习建议**: 文章把免费额度列得很清楚（Workers 10 万请求/天、R2 10GB、D1 5GB、KV 1GB），并诚实指出了 5 个常见坑：KV 最终一致、R2 无原生目录列表、冷启动、D1 复杂查询慢。适合想做独立产品又不想先掏服务器钱的朋友。门槛在「要理解各组件分工」，建议先照着搭一个最小 Demo。

🔗 **来源**: [博客园](https://www.cnblogs.com/itech/p/20682608) &nbsp;|&nbsp; 👤 iTech

---

### 4. 通过 Cloudflare Pages 部署个人网站 + 独立域名绑定

🎯 **难度**: ⭐⭐ &nbsp;|&nbsp; ⏱️ **预计耗时**: 30 分钟 &nbsp;|&nbsp; 🏷️ **标签**: 免费工具/白嫖

📝 **你能学到**: 从零把开源项目构建成静态站点，上传到 Cloudflare Pages（自带全球 CDN、自动 HTTPS），再绑定自己几块钱一年的独立域名，全程免费。

🔧 **所需工具/环境**: Node.js 环境、VS Code、GitHub/本地构建出 dist、Cloudflare 账号、一个已购域名。

💡 **学习建议**: 手把手到「改 .env 后缀 → pnpm install → build → 上传 dist → 绑域名」每一步，还配了 B 站视频。对新手最友好的一条建站路径，比买服务器省心。注意构建后首次访问会稍慢，等缓存生效就好。域名可在阿里云/腾讯云买，解析到 CF 后几分钟生效。

🔗 **来源**: [博客园](https://www.cnblogs.com/ycfenxi/p/19105808) &nbsp;|&nbsp; 👤 ycfenxi

---

### 5. 手把手玩转本地大模型：Ollama + DeepSeek + Dify 零门槛全流程

🎯 **难度**: ⭐⭐⭐ &nbsp;|&nbsp; ⏱️ **预计耗时**: 1 小时 &nbsp;|&nbsp; 🏷️ **标签**: AI 效率工具

📝 **你能学到**: 在自己电脑/服务器上用 Ollama 跑起 DeepSeek 等开源大模型，再用 Dify 做可视化编排，搭出「数据不出本地、可离线运行」的私有 AI 工作站，还能直接调本地模型 API。

🔧 **所需工具/环境**: 一台有独显的电脑（7B 模型约需 4GB 显存）或服务器，Docker（Dify 用）。

💡 **学习建议**: 文章把「为什么本地化（隐私/成本/离线）」讲得很实在，并给了 Ollama 安装、模型选择（按显存对表）、Dify 接入、独立 API 调用、量化加速 5 个实操段落。坑点提醒很关键：Dify 用 Docker 部署时要填 `http://host.docker.internal:11434` 才能连到本机 Ollama；纯本地 DeepSeek 有幻觉，需要联网增强。适合想摆脱 API 账单、又重视数据隐私的开发者。

🔗 **来源**: [腾讯云开发者社区](https://cloud.tencent.com/developer/article/2548404) &nbsp;|&nbsp; 👤 霍格沃兹-测试开发学社

---

### 6. n8n 本地部署完整教程

🎯 **难度**: ⭐⭐ &nbsp;|&nbsp; ⏱️ **预计耗时**: 25 分钟 &nbsp;|&nbsp; 🏷️ **标签**: AI 效率工具

📝 **你能学到**: 用 Docker（推荐）或 npm 把 n8n 这个开源工作流自动化工具跑在自己机器上，它支持 400+ 应用集成、可视化画布、AI 原生节点，可做自动化爬虫、定时任务、AI Agent 编排。

🔧 **所需工具/环境**: 已装 Docker 的服务器/NAS，或 Node.js ≥18。

💡 **学习建议**: 内容覆盖系统要求、两种部署方式、初始化访问、高级配置，属于「照抄命令就能起来」的类型。和 Dify 互补——Dify 偏 AI 应用，n8n 偏通用自动化编排。注意 n8n 默认无鉴权，暴露公网务必加反向代理 + 账号保护。适合想把重复活（签到、数据同步、消息推送）交给机器的人。

🔗 **来源**: [CSDN 博客](https://blog.csdn.net/weixin_42403632/article/details/157291874) &nbsp;|&nbsp; 👤 weixin_42403632

---

### 7. Bitwarden + Vaultwarden 自托管密码管理

🎯 **难度**: ⭐⭐ &nbsp;|&nbsp; ⏱️ **预计耗时**: 30 分钟 &nbsp;|&nbsp; 🏷️ **标签**: 安全防护

📝 **你能学到**: 用 Docker 一键部署 Vaultwarden（Bitwarden 的轻量 Rust 实现），把全家账号密码、2FA、安全笔记存到自己的服务器，官方客户端全平台通用，且 TOTP 等高级功能在自建版里**全部免费**。

🔧 **所需工具/环境**: 一台小水管 VPS 或 NAS + 一个 HTTPS 域名（可用 Cloudflare Tunnel / 反代解决）。

💡 **学习建议**: 给的 docker-compose 直接可用，重点提醒两个安全细节：①部署完**务必把 `SIGNUPS_ALLOWED` 改回 false**，否则谁都能来你服务器注册；②主密码是端到端加密的，忘了谁都救不回来，一定记牢。相比 1Password 每年几百块订阅，自建零成本且数据自主，强烈推荐每个 NAS 玩家都搞一个。

🔗 **来源**: [空白时间](https://blog.blanktime.cn/2026/03/04/pwd) &nbsp;|&nbsp; 👤 blanktime

---

### 8. 数据备份与灾难恢复完全指南（3-2-1 原则 + Restic）

🎯 **难度**: ⭐⭐⭐ &nbsp;|&nbsp; ⏱️ **预计耗时**: 1 小时 &nbsp;|&nbsp; 🏷️ **标签**: 安全防护

📝 **你能学到**: 一套工业级备份防线——遵循 3-2-1 黄金原则（3 份副本、2 种介质、1 份异地），从本地 tar/rsync、Docker 卷备份，到 Cloudflare R2 异地云备份、Restic 加密去重，最后用自动化脚本 + 恢复演练闭环。

🔧 **所需工具/环境**: Linux 服务器、Cloudflare R2（免费 10GB）、Restic、cron。

💡 **学习建议**: 最值钱的一句话是「未经恢复测试的备份等于没有备份」——文末强调每月至少做一次恢复演练。对敏感配置（含密码的 .env）建议用 Restic（AES-256 上传前加密）或 openssl 再裹一层。覆盖面广、从手动到全自动都有，适合刚搭好 NAS/服务器、还没认真想「万一硬盘挂了怎么办」的朋友。

🔗 **来源**: [VPSKnow](https://vpsknow.com/guides/data-backup) &nbsp;|&nbsp; 👤 VPSKnow

---

## 📋 今日其他发现

- **[异地组网：免域名免备案自建 Tailscale DERP 节点](https://www.zair.top/post/private-network-with-tailscale-derp/)** — 国内网络下提升 Tailscale 连接质量，不用域名不用备案 `安全/网络`
- **[Duplicati：免费开源的数据备份软件](https://ababtools.com/?post=1403)** — 支持 AES-256 加密、增量去重、多种云后端，个人备份利器 `安全/备份`
- **[Cloudflare Tunnel 免费内网穿透保姆级教程](https://blog.yasking.org/a/using-cloudflare-tunnel-service)** — 白嫖 CF 的 Tunnel 把 NAS 暴露公网，自带 HTTPS 与访问防护 `安全/网络`

---

## 🛠️ 今日工具/项目

- **[Vaultwarden](https://github.com/dani-garcia/vaultwarden)** — Bitwarden 的轻量 Rust 服务端实现，10MB 内存即可跑，全平台客户端兼容，自建密码管理首选 ⭐ 33k+
- **[Dify](https://github.com/langgenius/dify)** — 开源 LLM 应用开发平台，拖拽式编排 AI 工作流，可接入本地 Ollama 模型 ⭐ 90k+
- **[Cloudflare 免费套餐](https://www.cloudflare.com/)** — Pages/Workers/R2/D1/KV/Tunnel 一整套免费基础设施，独立开发者「赛博活佛」 ⭐ 免费用

---

## 📌 待写选题（感兴趣可以深入）

- EasyTier 自建异地组网核心节点：比 Tailscale 官方中转更快的平民方案，适合公司-家两点互联。
- Cloudflare R2 + D1 作为 NAS 异地备份目标：零出站流量费，搭配 Restic 加密去重做 3-2-1 最后一环。
- Ollama 模型量化与多模型切换实战：不同显存下怎么选模型、q4/q8 量化的取舍，把本地 AI 跑得又稳又快。

---

> 📮 公众号「无辣的学习笔记」专注 Docker、NAS、自托管、免费工具等小白友好教程。
> ⚠️ 所有内容仅供参考，转载需注明出处。
> 生成时间: 2026-07-21 08:30 (UTC+8)
