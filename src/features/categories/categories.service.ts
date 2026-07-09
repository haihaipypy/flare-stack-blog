import { z } from "zod";
import * as CacheService from "@/features/cache/cache.service";
import * as PostRepo from "@/features/posts/data/posts.data";
import { POSTS_CACHE_KEYS } from "@/features/posts/schema/posts.schema";
import * as PostAutoSnapshotService from "@/features/posts/services/post-auto-snapshot.service";
import * as CategoryRepo from "@/features/categories/data/categories.data";
import type {
  Category,
  CategoryWithCount,
  CreateCategoryInput,
  DeleteCategoryInput,
  GetCategoriesByPostIdInput,
  GetCategoriesInput,
  SetPostCategoriesInput,
  UpdateCategoryInput,
} from "@/features/categories/categories.schema";
import {
  CATEGORIES_CACHE_KEYS,
  CategoryWithCountSchema,
} from "@/features/categories/categories.schema";
import { err, ok } from "@/lib/errors";
import { purgeCDNCache } from "@/lib/invalidate";

/**
 * Get all categories (optionally with counts)
 */
export async function getCategories(
  context: DbContext,
  data: GetCategoriesInput = {},
): Promise<Array<Category | CategoryWithCount>> {
  const {
    sortBy = "name",
    sortDir = "asc",
    withCount = false,
    publicOnly = false,
  } = data;

  if (withCount) {
    return await CategoryRepo.getAllCategoriesWithCount(context.db, {
      sortBy,
      sortDir,
      publicOnly,
    });
  }
  return await CategoryRepo.getAllCategories(context.db, {
    sortBy: sortBy === "postCount" ? "name" : sortBy,
    sortDir,
  });
}

/**
 * Get public categories list (KV-only, populated by publish workflow)
 */
export async function getPublicCategories(
  context: DbContext & {
    executionCtx: ExecutionContext;
  },
) {
  return await CacheService.get(
    context,
    CATEGORIES_CACHE_KEYS.publicList,
    z.array(CategoryWithCountSchema),
    async () => {
      return await CategoryRepo.getAllCategoriesWithCount(context.db, {
        publicOnly: true,
        sortBy: "postCount",
        sortDir: "desc",
      });
    },
    { ttl: "7d" },
  );
}

/**
 * Get all categories with counts (admin)
 */
export async function getCategoriesWithCount(
  context: DbContext,
  data: GetCategoriesInput = {},
) {
  return await CategoryRepo.getAllCategoriesWithCount(context.db, data);
}

/**
 * Get categories for a specific post
 */
export async function getCategoriesByPostId(
  context: DbContext,
  data: GetCategoriesByPostIdInput,
) {
  return await CategoryRepo.getCategoriesByPostId(context.db, data.postId);
}

// ============ Admin Service Methods ============

async function invalidateCategoryRelatedCache(
  context: DbContext,
  affectedPosts: Array<{ id: number; slug: string }>,
) {
  await CacheService.deleteKey(context, CATEGORIES_CACHE_KEYS.publicList);

  if (affectedPosts.length > 0) {
    const tasks: Array<Promise<void>> = [];

    tasks.push(CacheService.bumpVersion(context, "posts:list"));

    const version = await CacheService.getVersion(context, "posts:detail");
    for (const post of affectedPosts) {
      tasks.push(
        CacheService.deleteKey(
          context,
          POSTS_CACHE_KEYS.detail(version, post.slug),
        ),
      );
    }

    const cdnUrls = ["/", "/posts"];
    for (const post of affectedPosts) {
      cdnUrls.push(`/post/${post.slug}`);
    }
    tasks.push(purgeCDNCache(context.env, { urls: cdnUrls }));

    await Promise.all(tasks);
  } else {
    await Promise.all([
      CacheService.bumpVersion(context, "posts:detail"),
      CacheService.bumpVersion(context, "posts:list"),
      purgeCDNCache(context.env, { urls: ["/", "/posts"] }),
    ]);
  }
}

export const createCategory = async (
  context: DbContext,
  data: CreateCategoryInput,
) => {
  const exists = await CategoryRepo.nameExists(context.db, data.name);
  if (exists) {
    return err({ reason: "CATEGORY_NAME_ALREADY_EXISTS" });
  }

  // Use raw D1 API to avoid Drizzle inserting NULL for auto-increment id column,
  // which fails on D1 in certain table creation scenarios.
  const stmt = context.env.DB.prepare(
    "INSERT INTO categories (name) VALUES (?1)",
  ).bind(data.name);
  const result = await stmt.run();

  if (!result.success) {
    console.error("[createCategory] D1 insert failed:", result);
    throw new Error("Failed to create category");
  }

  const insertId = result.meta.last_row_id;
  const category = await CategoryRepo.findCategoryById(context.db, insertId);

  if (!category) {
    console.error(
      "[createCategory] Category not found after insert, id:",
      insertId,
    );
    throw new Error("Category created but could not be retrieved");
  }

  return ok(category);
};

export async function updateCategory(
  context: DbContext & { executionCtx: ExecutionContext },
  data: UpdateCategoryInput,
) {
  const existingCategory = await CategoryRepo.findCategoryById(
    context.db,
    data.id,
  );
  if (!existingCategory) {
    return err({ reason: "CATEGORY_NOT_FOUND" });
  }

  if (data.data.name && data.data.name !== existingCategory.name) {
    const exists = await CategoryRepo.nameExists(context.db, data.data.name, {
      excludeId: data.id,
    });
    if (exists) {
      return err({ reason: "CATEGORY_NAME_ALREADY_EXISTS" });
    }
  }

  const affectedPosts = await CategoryRepo.getPublishedPostsByCategoryId(
    context.db,
    data.id,
  );

  const category = await CategoryRepo.updateCategory(
    context.db,
    data.id,
    data.data,
  );

  context.executionCtx.waitUntil(
    invalidateCategoryRelatedCache(context, affectedPosts),
  );

  return ok(category);
}

export async function deleteCategory(
  context: DbContext & { executionCtx: ExecutionContext },
  data: DeleteCategoryInput,
) {
  const category = await CategoryRepo.findCategoryById(context.db, data.id);
  if (!category) {
    return err({ reason: "CATEGORY_NOT_FOUND" });
  }

  const affectedPosts = await CategoryRepo.getPublishedPostsByCategoryId(
    context.db,
    data.id,
  );

  await CategoryRepo.deleteCategory(context.db, data.id);

  context.executionCtx.waitUntil(
    invalidateCategoryRelatedCache(context, affectedPosts),
  );

  return ok({ success: true });
}

export async function setPostCategories(
  context: DbContext & { executionCtx: ExecutionContext },
  data: SetPostCategoriesInput,
) {
  await CategoryRepo.setPostCategories(
    context.db,
    data.postId,
    data.categoryIds,
  );
  await PostRepo.touchPostUpdatedAt(context.db, data.postId);

  context.executionCtx.waitUntil(
    Promise.all([
      CacheService.deleteKey(context, CATEGORIES_CACHE_KEYS.publicList),
      CacheService.bumpVersion(context, "posts:list"),
      purgeCDNCache(context.env, { urls: ["/", "/posts"] }),
    ]),
  );

  await PostAutoSnapshotService.enqueuePostAutoSnapshot(context, {
    postId: data.postId,
    source: "category_update",
  });
}
