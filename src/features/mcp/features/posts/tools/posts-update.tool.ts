import type { OAuthScopeRequest } from "@/features/oauth-provider/schema/oauth-provider.schema";
import * as CategoryService from "@/features/categories/categories.service";
import * as PostService from "@/features/posts/services/posts.service";
import { toLocalDateString } from "@/lib/utils";
import { defineMcpTool } from "../../../service/mcp-tool";
import {
  McpPostDetailSchema,
  McpPostUpdateInputSchema,
} from "../schema/mcp-posts.schema";
import {
  serializeMcpPostDetail,
  toPostUpdateInput,
} from "../service/mcp-posts.service";

const POSTS_UPDATE_REQUIRED_SCOPES: OAuthScopeRequest = {
  posts: ["write"],
};

export const postsUpdateTool = defineMcpTool({
  name: "posts_update",
  description:
    "Update a blog post. Use markdown for the body. Typical flow is create a draft first, then update it. Updating a published post (or changing its status) also refreshes the public snapshot, search index and CDN cache.",
  requiredScopes: POSTS_UPDATE_REQUIRED_SCOPES,
  inputSchema: McpPostUpdateInputSchema,
  outputSchema: McpPostDetailSchema,
  async handler(args, context) {
    const { update, categoryIds } = await toPostUpdateInput(args);
    const result = await PostService.updatePost(context, update);

    if (result.error) {
      return {
        content: [
          {
            type: "text",
            text: `Post ${args.id} not found`,
          },
        ],
        isError: true,
      };
    }

    if (categoryIds !== undefined) {
      await CategoryService.setPostCategories(context, {
        postId: args.id,
        categoryIds,
      });
    }

    // 通过 MCP 直接改 status 时必须补跑发布流程：否则 publishedAt 不会被补全，
    // 公开快照 / 搜索索引 / CDN 缓存都不会刷新，文章会陷入
    // 「status 已是 published，但首页与列表页看不到」的状态。
    //   - 目标为已发布：刷新快照与缓存（编辑已发布文章同样需要）
    //   - 本次显式改了 status：published 走发布流程，draft 走下架流程
    const finalStatus = result.data.status;
    if (finalStatus === "published" || args.status !== undefined) {
      await PostService.startPostProcessWorkflow(context, {
        id: args.id,
        status: finalStatus,
        clientToday: toLocalDateString(new Date()),
      });
    }

    const post = await PostService.findPostById(context, {
      id: result.data.id,
    });
    if (!post) {
      return {
        content: [
          {
            type: "text",
            text: `Post ${args.id} was updated but could not be reloaded`,
          },
        ],
        isError: true,
      };
    }

    const serializedPost = serializeMcpPostDetail(post);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(serializedPost, null, 2),
        },
      ],
      structuredContent: serializedPost,
    };
  },
});
