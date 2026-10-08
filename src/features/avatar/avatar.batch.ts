/**
 * 头像选择器的「批次」生成。
 *
 * 纯计算、零依赖，客户端可用。
 *
 * 为什么需要它：选择器要一次性展示一批头像。如果每次渲染都随机取 seed，
 * 服务端渲染与客户端 hydration 会产出不同的 URL，触发 hydration mismatch。
 * 所以初始批次由 `base` 决定性地推导；只有当用户主动点「换一批」时，
 * 才换一个新的 `base`（在事件回调里改，不参与 hydration）。
 */

import { hashAvatarSeed } from "./avatar.styles";

/** 选择器一屏展示的头像数量（6 列 × 3 行）。 */
export const AVATAR_PICKER_BATCH_SIZE = 18;

/** 去掉 0/O、1/l 等易混字符，避免生成的 seed 看起来像乱码。 */
const TOKEN_ALPHABET = "abcdefghijkmnpqrstuvwxyz23456789";
const TOKEN_LENGTH = 8;

/** mulberry32：小巧、分布够好的确定性 PRNG。 */
function mulberry32(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function createToken(random: () => number): string {
  let token = "";
  for (let i = 0; i < TOKEN_LENGTH; i++) {
    const index = Math.floor(random() * TOKEN_ALPHABET.length);
    token += TOKEN_ALPHABET[index] ?? "a";
  }
  return token;
}

/**
 * 由 `base` 决定性地生成一批 seed。
 *
 * 同一个 `base` 永远得到同一批头像 —— 这正是 SSR 安全的关键。
 * 想「换一批」时把 `base` 换成新值即可（例如带一个递增计数器）。
 */
export function buildAvatarSeedBatch(
  base: string,
  count: number = AVATAR_PICKER_BATCH_SIZE,
): string[] {
  const random = mulberry32(hashAvatarSeed(base));
  const size = Math.max(0, Math.floor(count));
  return Array.from({ length: size }, () => createToken(random));
}
