import type { AffiliateSlug } from "./affiliate.config";

/**
 * 广告位定义。
 *
 * 文章不再写占位符 —— 位置写死在模板里，读者打开任何一篇文章都会看到，
 * 包括这次改动之前发布的历史文章（模板层插入，不依赖正文内容）。
 */
export type AffiliateSlotId =
  | "post-top" // 文章正文上方：「本文环境」
  | "post-bottom" // 文章结尾：横向横幅
  | "tools-banner"; // 工具页顶部横幅

export type AffiliateVariant = "env" | "banner";

interface SlotConfig {
  /** 该位置可出现的推广位 */
  pool: readonly AffiliateSlug[];
  /** 一次展示几条 */
  count: number;
  variant: AffiliateVariant;
  /** 是否在同一页面内排除另一个位置的选中结果（避免一篇文章出现两条相同广告） */
  excludeSlot?: AffiliateSlotId;
}

const ALL: readonly AffiliateSlug[] = [
  "aliyun-general",
  "aliyun-99",
  "aliyun-oss",
  "tencent-99",
  "tencent-products",
];

export const affiliateSlots = {
  "post-top": {
    pool: ALL,
    count: 2,
    variant: "env",
  },
  "post-bottom": {
    pool: ALL,
    count: 1,
    variant: "banner",
    excludeSlot: "post-top",
  },
  "tools-banner": {
    pool: ALL,
    count: 1,
    variant: "banner",
  },
} as const satisfies Record<AffiliateSlotId, SlotConfig>;

function fnv1a(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * 确定性挑选：同一个 seed（文章 slug）+ 同一个广告位，永远选出同一组结果。
 *
 * 为什么不用 Math.random()：
 * 1. 服务端渲染与客户端 hydration 必须一致，否则 React 报错、卡片闪一下；
 * 2. 页面是缓存的，随机会导致同一篇文章对外展示的广告来回变；
 * 3. 调试时说不清「这文章到底挂的哪条」。
 * 不同文章 / 不同位置会自动散开，整体分布仍然均匀。
 */
export function pickOffers(
  slot: AffiliateSlotId,
  seed: string,
  exclude: readonly AffiliateSlug[] = [],
): AffiliateSlug[] {
  const config = affiliateSlots[slot];
  const pool = config.pool.filter((slug) => !exclude.includes(slug));

  // 池子被排空（理论上不会）时退回原始池，宁可重复也不要空着
  const candidates = pool.length > 0 ? [...pool] : [...config.pool];

  const random = mulberry32(fnv1a(`${slot}:${seed}`));

  // Fisher-Yates
  for (let i = candidates.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }

  return candidates.slice(0, Math.min(config.count, candidates.length));
}
