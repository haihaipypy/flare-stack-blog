import { queryOptions } from "@tanstack/react-query";
import {
  getAffiliateAdminConfigFn,
  getAffiliatePublicConfigFn,
  getAffiliateStatsFn,
} from "../api/affiliate.api";

export const AFFILIATE_KEYS = {
  all: ["affiliate"] as const,
  publicConfig: ["affiliate", "public"] as const,
  adminConfig: ["affiliate", "admin"] as const,
  stats: (days: number) => ["affiliate", "stats", days] as const,
};

/**
 * 前台广告位配置。
 *
 * 页面 loader 里 ensureQueryData 预取后，服务端渲染就能直接拿到；
 * staleTime 给 1 分钟，避免同一请求里反复打库，又不至于改完配置半天不生效。
 */
export const affiliatePublicConfigQuery = queryOptions({
  queryKey: AFFILIATE_KEYS.publicConfig,
  queryFn: () => getAffiliatePublicConfigFn(),
  staleTime: 60_000,
});

export const affiliateAdminConfigQuery = queryOptions({
  queryKey: AFFILIATE_KEYS.adminConfig,
  queryFn: () => getAffiliateAdminConfigFn(),
  staleTime: 0,
});

export const affiliateStatsQuery = (days: number) =>
  queryOptions({
    queryKey: AFFILIATE_KEYS.stats(days),
    queryFn: () => getAffiliateStatsFn({ data: { days } }),
    staleTime: 30_000,
  });
