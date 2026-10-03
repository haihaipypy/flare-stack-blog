import * as CacheService from "@/features/cache/cache.service";
import type { OAuthScopeRequest } from "@/features/oauth-provider/schema/oauth-provider.schema";
import { defineMcpTool } from "../../../service/mcp-tool";
import { McpSystemResetCacheOutputSchema } from "../schema/mcp-system.schema";

// 与 tags / categories 工具保持一致：复用 posts 写权限，不新增 OAuth scope 组，
// 这样已授权的 MCP 客户端无需重新授权即可调用。
const SYSTEM_RESET_CACHE_REQUIRED_SCOPES: OAuthScopeRequest = {
  posts: ["write"],
};

export const systemResetCacheTool = defineMcpTool({
  name: "system_reset_cache",
  description:
    "Reset the cache for the whole site. Purges the Cloudflare CDN cache and invalidates the KV cache (post list, post detail, tags, categories). Equivalent to the admin panel's Settings -> Maintenance -> Reset site cache. Use it when published changes do not show up on the site because pages are cached. Caches are rebuilt automatically on the next request.",
  requiredScopes: SYSTEM_RESET_CACHE_REQUIRED_SCOPES,
  outputSchema: McpSystemResetCacheOutputSchema,
  async handler(context) {
    try {
      await CacheService.invalidateSiteCache(context);
    } catch (error) {
      // 清缓存失败需要显式暴露：CDN purge 用的 token 失效时若被吞掉，
      // 会表现为「一切正常但页面依旧是旧内容」，很难排查。
      return {
        content: [
          {
            type: "text",
            text: `Failed to reset site cache: ${
              error instanceof Error ? error.message : String(error)
            }`,
          },
        ],
        isError: true,
      };
    }

    const output = {
      success: true,
      purgedAt: new Date().toISOString(),
    };

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(output, null, 2),
        },
      ],
      structuredContent: output,
    };
  },
});
