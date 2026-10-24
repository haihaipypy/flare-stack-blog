/**
 * 推广位配置表（单一事实来源）
 *
 * 广告位由模板固定（见 affiliate.slots.ts），真正的推广链接集中在这里维护 ——
 * 厂商换链接时只改本文件，不用回头改历史文章。
 *
 * 合规约定：
 * - 卡片上不出现「返佣 / 返利 / 返现」字样，只描述读者能得到什么。
 * - 所有外链经 /go/:slug 中转，统一带 rel="sponsored nofollow"。
 */

export type AffiliateProvider = "aliyun" | "tencent";

/** 推广位元信息。slug 不在这里定 —— 它由配置表的键推导，见下方 AffiliateOffer。 */
export interface AffiliateOfferMeta {
  provider: AffiliateProvider;
  /** 平台展示名 */
  providerName: string;
  /** 卡片标题 */
  title: string;
  /** 读者视角的优惠点（一句话） */
  perk: string;
  /** 目标链接（含推广参数） */
  url: string;
  /** 适用场景，便于以后做自动匹配 */
  tags: readonly string[];
}

export const affiliateOffers = {
  /** 阿里云 · 云小站（通用，8 折） */
  "aliyun-general": {
    slug: "aliyun-general",
    provider: "aliyun",
    providerName: "阿里云",
    title: "云小站 · 上云特惠",
    perk: "云服务器 / 轻量 · 新用户 8 折",
    url: "https://www.aliyun.com/minisite/goods?userCode=wbeuoz6m",
    tags: ["vps", "docker", "self-host", "general"],
  },

  /** 阿里云 · AI 应用一键部署（低至 ¥99/年） */
  "aliyun-99": {
    slug: "aliyun-99",
    provider: "aliyun",
    providerName: "阿里云",
    title: "轻量应用服务器 · AI 部署",
    perk: "低至 ¥99 / 年，够跑 Docker",
    url: "https://www.aliyun.com/activity/ecs/clawdbot?userCode=wbeuoz6m",
    tags: ["vps", "docker", "ai", "self-host"],
  },

  /** 阿里云 · OSS 存储（新老同享） */
  "aliyun-oss": {
    slug: "aliyun-oss",
    provider: "aliyun",
    providerName: "阿里云",
    title: "对象存储 OSS",
    perk: "¥118.99 / 年起，新老用户同享",
    url: "https://dashi.aliyun.com/activity/oss?userCode=wbeuoz6m",
    tags: ["storage", "image", "backup"],
  },

  /** 腾讯云 · 2核2G4M 新客 99 元/年 */
  "tencent-99": {
    slug: "tencent-99",
    provider: "tencent",
    providerName: "腾讯云",
    title: "2核2G4M 轻量服务器",
    perk: "新客 99 元 / 年起",
    url: "https://cloud.tencent.com/act/cps/redirect?redirect=6544&cps_key=76a98775becf95bc2d3226a56d7a9b8c",
    tags: ["vps", "docker", "self-host", "general"],
  },

  /** 腾讯云 · 云产品全品类 */
  "tencent-products": {
    slug: "tencent-products",
    provider: "tencent",
    providerName: "腾讯云",
    title: "云产品特惠",
    perk: "云服务器 / COS / CDN / 数据库",
    url: "https://cloud.tencent.com/act/cps/redirect?redirect=2446&cps_key=76a98775becf95bc2d3226a56d7a9b8c",
    tags: ["general", "storage", "database"],
  },
} as const satisfies Record<string, AffiliateOfferMeta & { slug: string }>;

export type AffiliateSlug = keyof typeof affiliateOffers;

/**
 * 对外的推广位完整类型：slug 收敛为联合类型（而不是 string），
 * 这样拿它去查表、拼 /go/:slug 都能被类型系统校验。
 */
export type AffiliateOffer = AffiliateOfferMeta & { slug: AffiliateSlug };

export const affiliateSlugs = Object.keys(affiliateOffers) as AffiliateSlug[];

export function isAffiliateSlug(value: string): value is AffiliateSlug {
  return Object.hasOwn(affiliateOffers, value);
}

export function getAffiliateOffer(slug: string): AffiliateOffer | null {
  return isAffiliateSlug(slug) ? affiliateOffers[slug] : null;
}
