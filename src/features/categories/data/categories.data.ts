import { and, asc, count, desc, eq, gt, lte, ne, sql } from "drizzle-orm";
import type { BatchItem } from "drizzle-orm/batch";
import {
  CategoriesTable,
  PostCategoriesTable,
  PostsTable,
} from "@/lib/db/schema";

/**
 * Get all categories, optionally sorted
 */
export async function getAllCategories(
  db: DB,
  options: {
    sortBy?: "name" | "createdAt";
    sortDir?: "asc" | "desc";
  } = {},
) {
  const { sortBy = "name", sortDir = "asc" } = options;

  const orderFn = sortDir === "asc" ? asc : desc;
  const orderColumn =
    sortBy === "createdAt" ? CategoriesTable.createdAt : CategoriesTable.name;

  return await db
    .select()
    .from(CategoriesTable)
    .orderBy(orderFn(orderColumn));
}

/**
 * Get all categories with their post counts
 */
export async function getAllCategoriesWithCount(
  db: DB,
  options: {
    sortBy?: "name" | "createdAt" | "postCount";
    sortDir?: "asc" | "desc";
    publicOnly?: boolean;
  } = {},
) {
  const { sortBy = "name", sortDir = "asc", publicOnly = false } = options;

  const query = db
    .select({
      id: CategoriesTable.id,
      name: CategoriesTable.name,
      createdAt: CategoriesTable.createdAt,
      postCount: count(PostCategoriesTable.postId).as("postCount"),
    })
    .from(CategoriesTable)
    .leftJoin(
      PostCategoriesTable,
      eq(CategoriesTable.id, PostCategoriesTable.categoryId),
    )
    .groupBy(CategoriesTable.id)
    .$dynamic();

  if (publicOnly) {
    query
      .innerJoin(PostsTable, eq(PostCategoriesTable.postId, PostsTable.id))
      .where(
        and(
          eq(PostsTable.status, "published"),
          lte(PostsTable.publishedAt, new Date()),
        ),
      )
      .having(gt(count(PostCategoriesTable.postId), 0));
  }

  const orderFn = sortDir === "asc" ? asc : desc;

  if (sortBy === "postCount") {
    query.orderBy(orderFn(sql`postCount`));
  } else if (sortBy === "createdAt") {
    query.orderBy(orderFn(CategoriesTable.createdAt));
  } else {
    query.orderBy(orderFn(CategoriesTable.name));
  }

  return await query;
}

/**
 * Find a category by ID
 */
export async function findCategoryById(db: DB, id: number) {
  return await db.query.CategoriesTable.findFirst({
    where: eq(CategoriesTable.id, id),
  });
}

/**
 * Find a category by name
 */
export async function findCategoryByName(db: DB, name: string) {
  return await db.query.CategoriesTable.findFirst({
    where: eq(CategoriesTable.name, name),
  });
}

/**
 * Insert a new category
 */
export async function insertCategory(
  db: DB,
  data: typeof CategoriesTable.$inferInsert,
) {
  const [category] = await db
    .insert(CategoriesTable)
    .values(data)
    .returning();
  return category;
}

/**
 * Update a category
 */
export async function updateCategory(
  db: DB,
  id: number,
  data: Partial<Omit<typeof CategoriesTable.$inferInsert, "id" | "createdAt">>,
) {
  const [category] = await db
    .update(CategoriesTable)
    .set(data)
    .where(eq(CategoriesTable.id, id))
    .returning();
  return category;
}

/**
 * Delete a category
 */
export async function deleteCategory(db: DB, id: number) {
  await db.delete(CategoriesTable).where(eq(CategoriesTable.id, id));
}

/**
 * Get categories for a specific post
 */
export async function getCategoriesByPostId(db: DB, postId: number) {
  const results = await db
    .select({
      id: CategoriesTable.id,
      name: CategoriesTable.name,
      createdAt: CategoriesTable.createdAt,
    })
    .from(PostCategoriesTable)
    .innerJoin(
      CategoriesTable,
      eq(PostCategoriesTable.categoryId, CategoriesTable.id),
    )
    .where(eq(PostCategoriesTable.postId, postId))
    .orderBy(asc(CategoriesTable.name));

  return results;
}

/**
 * Set categories for a post (replace all existing categories).
 * Uses db.batch() to execute delete + insert in a single roundtrip.
 */
export async function setPostCategories(
  db: DB,
  postId: number,
  categoryIds: Array<number>,
) {
  const batchQueries: Array<BatchItem<"sqlite">> = [];

  const deleteQuery = db
    .delete(PostCategoriesTable)
    .where(eq(PostCategoriesTable.postId, postId));

  if (categoryIds.length > 0) {
    batchQueries.push(
      db.insert(PostCategoriesTable).values(
        categoryIds.map((categoryId) => ({
          postId,
          categoryId,
        })),
      ),
    );
  }

  await db.batch([deleteQuery, ...batchQueries]);
}

/**
 * Check if a category name exists
 */
export async function nameExists(
  db: DB,
  name: string,
  options: { excludeId?: number } = {},
): Promise<boolean> {
  const { excludeId } = options;
  const conditions = [eq(CategoriesTable.name, name)];
  if (excludeId) {
    conditions.push(ne(CategoriesTable.id, excludeId));
  }
  const results = await db
    .select({ id: CategoriesTable.id })
    .from(CategoriesTable)
    .where(and(...conditions))
    .limit(1);
  return results.length > 0;
}

/**
 * Delete all category associations for a post.
 */
export async function deletePostCategoryAssociations(
  db: DB,
  postId: number,
) {
  await db
    .delete(PostCategoriesTable)
    .where(eq(PostCategoriesTable.postId, postId));
}

/**
 * Get published posts associated with a category (for cache invalidation)
 */
export async function getPublishedPostsByCategoryId(
  db: DB,
  categoryId: number,
) {
  const results = await db
    .select({
      id: PostsTable.id,
      slug: PostsTable.slug,
    })
    .from(PostCategoriesTable)
    .innerJoin(PostsTable, eq(PostCategoriesTable.postId, PostsTable.id))
    .where(
      and(
        eq(PostCategoriesTable.categoryId, categoryId),
        eq(PostsTable.status, "published"),
        lte(PostsTable.publishedAt, new Date()),
      ),
    );

  return results;
}
