import { z } from "zod";

export const UpdateCheckResultSchema = z.object({
  latestVersion: z.string(),
  currentVersion: z.string(),
  hasUpdate: z.boolean(),
  releaseUrl: z.string(),
  publishedAt: z.string().optional(),
  checkedAt: z.number(),
});

export const GitHubReleaseSchema = z.object({
  tag_name: z.string(),
  html_url: z.string(),
  published_at: z.string().optional(),
});

export type UpdateCheckResult = z.infer<typeof UpdateCheckResultSchema>;
export type GitHubRelease = z.infer<typeof GitHubReleaseSchema>;

export const VERSION_CACHE_KEYS = {
  updateCheck: ["version", "update-check"] as const,
  // 最近一次检查失败的标记，避免管理后台每次加载都重试。
  recentFailure: ["version", "recent-failure"] as const,
} as const;
