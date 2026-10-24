import { Hono } from "hono";
import { getAffiliateOffer } from "@/features/affiliate/affiliate.config";
import { getDb } from "@/lib/db";
import { AffiliateClicksTable } from "@/lib/db/schema";

const app = new Hono<{ Bindings: Env }>();

const POST_PATH_PATTERN = /^\/post\/([^/]+)\/?$/;

/** ?src= 只接受 hostname 形态的字符，其余一律丢弃，避免脏数据进库 */
function normalizeSource(raw: string | undefined): string | null {
  if (!raw) return null;
  const cleaned = raw.toLowerCase().trim();
  if (!/^[a-z0-9.-]{1,120}$/.test(cleaned)) return null;
  return cleaned;
}

/** 从 Referer 里抽出「读者是在哪篇文章点的」，抽不出就记 null */
function extractPostSlug(referer: string): string | null {
  if (!referer) return null;

  try {
    const { pathname } = new URL(referer);
    const match = POST_PATH_PATTERN.exec(pathname);
    return match ? decodeURIComponent(match[1]) : null;
  } catch {
    return null;
  }
}

/**
 * 记一次点击。
 *
 * 这条插入是「顺手统计」，不该影响跳转体验：
 * 表还没迁移、D1 抖动、SQLITE_BUSY 之类都只打日志，绝不让读者看到错误页。
 */
async function recordClick(
  env: Env,
  row: {
    slug: string;
    postSlug: string | null;
    source: string | null;
    country: string | null;
  },
): Promise<void> {
  try {
    await getDb(env).insert(AffiliateClicksTable).values(row).run();
  } catch (error) {
    console.warn(
      JSON.stringify({
        message: "affiliate click record failed",
        slug: row.slug,
        error: error instanceof Error ? error.message : String(error),
      }),
    );
  }
}

/**
 * 推广短链跳转：GET /go/:slug → 302 到厂商活动页
 *
 * 用 302 而不是 301：推广链接会换，永久重定向会被浏览器和中间层长期缓存，
 * 换链接后老读者还会被送到旧地址。302 + no-store 每次都经过 Worker，
 * 顺便完成点击统计。
 */
app.get("/:slug", (c) => {
  const slug = c.req.param("slug");
  const offer = getAffiliateOffer(slug);

  if (!offer) {
    return c.redirect("/", 302);
  }

  const cf = (c.req.raw as Request & { cf?: { country?: string } }).cf;
  const record = recordClick(c.env, {
    slug: offer.slug,
    postSlug: extractPostSlug(c.req.header("referer") ?? ""),
    source: normalizeSource(c.req.query("src")),
    country: cf?.country ?? null,
  });

  try {
    c.executionCtx.waitUntil(record);
  } catch {
    // 没有 executionCtx 的环境（少数自托管运行时）直接放行，不阻塞跳转
    void record;
  }

  return new Response(null, {
    status: 302,
    headers: {
      Location: offer.url,
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
});

export default app;
