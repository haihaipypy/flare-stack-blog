import type { OAuthScopeRequest } from "@/features/oauth-provider/schema/oauth-provider.schema";
import * as CategoryService from "@/features/categories/categories.service";
import { defineMcpTool } from "../../../service/mcp-tool";
import {
  McpCategorySchema,
  McpCategoryUpdateInputSchema,
} from "../schema/mcp-categories.schema";
import { serializeMcpCategory } from "../service/mcp-categories.service";

const CATEGORIES_UPDATE_REQUIRED_SCOPES: OAuthScopeRequest = {
  posts: ["write"],
};

export const categoriesUpdateTool = defineMcpTool({
  name: "categories_update",
  description: "Rename an existing category.",
  requiredScopes: CATEGORIES_UPDATE_REQUIRED_SCOPES,
  inputSchema: McpCategoryUpdateInputSchema,
  outputSchema: McpCategorySchema,
  async handler(args, context) {
    const result = await CategoryService.updateCategory(context, {
      id: args.id,
      data: { name: args.name },
    });

    if (result.error) {
      return {
        content: [
          {
            type: "text",
            text:
              result.error.reason === "CATEGORY_NOT_FOUND"
                ? `Category ${args.id} not found`
                : result.error.reason === "CATEGORY_NAME_ALREADY_EXISTS"
                  ? `Category "${args.name}" already exists`
                  : `Failed to update category ${args.id}`,
          },
        ],
        isError: true,
      };
    }

    const category = serializeMcpCategory(result.data);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(category, null, 2),
        },
      ],
      structuredContent: category,
    };
  },
});