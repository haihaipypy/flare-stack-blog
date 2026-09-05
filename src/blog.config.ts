import type { SiteConfig } from "@/features/config/site-config.schema";

export const blogConfig = {
  title: "站点名称",
  author: "无辣",
  description:
    "无辣的学习笔记：专注 Docker、NAS、Cloudflare、AI 工具等自托管实操教程。文章均亲手部署验证，附完整命令、配置截图与踩坑记录，小白可照着复现，力求原创可复现、不讲虚的。",
  bio: "我是无辣，一个整天在家折腾 NAS 和 Docker 的“自托管老玩家”。这地方不聊虚的，就记我怎么一步步把各种服务器、小工具、AI 应用亲手跑通——命令全给你、坑也照实踩给你看。你要是也想自己搭点啥，照着我的笔记来就行，卡住了随时评论区喊我。",
  tools_page_title: "工具页面",
  tools_page_description: "此页面内容可在后台编辑。",
  tools_page_content: "",
  social: [
    { platform: "github", url: "https://github.com/example" },
    { platform: "email", url: "mailto:example@email.com" },
    { platform: "rss", url: "/rss.xml" },
  ],
  icons: {
    faviconSvg: "/favicon.svg",
    faviconIco: "/favicon.ico",
    favicon96: "/favicon-96x96.png",
    appleTouchIcon: "/apple-touch-icon.png",
    webApp192: "/web-app-manifest-192x192.png",
    webApp512: "/web-app-manifest-512x512.png",
  },
  theme: {
    default: {
      navBarName: "导航栏名称",
    },
    fuwari: {
      homeBg: "/images/home-bg.webp",
      avatar: "/images/avatar.png",
      primaryHue: 250,
    },
  },
} as const satisfies SiteConfig;
