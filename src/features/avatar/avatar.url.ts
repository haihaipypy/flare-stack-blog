/**
 * 生成头像 URL 的纯函数工具。
 *
 * 这个模块**必须保持零依赖**（不引入 `@dicebear/*`），因为它会被客户端
 * 组件（评论区、友链卡片、导航栏）引用；真正的渲染只发生在服务端的
 * `/avatar/:seed` 路由里。
 */

/** `/avatar/<seed>` 路由前缀。 */
export const AVATAR_ROUTE_BASE = "/avatar";

/** seed 最大长度，防止异常长的输入进入哈希与 CSS 选择器。 */
export const MAX_AVATAR_SEED_LENGTH = 64;

/** 完全无法确定身份时使用的 seed。 */
export const ANONYMOUS_AVATAR_SEED = "anonymous";

/**
 * 归一化 seed：去掉首尾空白与控制字符、限制长度。
 *
 * 不做转义 —— 转义交给 `encodeURIComponent` 与 DiceBear 自身处理。
 */
export function normalizeAvatarSeed(raw: string | null | undefined): string {
  if (!raw) return ANONYMOUS_AVATAR_SEED;
  // biome-ignore lint/suspicious/noControlCharactersInRegex: 必须剔除控制字符
  const cleaned = raw.replace(/[\u0000-\u001f\u007f]/g, "").trim();
  if (!cleaned) return ANONYMOUS_AVATAR_SEED;
  return cleaned.slice(0, MAX_AVATAR_SEED_LENGTH);
}

export interface BuildAvatarUrlOptions {
  /** 输出尺寸（像素）。仅作为占位尺寸，展示端仍由 CSS 控制。 */
  size?: number;
  /** 强制指定风格；省略时由 seed 决定。 */
  style?: string;
}

/**
 * 构造 `/avatar/<seed>` 地址。
 *
 * 返回值以 `/` 开头，可直接通过资料表单现有的校验规则
 * （`use-profile-form.ts` 允许 `/` 开头的本地路径）。
 */
export function buildAvatarUrl(
  seed: string | null | undefined,
  options: BuildAvatarUrlOptions = {},
): string {
  const normalized = normalizeAvatarSeed(seed);
  const params = new URLSearchParams();
  if (options.size && Number.isFinite(options.size)) {
    params.set("size", String(Math.round(options.size)));
  }
  if (options.style) {
    params.set("style", options.style);
  }
  const query = params.toString();
  const path = `${AVATAR_ROUTE_BASE}/${encodeURIComponent(normalized)}`;
  return query ? `${path}?${query}` : path;
}

/** 判断一个头像地址是否指向本机的生成路由（而非用户上传的图片）。 */
export function isGeneratedAvatarUrl(src: string | null | undefined): boolean {
  return Boolean(src?.startsWith(`${AVATAR_ROUTE_BASE}/`));
}

/**
 * 为评论者挑选 seed。
 *
 * 优先用显示名 —— 这样同名访客在任何页面都会拿到同一张头像，
 * 比内部 id 更符合直觉；没有名字时才退回 id。
 */
export function avatarSeedForUser(
  user: { id?: string | null; name?: string | null } | null | undefined,
): string {
  if (!user) return ANONYMOUS_AVATAR_SEED;
  return normalizeAvatarSeed(user.name) === ANONYMOUS_AVATAR_SEED
    ? normalizeAvatarSeed(user.id)
    : normalizeAvatarSeed(user.name);
}

/**
 * 为友链挑选 seed。
 *
 * 优先用站点域名的 host —— 它天然唯一且不会因改名而变化；
 * 没有合法 URL 时退回站点名，再退回用户信息。
 */
export function avatarSeedForFriendLink(link: {
  siteUrl?: string | null;
  siteName?: string | null;
  user?: { id?: string | null; name?: string | null } | null;
}): string {
  const host = extractHostname(link.siteUrl);
  if (host) return normalizeAvatarSeed(host);

  if (link.siteName) {
    const name = normalizeAvatarSeed(link.siteName);
    if (name !== ANONYMOUS_AVATAR_SEED) return name;
  }

  return avatarSeedForUser(link.user);
}

function extractHostname(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const { hostname } = new URL(url);
    return hostname ? hostname.replace(/^www\./, "") : null;
  } catch {
    return null;
  }
}
