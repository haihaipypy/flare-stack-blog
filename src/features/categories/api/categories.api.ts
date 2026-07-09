import { createServerFn } from "@tanstack/react-start";
import {
  CreateCategoryInputSchema,
  DeleteCategoryInputSchema,
  GetCategoriesByPostIdInputSchema,
  GetCategoriesInputSchema,
  SetPostCategoriesInputSchema,
  UpdateCategoryInputSchema,
} from "@/features/categories/categories.schema";
import * as CategoryService from "@/features/categories/categories.service";
import { adminMiddleware, dbMiddleware } from "@/lib/middlewares";

// ============ Public API ============

export const getCategoriesFn = createServerFn()
  .middleware([dbMiddleware])
  .handler(async ({ context }) => {
    return await CategoryService.getPublicCategories(context);
  });

// ============ Admin API ============

export const getCategoriesAdminFn = createServerFn()
  .middleware([adminMiddleware])
  .inputValidator(GetCategoriesInputSchema)
  .handler(async ({ data, context }) => {
    return await CategoryService.getCategories(context, data);
  });

export const createCategoryFn = createServerFn({
  method: "POST",
})
  .middleware([adminMiddleware])
  .inputValidator(CreateCategoryInputSchema)
  .handler(async ({ data, context }) => {
    try {
      return await CategoryService.createCategory(context, data);
    } catch (error) {
      console.error("[createCategoryFn] error:", error);
      throw error;
    }
  });

export const updateCategoryFn = createServerFn({
  method: "POST",
})
  .middleware([adminMiddleware])
  .inputValidator(UpdateCategoryInputSchema)
  .handler(({ data, context }) =>
    CategoryService.updateCategory(context, data),
  );

export const deleteCategoryFn = createServerFn({
  method: "POST",
})
  .middleware([adminMiddleware])
  .inputValidator(DeleteCategoryInputSchema)
  .handler(({ data, context }) =>
    CategoryService.deleteCategory(context, data),
  );

export const setPostCategoriesFn = createServerFn({
  method: "POST",
})
  .middleware([adminMiddleware])
  .inputValidator(SetPostCategoriesInputSchema)
  .handler(({ data, context }) =>
    CategoryService.setPostCategories(context, data),
  );

export const getCategoriesByPostIdFn = createServerFn()
  .middleware([adminMiddleware])
  .inputValidator(GetCategoriesByPostIdInputSchema)
  .handler(async ({ data, context }) => {
    return await CategoryService.getCategoriesByPostId(context, data);
  });

export const getCategoriesWithCountAdminFn = createServerFn()
  .middleware([adminMiddleware])
  .inputValidator(GetCategoriesInputSchema)
  .handler(async ({ data, context }) => {
    return await CategoryService.getCategoriesWithCount(context, data);
  });
