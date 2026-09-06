import type { McpToolDefinition } from "../../service/mcp-tool";
import { categoriesCreateTool } from "./tools/categories-create.tool";
import { categoriesDeleteTool } from "./tools/categories-delete.tool";
import { categoriesListTool } from "./tools/categories-list.tool";
import { categoriesUpdateTool } from "./tools/categories-update.tool";
import { postsSetCategoriesTool } from "./tools/posts-set-categories.tool";

export const mcpCategoriesTools: McpToolDefinition[] = [
  categoriesListTool,
  categoriesCreateTool,
  categoriesUpdateTool,
  categoriesDeleteTool,
  postsSetCategoriesTool,
];