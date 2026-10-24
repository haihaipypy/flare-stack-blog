import {
  AFFILIATE_SLOT_IDS,
  AFFILIATE_SLUG_PATTERN,
  type AffiliateConfig,
  type AffiliateOffer,
  type AffiliateSlotId,
} from "./affiliate.schema";

/**
 * 默认配置。
 *
 * 首次部署、或后台还没保存过时用它 —— 也就是说「功能开箱即用」，
 * 不配也有广告，配了以后以数据库为准。
 *
 * 链接换了不用改代码：后台「广告管理」里改，保存即生效。
 * 这里只作为兜底，以及新库初始化时的种子值。
 */
export const DEFAULT_AFFILIATE_OFFERS: AffiliateOffer[] = [
  {
    slug: "aliyun-general",
    provider: "阿里云",
    title: "云小站 · 上云特惠",
    perk: "云服务器 / 轻量 · 新用户 8 折",
    url: "https://www.aliyun.com/minisite/goods?userCode=wbeuoz6m",
    enabled: true,
  },
  {
    slug: "aliyun-99",
    provider: "阿里云",
    title: "轻量应用服务器 · AI 部署",
    perk: "低至 ¥99 / 年，够跑 Docker",
    url: "https://www.aliyun.com/activity/ecs/clawdbot?userCode=wbeuoz6m",
    enabled: true,
  },
  {
    slug: "aliyun-oss",
    provider: "阿里云",
    title: "对象存储 OSS",
    perk: "¥118.99 / 年起，新老用户同享",
    url: "https://dashi.aliyun.com/activity/oss?userCode=wbeuoz6m",
    enabled: true,
  },
  {
    slug: "tencent-99",
    provider: "腾讯云",
    title: "2核2G4M 轻量服务器",
    perk: "新客 99 元 / 年起",
    url: "https://cloud.tencent.com/act/cps/redirect?redirect=6544&cps_key=76a98775becf95bc2d3226a56d7a9b8c",
    enabled: true,
  },
  {
    slug: "tencent-products",
    provider: "腾讯云",
    title: "云产品特惠",
    perk: "云服务器 / COS / CDN / 数据库",
    url: "https://cloud.tencent.com/act/cps/redirect?redirect=2446&cps_key=76a98775becf95bc2d3226a56d7a9b8c",
    enabled: true,
  },
];

const DEFAULT_SLOTS: Record<AffiliateSlotId, boolean> = {
  "post-top": true,
  "post-bottom": true,
  "tools-banner": true,
  "embed-float": true,
};

export function createDefaultAffiliateConfig(): AffiliateConfig {
  return {
    slots: { ...DEFAULT_SLOTS },
    offers: DEFAULT_AFFILIATE_OFFERS.map((offer) => ({ ...offer })),
  };
}

export const DEFAULT_AFFILIATE_CONFIG: AffiliateConfig =
  createDefaultAffiliateConfig();

/**
 * 把数据库里读到的（可能残缺、可能脏）配置归一化成完整结构。
 *
 * 逐条清洗而不是整份丢弃：
 * - 某个位置的开关缺失 → 补默认；
 * - 某条广告的 slug 或链接坏了 → 只丢这一条，其他照常；
 * - 整份结构完全不对（比如 offers 被写成了字符串）→ 才退回默认。
 *
 * 这样后台误存一条脏数据，不会把用户配好的 5 条链接全换成种子默认值。
 */
export function resolveAffiliateConfig(input: unknown): AffiliateConfig {
  const raw =
    input && typeof input === "object"
      ? (input as Record<string, unknown>)
      : {};

  const rawSlots =
    raw.slots && typeof raw.slots === "object"
      ? (raw.slots as Record<string, unknown>)
      : {};

  const slots = {} as Record<AffiliateSlotId, boolean>;
  for (const id of AFFILIATE_SLOT_IDS) {
    const value = rawSlots[id];
    slots[id] = typeof value === "boolean" ? value : DEFAULT_SLOTS[id];
  }

  let offers: AffiliateOffer[];
  if (Array.isArray(raw.offers)) {
    offers = raw.offers
      .map(normalizeOffer)
      .filter((offer): offer is AffiliateOffer => offer !== null);
  } else {
    offers = DEFAULT_AFFILIATE_OFFERS.map((offer) => ({ ...offer }));
  }

  return { slots, offers };
}

/**
 * 单条清洗。
 *
 * slug 和链接是硬要求（slug 是 /go/ 的主键，没链接点了也白点），坏了只能丢；
 * provider / title / perk 允许为空，留着让用户回后台补 —— 不至于「看不见就没法修」。
 */
function normalizeOffer(raw: unknown): AffiliateOffer | null {
  if (!raw || typeof raw !== "object") return null;

  const offer = raw as Record<string, unknown>;
  const slug = typeof offer.slug === "string" ? offer.slug.trim() : "";
  if (!AFFILIATE_SLUG_PATTERN.test(slug)) return null;

  const url = typeof offer.url === "string" ? offer.url.trim() : "";
  if (!/^https?:\/\/\S+$/i.test(url)) return null;

  return {
    slug,
    provider: typeof offer.provider === "string" ? offer.provider : "",
    title: typeof offer.title === "string" ? offer.title : "",
    perk: typeof offer.perk === "string" ? offer.perk : "",
    url,
    enabled: offer.enabled !== false,
  };
}

/** 页面渲染只关心启用中的、且有有效链接的 */
export function activeOffers(config: AffiliateConfig): AffiliateOffer[] {
  return config.offers.filter(
    (offer) => offer.enabled && /^https?:\/\//i.test(offer.url),
  );
}
