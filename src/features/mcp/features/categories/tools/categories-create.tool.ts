import type { OAuthScopeRequest } from "@/features/oauth-provider/schema/oauth-provider.schema";
import * as CategoryService from "@/features/categories/categories.service";
import { defineMcpTool } from "../../../service/mcp-tool";
import {
  McpCategoryCreateInputSchema,
  McpCategorySchema,
} from "../schema/mcp-categories.schema";
import { serializeMcpCategory } from "../service/mcp-categories.service";

const CATEGORIES_CREATE_REQUIRED_SCOPES: OAuthScopeRequest = {
  posts: ["write"],
};

export const categoriesCreateTool = defineMcpTool({
  name: "categories_create",
  description: "Create a new category.",
  requiredScopes: CATEGORIES_CREATE_REQUIRED_SCOPES,
  inputSchema: McpCategoryCreateInputSchema,
  outputSchema: McpCategorySchema,
  async handler(args, context) {
    const result = await CategoryService.createCategory(context, {
      name: args.name,
    });

    if (result.error) {
      return {
        content: [
          {
            type: "text",
            text:
              result.error.reason === "CATEGORY_NAME_ALREADY_EXISTS"
                ? `Category "${args.name}" already exists`
                : `Failed to create category "${args.name}"`,
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