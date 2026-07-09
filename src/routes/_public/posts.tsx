import {
  useSuspenseInfiniteQuery,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import theme from "@theme";
import { useMemo } from "react";
import { z } from "zod";
import { siteConfigQuery, siteDomainQuery } from "@/features/config/queries";
import { postsInfiniteQueryOptions } from "@/features/posts/queries";
import { categoriesQueryOptions } from "@/features/categories/queries";
import { tagsQueryOptions } from "@/features/tags/queries";
import { buildCanonicalUrl, canonicalLink } from "@/lib/seo";
import { m } from "@/paraglide/messages";

const { postsPerPage } = theme.config.posts;

export const Route = createFileRoute("/_public/posts")({
  validateSearch: z.object({
    tagName: z.string().optional(),
    categoryName: z.string().optional(),
  }),
  component: RouteComponent,
  pendingComponent: PostsSkeleton,
  loaderDeps: ({ search: { tagName, categoryName } }) => ({
    tagName,
    categoryName,
  }),
  loader: async ({ context, deps }) => {
    const [, , , domain, siteConfig] = await Promise.all([
      context.queryClient.prefetchInfiniteQuery(
        postsInfiniteQueryOptions({
          tagName: deps.tagName,
          categoryName: deps.categoryName,
          limit: postsPerPage,
        }),
      ),
      context.queryClient.prefetchQuery(tagsQueryOptions),
      context.queryClient.prefetchQuery(categoriesQueryOptions),
      context.queryClient.ensureQueryData(siteDomainQuery),
      context.queryClient.ensureQueryData(siteConfigQuery),
    ]);

    return {
      title: m.posts_title(),
      description: siteConfig.description,
      canonicalHref: buildCanonicalUrl(domain, "/posts", {
        tagName: deps.tagName,
        categoryName: deps.categoryName,
      }),
    };
  },
  head: ({ loaderData }) => ({
    meta: [
      {
        title: loaderData?.title,
      },
      {
        name: "description",
        content: loaderData?.description,
      },
    ],
    links: [canonicalLink(loaderData?.canonicalHref ?? "/posts")],
  }),
});

function RouteComponent() {
  const { tagName, categoryName } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });

  const { data: tags } = useSuspenseQuery(tagsQueryOptions);
  const { data: categories } = useSuspenseQuery(categoriesQueryOptions);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useSuspenseInfiniteQuery(
      postsInfiniteQueryOptions({
        tagName,
        categoryName,
        limit: postsPerPage,
      }),
    );

  const posts = useMemo(() => {
    return data.pages.flatMap((page) => page.items);
  }, [data]);

  const handleTagClick = (clickedTag: string) => {
    navigate({
      search: {
        tagName: clickedTag === tagName ? undefined : clickedTag,
        categoryName,
      },
      replace: true,
    });
  };

  const handleCategoryClick = (clickedCategory: string) => {
    navigate({
      search: {
        tagName,
        categoryName:
          clickedCategory === categoryName ? undefined : clickedCategory,
      },
      replace: true,
    });
  };

  return (
    <theme.PostsPage
      posts={posts}
      tags={tags}
      categories={categories}
      selectedTag={tagName}
      selectedCategory={categoryName}
      onTagClick={handleTagClick}
      onCategoryClick={handleCategoryClick}
      hasNextPage={hasNextPage}
      isFetchingNextPage={isFetchingNextPage}
      fetchNextPage={fetchNextPage}
    />
  );
}

function PostsSkeleton() {
  return <theme.PostsPageSkeleton />;
}
