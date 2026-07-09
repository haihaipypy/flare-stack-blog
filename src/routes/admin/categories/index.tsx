import { createFileRoute } from "@tanstack/react-router";
import { CategoryManager } from "@/features/categories/components/category-manager";
import { categoriesWithCountAdminQueryOptions } from "@/features/categories/queries";
import { m } from "@/paraglide/messages";

export const Route = createFileRoute("/admin/categories/")({
  ssr: "data-only",
  component: CategoryManagerRoute,
  loader: async ({ context }) => {
    await context.queryClient.prefetchQuery(
      categoriesWithCountAdminQueryOptions(),
    );
    return {
      title: m.category_manager_title(),
    };
  },
  head: ({ loaderData }) => ({
    meta: [
      {
        title: loaderData?.title,
      },
    ],
  }),
});

function CategoryManagerRoute() {
  return <CategoryManager />;
}
