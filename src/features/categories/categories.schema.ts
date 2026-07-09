import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from "drizzle-zod";
import { z } from "zod";
import { CategoriesTable } from "@/lib/db/schema";

const coercedDate = z.union([z.date(), z.string().pipe(z.coerce.date())]);

export const CategorySelectSchema = createSelectSchema(CategoriesTable, {
  createdAt: coercedDate,
});
export const CategoryInsertSchema = createInsertSchema(CategoriesTable);
export const CategoryUpdateSchema = createUpdateSchema(CategoriesTable);

export const CategoryWithCountSchema = CategorySelectSchema.extend({
  postCount: z.number(),
});

export const CreateCategoryInputSchema = z.object({
  name: z.string().min(1).max(50),
});
export const UpdateCategoryInputSchema = z.object({
  id: z.number(),
  data: z.object({ name: z.string().min(1).max(50).optional() }),
});
export const DeleteCategoryInputSchema = z.object({ id: z.number() });
export const GetCategoriesInputSchema = z.object({
  sortBy: z.enum(["name", "createdAt", "postCount"]).optional(),
  sortDir: z.enum(["asc", "desc"]).optional(),
  withCount: z.boolean().optional(),
  publicOnly: z.boolean().optional(),
});
export const SetPostCategoriesInputSchema = z.object({
  postId: z.number(),
  categoryIds: z.array(z.number()),
});
export const GetCategoriesByPostIdInputSchema = z.object({ postId: z.number() });

export const CATEGORIES_CACHE_KEYS = {
  publicList: ["public", "categories", "list"] as const,
} as const;

export type Category = z.infer<typeof CategorySelectSchema>;
export type CategoryWithCount = z.infer<typeof CategoryWithCountSchema>;
export type CreateCategoryInput = z.infer<typeof CreateCategoryInputSchema>;
export type UpdateCategoryInput = z.infer<typeof UpdateCategoryInputSchema>;
export type DeleteCategoryInput = z.infer<typeof DeleteCategoryInputSchema>;
export type GetCategoriesInput = z.infer<typeof GetCategoriesInputSchema>;
export type SetPostCategoriesInput = z.infer<
  typeof SetPostCategoriesInputSchema
>;
export type GetCategoriesByPostIdInput = z.infer<
  typeof GetCategoriesByPostIdInputSchema
>;
