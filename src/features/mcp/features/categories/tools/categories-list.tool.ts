import type { OAuthScopeRequest } from "@/features/oauth-provider/schema/oauth-provider.schema";
import * as CategoryService from "@/features/categories/categories.service";
import { defineMcpTool } from "../../../service/mcp-tool";
import {
  McpCategoriesListInputSchema,
  McpCategoriesListOutputSchema,
} from "../schema/mcp-categories.schema";
import {
  serializeMcpCategory,
  serializeMcpCategoryWithCount,
} from "../service/mcp-categories.service";

const CATEGORIES_LIST_REQUIRED_SCOPES: OAuthScopeRequest = {
  posts: ["read"],
};

export const categoriesListTool = defineMcpTool({
  name: "categories_list",
  description: "List categories used by the blog.",
  requiredScopes: CATEGORIES_LIST_REQUIRED_SCOPES,
  inputSchema: McpCategoriesListInputSchema,
  outputSchema: McpCategoriesListOutputSchema,
  async handler(args, context) {
    const categories = await CategoryService.getCategories(context, args);
    const items = categories.map((category) =>
      "postCount" in category
        ? serializeMcpCategoryWithCount(category)
        : serializeMcpCategory(category),
    );

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({ items }, null, 2),
        },
      ],
      structuredContent: { items },
    };
  },
});