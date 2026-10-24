import { getLocale } from "@/paraglide/runtime";

/**
 * 广告后台的文案。
 *
 * 这批文案只出现在管理页，不参与前台渲染，也不涉及 SEO，
 * 走 paraglide 要给 4 个语言各加 40 个 key、再手工维护编译产物，
 * 收益很低。集中在这里，按当前 locale 取一份，改动也方便。
 */
const zh = {
  title: "广告管理",
  desc: "位置开关、推广位内容、点击统计与站外嵌入代码。改完保存即时生效。",
  save: "保存",
  saving: "保存中",
  saved: "已保存",
  saveFailed: "保存失败，请重试",
  unsaved: "有未保存的改动",

  tabAffiliate: "广告",
  tabSlots: "位置开关",
  tabOffers: "推广位",
  tabStats: "数据统计",
  tabEmbed: "悬浮广告",

  slotsTitle: "站内广告位",
  slotsDesc:
    "关掉某个位置后，该位置立刻不再渲染。已经发布的历史文章同样适用 —— 位置是模板级插入，不依赖正文。",
  slotPostTop: "文章正文上方",
  slotPostTopDesc: "「本文环境」双卡，读者读教程之前就看到。转化率最高的位置。",
  slotPostBottom: "文章结尾",
  slotPostBottomDesc: "横向横幅一条，会自动避开正文上方已经出现过的那条。",
  slotToolsBanner: "工具页顶部",
  slotToolsBannerDesc: "页面 /tools 内容区上方一条横幅。",
  slotEmbedFloat: "站外悬浮广告",
  slotEmbedFloatDesc:
    "控制 /embed/float.js 是否下发内容。关掉后，别的网站即使插了代码也不会显示（脚本仍在，返回空）。",
  on: "已开启",
  off: "已关闭",

  offersTitle: "推广位内容",
  offersDesc:
    "这里就是所有广告链接的唯一来源。增删、改文案、改链接都在这一页，保存后前台立即生效，不用改代码也不用重新部署。",
  addOffer: "新增推广位",
  colSlug: "标识",
  colProvider: "平台",
  colTitle: "标题",
  colPerk: "优惠文案",
  colUrl: "推广链接",
  colEnabled: "启用",
  colActions: "操作",
  delete: "删除",
  slugHint: "会出现在 /go/<标识> 里。建好后不要改，改了老链接会失效。",
  emptyOffers: "还没有推广位。点「新增推广位」开始。",
  offerDisabledHint: "停用后不会出现在任何位置，但配置保留。",

  statsTitle: "点击统计",
  statsDesc:
    "只统计经过本站 /go/ 中转的点击，不存 IP 和 UA。站内点击按文章归类，站外按来源域名归类。",
  statsDays: "时间范围",
  days7: "近 7 天",
  days30: "近 30 天",
  days90: "近 90 天",
  statClicks: "总点击",
  statSources: "站外来源",
  statOffers: "有量的推广位",
  statPosts: "有量的文章",
  bySource: "站外来源",
  bySourceEmpty:
    "还没有站外点击。把嵌入代码放到别的网站后，这里会出现来源域名。",
  byOffer: "各推广位",
  byPost: "各文章",
  byPostEmpty: "还没有站内点击。",
  daily: "每日趋势",
  dailyEmpty: "这段时间没有点击。",
  lastClick: "最近一次",
  deletedOffer: "已删除的推广位",

  embedTitle: "站外悬浮广告",
  embedDesc:
    "把这张卡片挂到其他网站，点击会先回到本站 /go/ 再跳厂商 —— 收益和统计都还是你的。",
  embedStatusOn: "当前已开启",
  embedStatusOff: "当前已关闭，嵌入站点不会显示卡片",
  embedPreview: "预览效果",
  embedCode: "嵌入代码",
  embedCopy: "复制",
  embedCopied: "已复制",
  embedWhereTitle: "放在哪",
  embedWhere:
    "位置不限：</body> 前、<head> 里（保留 async）、<footer> 内部，或网站后台的「页脚代码」输入框。脚本会自己等 DOM 就绪再挂载。",
  embedParamsTitle: "可选参数",
  embedNote:
    "代码内容不需要改。以后换链接、加推广位，嵌了这段代码的网站会在 5 分钟内自动跟着更新。",
};

const en: typeof zh = {
  title: "Advertising",
  desc: "Slot toggles, offer content, click stats and the embed snippet. Save to apply immediately.",
  save: "Save",
  saving: "Saving",
  saved: "Saved",
  saveFailed: "Save failed, please retry",
  unsaved: "Unsaved changes",

  tabAffiliate: "Ads",
  tabSlots: "Slots",
  tabOffers: "Offers",
  tabStats: "Stats",
  tabEmbed: "Float ad",

  slotsTitle: "On-site slots",
  slotsDesc:
    "Turning a slot off stops it rendering right away — including on posts published before this change, since slots are injected at the template level.",
  slotPostTop: "Above post content",
  slotPostTopDesc:
    "Two “What this runs on” cards before the reader starts following along. Highest-converting slot.",
  slotPostBottom: "End of post",
  slotPostBottomDesc:
    "A single banner, automatically avoiding whatever was already shown above.",
  slotToolsBanner: "Tools page top",
  slotToolsBannerDesc: "One banner above the content on /tools.",
  slotEmbedFloat: "Off-site float ad",
  slotEmbedFloatDesc:
    "Controls whether /embed/float.js serves anything. When off, embedding sites show nothing (the script still returns, empty).",
  on: "On",
  off: "Off",

  offersTitle: "Offers",
  offersDesc:
    "The single source of truth for every ad link. Add, remove, edit copy or URLs here — changes go live on save, no code change or redeploy.",
  addOffer: "Add offer",
  colSlug: "Slug",
  colProvider: "Network",
  colTitle: "Title",
  colPerk: "Offer copy",
  colUrl: "Link",
  colEnabled: "On",
  colActions: "",
  delete: "Delete",
  slugHint:
    "Appears in /go/<slug>. Do not change it once published — old links will break.",
  emptyOffers: "No offers yet. Start with “Add offer”.",
  offerDisabledHint: "Disabled offers never appear, but the config is kept.",

  statsTitle: "Click stats",
  statsDesc:
    "Only clicks routed through /go/ are counted. No IP or UA is stored. On-site clicks are grouped by post, off-site by referring domain.",
  statsDays: "Range",
  days7: "Last 7 days",
  days30: "Last 30 days",
  days90: "Last 90 days",
  statClicks: "Clicks",
  statSources: "Sources",
  statOffers: "Offers with clicks",
  statPosts: "Posts with clicks",
  bySource: "Off-site sources",
  bySourceEmpty:
    "No off-site clicks yet. Once the snippet is live elsewhere, referring domains appear here.",
  byOffer: "By offer",
  byPost: "By post",
  byPostEmpty: "No on-site clicks yet.",
  daily: "Daily",
  dailyEmpty: "No clicks in this range.",
  lastClick: "Last click",
  deletedOffer: "Deleted offer",

  embedTitle: "Off-site float ad",
  embedDesc:
    "Put this card on any other site. Clicks route back through your /go/ redirect, so revenue and stats stay with you.",
  embedStatusOn: "Currently on",
  embedStatusOff: "Currently off — embedding sites will show nothing",
  embedPreview: "Preview",
  embedCode: "Embed code",
  embedCopy: "Copy",
  embedCopied: "Copied",
  embedWhereTitle: "Where to paste",
  embedWhere:
    "Anywhere: before </body>, inside <head> (keep async), inside <footer>, or a site’s custom footer code box. The script waits for DOM readiness on its own.",
  embedParamsTitle: "Optional attributes",
  embedNote:
    "The snippet itself never changes. If you edit links or add offers, sites carrying it pick up the update within 5 minutes.",
};

const TEXTS = { zh, en } as const;

export type AffiliateAdminText = typeof zh;

export function getAdminText(): AffiliateAdminText {
  return getLocale() === "en" ? TEXTS.en : TEXTS.zh;
}
