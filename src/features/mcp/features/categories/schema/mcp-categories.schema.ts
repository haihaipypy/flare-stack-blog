import { z } from "zod";

export const McpCategorySchema = z.object({
  createdAt: z.iso.datetime().describe("Category creation time."),
  id: z.number().describe("Numeric category ID."),
  name: z.string().describe("Category name."),
});

export const McpCategoryWithCountSchema = McpCategorySchema.extend({
  postCount: z.number().describe("How many posts use this category."),
});

export const McpCategoriesListInputSchema = z.object({
  sortBy: z
    .enum(["name", "createdAt", "postCount"])
    .optional()
    .describe("Field used for sorting."),
  sortDir: z.enum(["asc", "desc"]).optional().describe("Sort direction."),
  withCount: z
    .boolean()
    .optional()
    .describe("Include post usage counts for each category."),
  publicOnly: z
    .boolean()
    .optional()
    .describe("Only include categories attached to published posts."),
});

export const McpCategoriesListOutputSchema = z.object({
  items: z
    .array(z.union([McpCategorySchema, McpCategoryWithCountSchema]))
    .describe("Matching categories."),
});

export const McpCategoryCreateInputSchema = z.object({
  name: z.string().min(1).max(50).describe("New category name."),
});

export const McpCategoryUpdateInputSchema = z.object({
  id: z.number().describe("Numeric category ID."),
  name: z.string().min(1).max(50).describe("New category name."),
});

export const McpCategoryDeleteInputSchema = z.object({
  id: z.number().describe("Numeric category ID."),
});

export const McpCategoryDeleteOutputSchema = z.object({
  deleted: z.literal(true).describe("Whether the category was deleted."),
  id: z.number().describe("Numeric category ID."),
});

export const McpPostSetCategoriesInputSchema = z.object({
  postId: z.number().describe("Numeric post ID."),
  categoryIds: z
    .array(z.number())
    .describe(
      "Complete list of category IDs to assign. Pass an empty array to clear all categories.",
    ),
});

export const McpPostSetCategoriesOutputSchema = z.object({
  postId: z.number().describe("Numeric post ID."),
  categories: z
    .array(McpCategorySchema)
    .describe("Current categories after replacement."),
});