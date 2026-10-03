import { z } from "zod";

/**
 * 重置全站缓存的输出。
 * 与后台「设置 → 系统维护 → 重置全站缓存」等价：清空 CDN 缓存 + KV 缓存。
 */
export const McpSystemResetCacheOutputSchema = z.object({
  success: z.boolean().describe("Whether the site-wide cache reset succeeded."),
  purgedAt: z.iso
    .datetime()
    .describe("Timestamp (ISO-8601) when the cache reset was executed."),
});
