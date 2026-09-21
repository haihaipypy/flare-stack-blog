import { handleQueueBatch } from "@/lib/queue/queue.handler";
import { resolveOldSlugRedirectPath } from "@/lib/redirects/old-slugs";

export { CommentModerationWorkflow } from "@/features/comments/workflows/comment-moderation";
export { ExportWorkflow } from "@/features/import-export/workflows/export.workflow";
export { ImportWorkflow } from "@/features/import-export/workflows/import.workflow";
export { PostAutoSnapshotWorkflow } from "@/features/posts/workflows/post-auto-snapshot";
export { PostProcessWorkflow } from "@/features/posts/workflows/post-process";
export { ScheduledPublishWorkflow } from "@/features/posts/workflows/scheduled-publish";
export { PasswordHasher } from "@/lib/do/password-hasher";
export { RateLimiter } from "@/lib/do/rate-limiter";

declare module "@tanstack/react-start" {
  interface Register {
    server: {
      requestContext: {
        env: Env;
        executionCtx: ExecutionContext<unknown>;
      };
    };
  }
}

/**
 * 旧中文 slug 的 301 重定向（消重复内容）。
 *
 * 只对 GET / HEAD 生效，其他 HTTP 方法原样放行；精确命中映射表才跳转，否则返回 null。
 * 放在 TanStack Start 处理器之前执行，且不触碰 /api/auth/*、/images/* 等既有分支
 * （仅匹配 /post/<旧中文 slug> 的精确路径）。
 */
function resolveLegacySlugRedirect(request: Request): Response | null {
  if (request.method !== "GET" && request.method !== "HEAD") {
    return null;
  }

  const url = new URL(request.url);
  const target = resolveOldSlugRedirectPath(url.pathname);
  if (!target) {
    return null;
  }

  // 301 永久重定向，保留原 query string
  return new Response(null, {
    headers: { Location: `${target}${url.search}` },
    status: 301,
  });
}

export default {
  async fetch(request, env, ctx) {
    // 旧中文 slug → 新英文 slug 的 301，位置在 TanStack Start 处理器之前
    const legacyRedirect = resolveLegacySlugRedirect(request);
    if (legacyRedirect) {
      return legacyRedirect;
    }

    const { handleRootRequest } = await import("@/lib/worker/root-handler");
    return handleRootRequest(request, env, ctx);
  },
  async queue(batch, env, ctx) {
    await handleQueueBatch(batch, env, ctx);
  },
} satisfies ExportedHandler<Env>;
