export type CacheKey =
  | string
  | ReadonlyArray<string | number | boolean | null | undefined>;

export const CACHE_NAMESPACES = {
  POSTS_LIST: "posts:list",
  POSTS_DETAIL: "posts:detail",
  FRIEND_LINKS_LIST: "friend-links:list",
  /**
   * 站点级共享版本：标签云 / 分类列表这类「非版本化」的聚合数据挂在它下面。
   * 有了版本前缀，失效时只需 bump 一次即可在所有数据中心生效，
   * 不依赖 Cache API 的局部 delete。
   */
  SITE: "site",
  /** 站点系统配置（含广告位配置）的版本命名空间 */
  SITE_CONFIG: "site:config",
} as const;

export type CacheNamespace =
  (typeof CACHE_NAMESPACES)[keyof typeof CACHE_NAMESPACES];
