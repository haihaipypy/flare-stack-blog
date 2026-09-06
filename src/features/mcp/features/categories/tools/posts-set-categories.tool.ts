import type { OAuthScopeRequest } from "@/features/oauth-provider/schema/oauth-provider.schema";
import * as CategoryService from "@/features/categories/categories.service";
import * as PostService from "@/features/posts/services/posts.service";
import { defineMcpTool } from "../../../service/mcp-tool";
import {
  McpPostSetCategoriesInputSchema,
  McpPostSetCategoriesOutputSchema,
} from "../schema/mcp-categories.schema";
import { serializeMcpCategory } from "../service/mcp-categories.service";

const POSTS_SET_CATEGORIES_REQUIRED_SCOPES: OAuthScopeRequest = {
  posts: ["write"],
};

export const postsSetCategoriesTool = defineMcpTool({
  name: "posts_set_categories",
  description:
    "Replace all categories on a post. Pass an empty array to clear all categories. Unknown category IDs must be created separately via categories_create first.",
  requiredScopes: POSTS_SET_CATEGORIES_REQUIRED_SCOPES,
  inputSchema: McpPostSetCategoriesInputSchema,
  outputSchema: McpPostSetCategoriesOutputSchema,
  async handler(args, context) {
    const post = await PostService.findPostById(context, { id: args.postId });
    if (!post) {
      return {
        content: [
          {
            type: "text",
            text: `Post ${args.postId} not found`,
          },
        ],
        isError: true,
      };
    }

    await CategoryService.setPostCategories(context, {
      postId: args.postId,
      categoryIds: args.categoryIds,
    });

    const categories = await CategoryService.getCategoriesByPostId(context, {
      postId: args.postId,
    });
    const output = {
      postId: args.postId,
      categories: categories.map(serializeMcpCategory),
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