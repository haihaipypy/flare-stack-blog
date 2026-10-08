/**
 * DiceBear 头像风格池。
 *
 * 只收录 **CC0 1.0** 授权的风格 —— 可自由商用、无需署名，
 * 因此站点无需维护任何第三方署名信息。
 *
 * 池子刻意选的都是体积小的风格：这些 JSON 定义会在服务端被
 * `avatar.render.ts` 静态打包进 Worker，体积直接等于冷启动成本。
 * （对比：`adventurer` 278KB、`notionists` 364KB，而池内最大的
 * `notionists-neutral` 也只有 51KB。）
 */

export type AvatarStyleCategory = "geometric" | "character" | "symbol";

export interface AvatarStyleMeta {
  /** DiceBear 风格 id，对应 `@dicebear/styles/<id>.json` */
  id: string;
  /** 中文标签 */
  label: string;
  category: AvatarStyleCategory;
  /** 原作者 */
  author: string;
}

/**
 * 可用的随机风格池。顺序即分配顺序的一部分，
 * **新增/删除条目会改变既有 seed 的落点**，请只在有意为之的时候调整。
 */
export const AVATAR_STYLE_POOL: readonly AvatarStyleMeta[] = [
  { id: "shapes", label: "几何", category: "geometric", author: "DiceBear" },
  { id: "rings", label: "同心环", category: "geometric", author: "DiceBear" },
  { id: "triangles", label: "三角", category: "geometric", author: "DiceBear" },
  { id: "stripes", label: "条纹", category: "geometric", author: "DiceBear" },
  { id: "glass", label: "玻璃", category: "geometric", author: "DiceBear" },
  { id: "blobs", label: "流体", category: "geometric", author: "DiceBear" },
  { id: "waves", label: "波纹", category: "geometric", author: "DiceBear" },
  { id: "thumbs", label: "萌脸", category: "character", author: "DiceBear" },
  {
    id: "pixel-art",
    label: "像素",
    category: "character",
    author: "DiceBear",
  },
  {
    id: "lorelei-neutral",
    label: "手绘人物",
    category: "character",
    author: "Lisa Wischofsky",
  },
  {
    id: "notionists-neutral",
    label: "线稿人物",
    category: "character",
    author: "Zoish",
  },
  {
    id: "identicon",
    label: "辨识方块",
    category: "symbol",
    author: "DiceBear",
  },
] as const;

const STYLE_IDS = new Set(AVATAR_STYLE_POOL.map((s) => s.id));

/** 当 seed 或其哈希异常时兜底使用的风格。 */
export const DEFAULT_AVATAR_STYLE = "shapes";

export function isAvatarStyleId(value: string): boolean {
  return STYLE_IDS.has(value);
}

/**
 * FNV-1a 32 位哈希。
 *
 * 与 DiceBear 内部使用同一族算法，纯整数运算、无正则、无分配，
 * 在 Cloudflare Workers 上开销可忽略。
 */
export function hashAvatarSeed(seed: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/**
 * 由 seed 决定性地挑选风格。
 *
 * 「随机」是相对不同 seed 而言的：同一个人（同一个 seed）永远落到
 * 同一个风格，不同的人自动散布到池内各个风格。
 * 这样既有多样性，又不会出现「刷新一次换个头像」的问题。
 */
export function resolveAvatarStyleId(seed: string): string {
  if (AVATAR_STYLE_POOL.length === 0) return DEFAULT_AVATAR_STYLE;
  const index = hashAvatarSeed(seed) % AVATAR_STYLE_POOL.length;
  return AVATAR_STYLE_POOL[index]?.id ?? DEFAULT_AVATAR_STYLE;
}
