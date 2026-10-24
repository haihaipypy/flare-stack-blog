import { index, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { createdAt, id } from "./helper";

/**
 * 推广短链点击流水。
 *
 * 只用于回答「哪个位有人点」这一个问题，不存 IP、不存 UA，
 * country 取自 Cloudflare 的边缘信息，属于粗粒度地区统计。
 * 数据量很小（每篇文章的推广位个位数点击/天），不需要归档任务。
 */
export const AffiliateClicksTable = sqliteTable(
  "affiliate_clicks",
  {
    id,
    /** /go/:slug 里的 slug，对应 affiliate.config.ts */
    slug: text("slug").notNull(),
    /** 来源文章 slug，从 Referer 解析，解析不出则为 null */
    postSlug: text("post_slug"),
    /** 两位国家码 */
    country: text("country"),
    createdAt,
  },
  (table) => [
    index("idx_ac_slug_created").on(table.slug, table.createdAt),
    index("idx_ac_created").on(table.createdAt),
  ],
);
