import { queryOptions } from "@tanstack/react-query";
import {
  getCategoriesByPostIdFn,
  getCategoriesFn,
  getCategoriesWithCountAdminFn,
} from "@/features/categories/api/categories.api";
import { apiClient } from "@/lib/api-client";
import { isSSR } from "@/lib/utils";

export const CATEGORIES_KEYS = {
  all: ["categories"] as const,
  public: ["categories", "public"] as const,
  lists: ["categories", "list"] as const,
  admin: ["categories", "admin"] as const,
  list: (filters: {
    sortBy?: string;
    sortDir?: string;
  }) => ["categories", "list", filters] as const,
  adminList: (filters: {
    sortBy?: string;
    sortDir?: string;
  }) => ["categories", "admin", filters] as const,
  adminWithCount: (filters: {
    sortBy?: string;
    sortDir?: string;
  }) => ["categories", "admin", "with-count", filters] as const,
  postCategories: (postId: number) => ["post", postId, "categories"] as const,
};

export const categoriesQueryOptions = queryOptions({
  queryKey: CATEGORIES_KEYS.public,
  queryFn: async () => {
    if (isSSR) {
      return await getCategoriesFn();
    }
    const res = await apiClient.categories.$get();
    if (!res.ok) throw new Error("Failed to fetch categories");
    return res.json();
  },
});

export function categoriesAdminQueryOptions(options?: {
  sortBy?: "name" | "createdAt" | "postCount";
  sortDir?: "asc" | "desc";
}) {
  const { sortBy, sortDir } = options ?? {};
  return queryOptions({
    queryKey: CATEGORIES_KEYS.adminList({ sortBy, sortDir }),
    queryFn: () =>
      getCategoriesWithCountAdminFn({
        data: { withCount: true, sortBy, sortDir },
      }),
    staleTime: Infinity,
  });
}

export function categoriesByPostIdQueryOptions(postId: number) {
  return queryOptions({
    queryKey: CATEGORIES_KEYS.postCategories(postId),
    queryFn: () => getCategoriesByPostIdFn({ data: { postId } }),
  });
}

export function categoriesWithCountAdminQueryOptions(options?: {
  sortBy?: "name" | "createdAt" | "postCount";
  sortDir?: "asc" | "desc";
}) {
  const { sortBy, sortDir } = options ?? {};
  return queryOptions({
    queryKey: CATEGORIES_KEYS.adminWithCount({ sortBy, sortDir }),
    queryFn: () =>
      getCategoriesWithCountAdminFn({
        data: { withCount: true, sortBy, sortDir },
      }),
  });
}
