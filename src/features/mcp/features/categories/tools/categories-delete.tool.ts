import type { OAuthScopeRequest } from "@/features/oauth-provider/schema/oauth-provider.schema";
import * as CategoryService from "@/features/categories/categories.service";
import { defineMcpTool } from "../../../service/mcp-tool";
import {
  McpCategoryDeleteInputSchema,
  McpCategoryDeleteOutputSchema,
} from "../schema/mcp-categories.schema";

const CATEGORIES_DELETE_REQUIRED_SCOPES: OAuthScopeRequest = {
  posts: ["write"],
};

export const categoriesDeleteTool = defineMcpTool({
  name: "categories_delete",
  description: "Delete a category.",
  requiredScopes: CATEGORIES_DELETE_REQUIRED_SCOPES,
  inputSchema: McpCategoryDeleteInputSchema,
  outputSchema: McpCategoryDeleteOutputSchema,
  async handler(args, context) {
    const result = await CategoryService.deleteCategory(context, {
      id: args.id,
    });

    if (result.error) {
      return {
        content: [
          {
            type: "text",
            text:
              result.error.reason === "CATEGORY_NOT_FOUND"
                ? `Category ${args.id} not found`
                : `Failed to delete category ${args.id}`,
          },
        ],
        isError: true,
      };
    }

    const output = {
      deleted: true as const,
      id: args.id,
    };

    return {
      content: [
        {
          type: "text",
          text: `Deleted category ${args.id}`,
        },
      ],
      structuredContent: output,
    };
  },
});