import type { AffiliateSlug } from "./affiliate.config";

/**
 * 对外统一用站内短链跳转，好处有三：
 * 1. 换推广链接不用改历史文章；
 * 2. 能统计每个位被点了多少次；
 * 3. 外链统一带 nofollow / sponsored，不把权重送出去。
 */
export function affiliateHref(slug: AffiliateSlug): string {
  return `/go/${slug}`;
}
