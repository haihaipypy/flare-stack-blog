/**
 * 旧中文 slug → 新英文 slug 的 301 重定向映射表。
 *
 * 背景：2026-09-21 全站文章 slug 由中文批量改为英文。平台保留了旧地址的可解析性，
 * 旧中文地址现在仍返回 200，于是同一篇文章出现两个各自 self-canonical 的 URL，
 * 构成重复内容，对 SEO 与 AdSense 审核不利。此表用于把旧地址永久（301）重定向到新地址。
 *
 * 约定：
 * - key 为「解码后」的请求路径（中文原样、不带尾部斜杠），value 为对应的新目标路径。
 * - 纯静态数据：不查数据库、不读 KV。
 * - 本表只增不改不删 —— 旧地址已被搜索引擎收录。
 * - slug 大小写敏感：归一化只做 decodeURIComponent + 去尾斜杠，绝不 toLowerCase()。
 *
 * 关于「源站 404」的 7 条（下方已标注）：
 * 58 条里有 51 条源站仍返回 200 且 canonical 指向自己 —— 这才是要消的真重复内容；
 * 另外 7 条源站直接 404。这 7 条的字符串是平台记录的唯一历史值（恰等于「当前标题 →
 * 小写 / 去标点 / 空白转连字符」的推导结果），不存在"更真实"的旧地址可补正。
 * 它们虽无重复内容要消，却只有靠本中间件才救得回 —— 因为中间件运行在路由与源站之前，
 * 不依赖源站状态。故一并保留，不删。
 */
export const OLD_SLUG_REDIRECTS: Readonly<Record<string, string>> = {
  "/post/40元10年顶级域名xyz注册教程并托管到edgeone":
    "/post/xyz-domain-cheap-10-years",
  "/post/docker部署wechat-selkies实现浏览器上访问网页版微信":
    "/post/wechat-selkies-docker",
  "/post/docker部署海鲜市场24小时商品价格监控平台":
    "/post/xianyu-price-monitor-docker",
  "/post/docker部署免费的ai去除背景工具保障隐私":
    "/post/ai-background-remover-docker",
  // 源站 404：无重复内容要消，仅靠本中间件（先于源站执行）救回
  "/post/docker部署一个隐私优先的免费pdf工具箱-bentopdf":
    "/post/bentopdf-docker",
  "/post/docker搭建alist的代替者openlist": "/post/openlist-docker",
  "/post/docker镜像加速专家kspeeder拉取速度每秒20mb":
    "/post/kspeeder-docker-accelerator",
  "/post/nas-上部署-web-scrcpy免安装客户端网页远程控制手机神器":
    "/post/web-scrcpy-nas",
  "/post/nas安装edge浏览器docker版本超级简单":
    "/post/edge-browser-docker-nas",
  "/post/nas一键部署私人音乐服务器小米音箱联动全平台畅听":
    "/post/music-server-xiaomi-speaker",
  "/post/obsidian完美同步插件多端实时同步笔记历史版本页面管理面板一次解决全部同步痛点":
    "/post/obsidian-sync-plugin",
  "/post/ubuntu开启samba文件共享": "/post/ubuntu-samba-share",
  "/post/飞牛nas部署docker专属私人音乐库安装插件拓展更多功能":
    "/post/songloft-music-docker",
  "/post/飞牛os控制风扇转速的脚本实现降噪": "/post/fnos-fan-speed-script",
  "/post/飞牛第三方商店一键安装新手福音不用手动折腾docker":
    "/post/fnos-fndepot-store",
  "/post/服务器部署可道云实现文档在线查看及分享并通过syncthing实时同步文件":
    "/post/kodbox-syncthing-docker",
  "/post/股票智能分析系统ai智能炒股定时推送股票分析docker部署":
    "/post/stock-analysis-system-docker",
  // 源站 404：无重复内容要消，仅靠本中间件（先于源站执行）救回
  "/post/家庭服务器安装pve虚拟机": "/post/pve-home-server",
  "/post/局域网内所有设备使用同一个kspeeder进行docker镜像源加速":
    "/post/kspeeder-lan-docker-mirror",
  "/post/雷池waf社区版反代免费防火墙npm升级替代":
    "/post/safeline-waf-reverse-proxy",
  "/post/免费大餐太香了赛博大善人cloudflare终极白嫖指南":
    "/post/cloudflare-free-tier-guide",
  "/post/如何在ubuntu上挂载smb共享": "/post/ubuntu-mount-smb",
  "/post/使用frp实现内网穿透通过域名访问本地服务":
    "/post/frp-tunnel-domain-access",
  "/post/使用lucky保护你的飞牛开启waf防火墙设置ip过滤":
    "/post/lucky-waf-ip-filter",
  "/post/无需公网服务器公益frp网站实现内网穿透": "/post/free-public-frp-server",
  "/post/喜欢看漫画的进用nas打造个人本地漫画库支持mobi格式":
    "/post/nas-comic-library-mobi",
  "/post/用github和cloudflar免费搭建一个自己的短链系统":
    "/post/free-url-shortener-github-cloudflare",
  "/post/在nas上用docker部署一个在线工具站tools-web":
    "/post/tools-web-docker-nas",
  "/post/github-store开源github应用商店免费开源应用一键安装即时更新":
    "/post/github-store-one-click",
  // 源站 404：无重复内容要消，仅靠本中间件（先于源站执行）救回
  "/post/sefirah小米windows互联的替代品比小米互联好用的多":
    "/post/sefirah-xiaomi-windows-link",
  "/post/国内不限期免费使用codex方案支持生成图片和视频":
    "/post/free-codex-image-video",
  "/post/免费开源无广的手机app用浏览器控制手机全部操作":
    "/post/browser-control-android-app",
  "/post/免费使用小米mimo-v25-tts在线语音模型搭配阅读app听小说":
    "/post/mimo-tts-reader",
  "/post/任何摄像头实现windows面容解锁": "/post/windows-face-unlock-any-camera",
  "/post/双系统切换给switch刷入大气层及android11系统并root":
    "/post/switch-atmosphere-android11",
  // 源站 404：无重复内容要消，仅靠本中间件（先于源站执行）救回
  "/post/一款全新麦克风串流软件手机做电脑麦克风工具micyou":
    "/post/micyou-phone-microphone",
  // 源站 404：无重复内容要消，仅靠本中间件（先于源站执行）救回
  "/post/最新windows自带虚拟机hyper-v安装win11教程含家庭版安装方法及设置神器推荐":
    "/post/hyperv-install-win11",
  "/post/8-种常用markdown语法": "/post/markdown-syntax-basics",
  "/post/cloudflare-pages-搭建免费图床-享受-telegram-的无限空间":
    "/post/cloudflare-pages-telegram-image-host",
  "/post/edge浏览器又爆漏洞你的密码正在以明文形式裸奔":
    "/post/edge-password-plaintext-vulnerability",
  "/post/openwrt软路由拨号的-ipv6-配置教程": "/post/openwrt-ipv6-dialup",
  "/post/本地ai离线也好用gemma-4让你的电脑变身本地ai助手不用token完全免费-手机也能离线使用":
    "/post/gemma4-local-ai-offline",
  "/post/飞牛开启eui64功能实现主路由ipv6防火墙单设备放行":
    "/post/fnos-eui64-ipv6-firewall",
  // 源站 404：无重复内容要消，仅靠本中间件（先于源站执行）救回
  "/post/飞书官方下场养龙虾2分钟一键部署-openclaw每日100万免费-tokens-尽情挥霍":
    "/post/feishu-openclaw-deploy",
  "/post/浮动网关一个插件解决旁路由方案最大痛点":
    "/post/floating-gateway-bypass-router",
  "/post/告别token焦虑全网免费大模型api资源汇总": "/post/free-llm-api-list",
  "/post/基于cloudflare-r2搭建免费云盘支持带密码分享查看下载量管理用户等功能":
    "/post/cloudflare-r2-cloud-drive",
  "/post/利用cloudflare把你的gmail改造成企业邮箱免费专业域名海外邮件轻松收发":
    "/post/cloudflare-gmail-business-email",
  "/post/零成本用-cf-搭建基于-tg-的无限容量私有图床加网盘":
    "/post/cloudflare-telegram-image-host",
  // 源站 404：无重复内容要消，仅靠本中间件（先于源站执行）救回
  "/post/使用cf-worker部署github镜像站":
    "/post/cloudflare-worker-github-mirror",
  "/post/无公网ip免费内网穿透最安全方案-cloudflare-tunnel-增加加速方案":
    "/post/cloudflare-tunnel-no-public-ip",
  "/post/无须nascloudflare免费搭建开源密码管理工具bitwarden":
    "/post/bitwarden-vaultwarden-cloudflare",
  "/post/无需服务器零成本搭建一个带后台的个人博客薅秃cloudflare所有免费功能":
    "/post/free-blog-cloudflare-fullstack",
  "/post/重置二维码甲骨文登录二次验证改为bitwarden验证器的方法":
    "/post/oracle-2fa-bitwarden",
  "/post/飞牛nas内存压缩实战8g内存秒变125g小内存nas的免费扩容方案":
    "/post/fnos-zram-memory-compression",
  "/post/部署omniroute免费ai网关一键反代opencode实现tokens自由":
    "/post/omniroute-free-ai-gateway",
  "/post/一句话让你的opencode学会免费生成图片和视频":
    "/post/opencode-free-image-video",
  "/post/没有nas不要愁windows使用wsl安装docker容器体验服务器功能":
    "/post/windows-wsl-docker",
};

/**
 * 把请求路径归一化后查表：命中返回新目标路径，未命中返回 null。
 *
 * 归一化步骤：
 * 1. decodeURIComponent 解码（旧路径含中文，浏览器会 percent-encode）；解码失败时按原样处理。
 * 2. 去掉尾部斜杠，让 /post/xxx/ 与 /post/xxx 都能命中。
 * 3. 精确匹配（区分大小写），不做前缀或通配匹配。
 */
export function resolveOldSlugRedirectPath(pathname: string): string | null {
  let normalized = pathname;

  try {
    normalized = decodeURIComponent(normalized);
  } catch {
    // 非法 percent-encoding：保持原样继续，交由下面的精确匹配判断
  }

  // 去掉尾部斜杠（保留根路径 "/" 自身）
  if (normalized.length > 1 && normalized.endsWith("/")) {
    normalized = normalized.replace(/\/+$/, "");
  }

  if (!Object.hasOwn(OLD_SLUG_REDIRECTS, normalized)) {
    return null;
  }

  return OLD_SLUG_REDIRECTS[normalized];
}
