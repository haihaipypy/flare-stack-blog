import * as CategoryService from "@/features/categories/categories.service";
import { serializeMcpDate } from "../../../service/mcp-serialize";

export function serializeMcpCategory(category: {
  createdAt: Date | string;
  id: number;
  name: string;
}) {
  return {
    createdAt: serializeMcpDate(category.createdAt),
    id: category.id,
    name: category.name,
  };
}

export function serializeMcpCategoryWithCount(category: {
  createdAt: Date | string;
  id: number;
  name: string;
  postCount: number;
}) {
  return {
    ...serializeMcpCategory(category),
    postCount: category.postCount,
  };
}

export async function ensureCategoryIdsByNames(
  context: DbContext,
  categoryNames: Array<string>,
) {
  const normalizedNames = [...new Set(categoryNames.map((name) => name.trim()))]
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));

  if (normalizedNames.length === 0) {
    return [];
  }

  const existingCategories = await CategoryService.getCategories(context, {
    sortBy: "name",
    sortDir: "asc",
  });

  const idByName = new Map(existingCategories.map((c) => [c.name, c.id]));
  const categoryIds: Array<number> = [];

  for (const name of normalizedNames) {
    const existingId = idByName.get(name);
    if (existingId) {
      categoryIds.push(existingId);
      continue;
    }

    const created = await CategoryService.createCategory(context, { name });
    if (created.error) {
      throw new Error(`Failed to create category "${name}"`);
    }

    idByName.set(created.data.name, created.data.id);
    categoryIds.push(created.data.id);
  }

  return categoryIds;
}