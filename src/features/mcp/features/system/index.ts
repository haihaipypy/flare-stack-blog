import type { McpToolDefinition } from "../../service/mcp-tool";
import { systemResetCacheTool } from "./tools/system-reset-cache.tool";

export const mcpSystemTools: McpToolDefinition[] = [systemResetCacheTool];
