/**
 * 服务端头像渲染。
 *
 * ⚠️ 这个模块**只能被服务端代码引用**（目前仅 `/avatar/:seed` 路由）。
 * 它会把 DiceBear 核心与风格定义打进 Worker 包体 —— 实测 gzip 后约
 * 96KB（core 56KB + 风格池 40KB），对 Cloudflare Workers 完全可接受，
 * 但没有理由让客户端也背上这份体积。
 *
 * 风格定义用 `?raw` 读入再 `JSON.parse`，而不是直接 `import ... .json`：
 * 后者在 `moduleResolution: bundler` 且未开 `resolveJsonModule` 时会报错，
 * 且会让 tsc 去推断近 200KB 的 JSON 字面量类型（拖慢类型检查、吃内存）。
 */

import { Avatar, Style } from "@dicebear/core";
import {
  AVATAR_STYLE_POOL,
  DEFAULT_AVATAR_STYLE,
  isAvatarStyleId,
  resolveAvatarStyleId,
} from "./avatar.styles";
import { normalizeAvatarSeed } from "./avatar.url";

export const AVATAR_MIN_SIZE = 16;
export const AVATAR_MAX_SIZE = 512;
export const AVATAR_DEFAULT_SIZE = 128;

type RawJsonLoader = () => Promise<{ default: string }>;

const STYLE_LOADERS: Record<string, RawJsonLoader> = {
  shapes: () => import("@dicebear/styles/shapes.json?raw"),
  rings: () => import("@dicebear/styles/rings.json?raw"),
  triangles: () => import("@dicebear/styles/triangles.json?raw"),
  stripes: () => import("@dicebear/styles/stripes.json?raw"),
  glass: () => import("@dicebear/styles/glass.json?raw"),
  blobs: () => import("@dicebear/styles/blobs.json?raw"),
  waves: () => import("@dicebear/styles/waves.json?raw"),
  thumbs: () => import("@dicebear/styles/thumbs.json?raw"),
  "pixel-art": () => import("@dicebear/styles/pixel-art.json?raw"),
  "lorelei-neutral": () => import("@dicebear/styles/lorelei-neutral.json?raw"),
  "notionists-neutral": () =>
    import("@dicebear/styles/notionists-neutral.json?raw"),
  identicon: () => import("@dicebear/styles/identicon.json?raw"),
};

/**
 * Style 实例缓存。
 *
 * `new Style()` 每次都会跑一遍 JSON Schema 校验并深拷贝定义，是最贵的一步。
 * 每个 isolate 内按风格缓存一次即可，后续渲染直接复用。
 */
const styleCache = new Map<string, Style>();

function resolveLoaderKey(styleId: string | null | undefined): string {
  return styleId && isAvatarStyleId(styleId) ? styleId : DEFAULT_AVATAR_STYLE;
}

export async function getAvatarStyle(styleId: string): Promise<Style> {
  const key = resolveLoaderKey(styleId);
  const cached = styleCache.get(key);
  if (cached) return cached;

  const loader = STYLE_LOADERS[key];
  if (!loader) {
    throw new Error(`No DiceBear style loader registered for "${key}"`);
  }
  const { default: raw } = await loader();
  const style = new Style(JSON.parse(raw));
  styleCache.set(key, style);
  return style;
}

export interface RenderAvatarInput {
  seed: string | null | undefined;
  /** 指定风格；省略或非法时由 seed 决定性挑选 */
  style?: string | null;
  size?: number | null;
}

export interface RenderedAvatar {
  svg: string;
  styleId: string;
  seed: string;
  size: number;
}

export function clampAvatarSize(size: number | null | undefined): number {
  if (size == null || !Number.isFinite(size)) return AVATAR_DEFAULT_SIZE;
  return Math.min(AVATAR_MAX_SIZE, Math.max(AVATAR_MIN_SIZE, Math.round(size)));
}

/**
 * 渲染一张头像。
 *
 * 整个过程是确定性的：同样的 (seed, styleId, size) 永远产出同样的 SVG，
 * 这正是可以给响应加 `immutable` 缓存头的前提。
 */
export async function renderAvatarSvg(
  input: RenderAvatarInput,
): Promise<RenderedAvatar> {
  const seed = normalizeAvatarSeed(input.seed);
  const styleId = resolveLoaderKey(input.style ?? resolveAvatarStyleId(seed));
  const size = clampAvatarSize(input.size);

  const style = await getAvatarStyle(styleId);
  const svg = new Avatar(style, { seed, size }).toString();

  return { svg, styleId, seed, size };
}

/** 导出风格池，供路由做参数校验与文档展示。 */
export { AVATAR_STYLE_POOL };
