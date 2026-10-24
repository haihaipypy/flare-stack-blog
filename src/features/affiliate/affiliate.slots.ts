import { AFFILIATE_SLOT_META, type AffiliateSlotId } from "./affiliate.schema";

/**
 * 广告位的确定性挑选。
 *
 * 候选列表来自数据库（后台可增删），这里只负责「从候选里挑几条」，
 * 不依赖任何编译期常量。
 */

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
 *
 * @param candidates 可用的 slug（已过滤掉停用的、链接无效的）
 * @param exclude 本页已经用掉的 slug（避免一篇文章出现两条相同广告）
 */
export function pickOffers(
  slot: AffiliateSlotId,
  seed: string,
  candidates: readonly string[],
  exclude: readonly string[] = [],
): string[] {
  const { count } = AFFILIATE_SLOT_META[slot];

  const pool = candidates.filter((slug) => !exclude.includes(slug));
  // 池子被排空（比如只有 2 条广告、文章上方已经用掉）时退回原始池，
  // 宁可重复也不要空着
  const usable = pool.length > 0 ? [...pool] : [...candidates];

  if (usable.length === 0) return [];

  const random = mulberry32(fnv1a(`${slot}:${seed}`));

  // Fisher-Yates
  for (let i = usable.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [usable[i], usable[j]] = [usable[j], usable[i]];
  }

  return usable.slice(0, Math.min(count, usable.length));
}
