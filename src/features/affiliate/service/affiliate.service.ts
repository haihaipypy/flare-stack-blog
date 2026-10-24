import { and, desc, gte, isNotNull, sql } from "drizzle-orm";
import * as CacheService from "@/features/cache/cache.service";
import { CONFIG_CACHE_KEYS } from "@/features/config/config.schema";
import * as ConfigRepo from "@/features/config/data/config.data";
import {
  getSystemConfig,
  resolveSystemConfig,
} from "@/features/config/service/config.service";
import { AffiliateClicksTable } from "@/lib/db/schema";
import { purgeSiteCDNCache } from "@/lib/invalidate";
import { activeOffers, resolveAffiliateConfig } from "../affiliate.defaults";
import type {
  AffiliateConfig,
  AffiliateConfigInput,
  AffiliateOffer,
} from "../affiliate.schema";

type Ctx = DbContext & { executionCtx: ExecutionContext };

/**
 * 读广告配置。
 *
 * 底层复用系统配置的缓存（ttl 1h），所以前台每次渲染不会真打 D1；
 * 后台保存时会把这条缓存删掉，最迟下一次请求就是新配置。
 */
export async function getAffiliateConfig(
  context: Ctx,
): Promise<AffiliateConfig> {
  const system = await getSystemConfig(context);
  return resolveAffiliateConfig(system.affiliate);
}

/** 只取启用中、且链接合法的，供前台渲染与 /go 跳转使用 */
export async function getActiveOffers(context: Ctx): Promise<AffiliateOffer[]> {
  return activeOffers(await getAffiliateConfig(context));
}

/**
 * 保存广告配置。
 *
 * 单独写这个方法而不是走 updateSystemConfig，是因为后台的广告页只提交
 * affiliate 这一段，其他设置（邮件、主题等）原样保留。
 */
export async function updateAffiliateConfig(
  context: Ctx,
  input: AffiliateConfigInput,
): Promise<AffiliateConfig> {
  const next = resolveAffiliateConfig(input);
  const current = await ConfigRepo.getSystemConfig(context.db);

  await ConfigRepo.upsertSystemConfig(
    context.db,
    resolveSystemConfig({ ...current, affiliate: next }),
  );
  await CacheService.deleteKey(context, CONFIG_CACHE_KEYS.system);

  // 页面 HTML 里已经烧进了广告卡片，不清 CDN 就会继续显示旧配置
  await purgeSiteCDNCache(context.env);

  return next;
}

export interface AffiliateStats {
  /** 统计覆盖的天数 */
  days: number;
  totals: {
    clicks: number;
    sources: number;
    offers: number;
    posts: number;
  };
  bySource: Array<{ source: string; clicks: number; lastAt: number | null }>;
  byOffer: Array<{ slug: string; clicks: number }>;
  byPost: Array<{ postSlug: string; clicks: number }>;
  daily: Array<{ day: string; clicks: number }>;
}

const EMPTY_STATS = (days: number): AffiliateStats => ({
  days,
  totals: { clicks: 0, sources: 0, offers: 0, posts: 0 },
  bySource: [],
  byOffer: [],
  byPost: [],
  daily: [],
});

/**
 * 点击统计。
 *
 * 表还没迁移、或 D1 抖动时返回空数据而不是报错 —— 后台其他功能不该被它拖下水。
 */
export async function getAffiliateStats(
  context: DbContext,
  days = 30,
): Promise<AffiliateStats> {
  const since = new Date(Date.now() - (days - 1) * 86_400_000);
  since.setHours(0, 0, 0, 0);

  const clicks = sql<number>`count(*)`;
  const inRange = gte(AffiliateClicksTable.createdAt, since);

  try {
    const [bySource, byOffer, byPost, daily, total] = await Promise.all([
      context.db
        .select({
          source: AffiliateClicksTable.source,
          clicks,
          lastAt: sql<number | null>`max(${AffiliateClicksTable.createdAt})`,
        })
        .from(AffiliateClicksTable)
        .where(and(inRange, isNotNull(AffiliateClicksTable.source)))
        .groupBy(AffiliateClicksTable.source)
        .orderBy(desc(clicks))
        .limit(50),

      context.db
        .select({ slug: AffiliateClicksTable.slug, clicks })
        .from(AffiliateClicksTable)
        .where(inRange)
        .groupBy(AffiliateClicksTable.slug)
        .orderBy(desc(clicks))
        .limit(50),

      context.db
        .select({ postSlug: AffiliateClicksTable.postSlug, clicks })
        .from(AffiliateClicksTable)
        .where(and(inRange, isNotNull(AffiliateClicksTable.postSlug)))
        .groupBy(AffiliateClicksTable.postSlug)
        .orderBy(desc(clicks))
        .limit(20),

      context.db
        .select({
          day: sql<string>`strftime('%Y-%m-%d', ${AffiliateClicksTable.createdAt}, 'unixepoch')`,
          clicks,
        })
        .from(AffiliateClicksTable)
        .where(inRange)
        .groupBy(sql`1`)
        .orderBy(sql`1`),

      context.db.select({ clicks }).from(AffiliateClicksTable).where(inRange),
    ]);

    return {
      days,
      totals: {
        clicks: total[0]?.clicks ?? 0,
        sources: bySource.length,
        offers: byOffer.length,
        posts: byPost.length,
      },
      bySource: bySource.map((row) => ({
        source: row.source ?? "",
        clicks: row.clicks,
        lastAt: row.lastAt,
      })),
      byOffer,
      byPost: byPost.map((row) => ({
        postSlug: row.postSlug ?? "",
        clicks: row.clicks,
      })),
      daily,
    };
  } catch (error) {
    console.warn(
      JSON.stringify({
        message: "affiliate stats query failed",
        error: error instanceof Error ? error.message : String(error),
      }),
    );
    return EMPTY_STATS(days);
  }
}
