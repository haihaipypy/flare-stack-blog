import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useRef } from "react";
import { setPostCategoriesFn } from "@/features/categories/api/categories.api";
import {
  CATEGORIES_KEYS,
  categoriesAdminQueryOptions,
  categoriesByPostIdQueryOptions,
} from "@/features/categories/queries";
import { MEDIA_KEYS } from "@/features/media/queries";
import { updatePostFn as adminUpdatePostFn } from "@/features/posts/api/posts.admin.api";
import { PostEditor } from "@/features/posts/components/post-editor";
import { PostSaveConflictError } from "@/features/posts/components/post-editor/conflict";
import { PostEditorSkeleton } from "@/features/posts/components/post-editor/post-editor-skeleton";
import type {
  PostEditorData,
  PostSaveOptions,
} from "@/features/posts/components/post-editor/types";
import { POSTS_KEYS, postByIdQuery } from "@/features/posts/queries";
import { setPostTagsFn } from "@/features/tags/api/tags.api";
import {
  TAGS_KEYS,
  tagsAdminQueryOptions,
  tagsByPostIdQueryOptions,
} from "@/features/tags/queries";
import { m } from "@/paraglide/messages";

export const Route = createFileRoute("/admin/posts/edit/$id")({
  ssr: "data-only",
  component: EditPost,
  pendingComponent: PostEditorSkeleton,
  loader: async ({ context, params }) => {
    const postId = Number(params.id);
    const [post, _] = await Promise.all([
      context.queryClient.ensureQueryData(postByIdQuery(postId)),
      context.queryClient.ensureQueryData(tagsByPostIdQueryOptions(postId)),
      context.queryClient.ensureQueryData(
        categoriesByPostIdQueryOptions(postId),
      ),
      // Prefetch all tags for the selector
      context.queryClient.prefetchQuery(tagsAdminQueryOptions()),
      // Prefetch all categories for the selector
      context.queryClient.prefetchQuery(categoriesAdminQueryOptions()),
    ]);
    return { title: post?.title };
  },
  head: ({ loaderData }) => ({
    meta: [
      {
        title: loaderData?.title,
      },
    ],
  }),
});

function EditPost() {
  const { id } = Route.useParams();
  const postId = Number(id);
  const queryClient = useQueryClient();

  // Use useQuery instead of useSuspenseQuery to prevent flickering on background refetches
  // Since loader ensures data is in cache, these will have initial data immediately.
  const { data: post } = useQuery(postByIdQuery(postId));
  const { data: tags } = useQuery(tagsByPostIdQueryOptions(postId));
  const { data: categories } = useQuery(categoriesByPostIdQueryOptions(postId));

  // 乐观锁基准：本次编辑会话里服务端最后一次确认的 updatedAt（Unix 秒）
  const expectedUpdatedAtRef = useRef<number | null>(null);
  if (post && expectedUpdatedAtRef.current === null) {
    expectedUpdatedAtRef.current = Math.floor(post.updatedAt.getTime() / 1000);
  }

  if (!post || !tags || !categories) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="text-center space-y-4">
          <h2 className="text-4xl font-serif font-medium">
            {m.admin_post_edit_not_found_title()}
          </h2>
          <p className="text-zinc-400 font-light text-sm">
            {m.admin_post_edit_not_found_desc({ id: String(postId) })}
          </p>
        </div>
      </div>
    );
  }

  const initialData = {
    id: post.id,
    title: post.title,
    summary: post.summary ?? "",
    slug: post.slug,
    status: post.status,
    readTimeInMinutes: post.readTimeInMinutes,
    contentJson: post.contentJson,
    publishedAt: post.publishedAt,
    tagIds: tags.map((t) => t.id),
    categoryIds: categories.map((c) => c.id),
    pinnedAt: post.pinnedAt,
    isSynced: post.isSynced,
    hasPublicCache: post.hasPublicCache,
  };

  const handleSave = async (
    data: PostEditorData,
    options?: PostSaveOptions,
  ) => {
    const publishedAt =
      data.status === "published" && !post.publishedAt
        ? new Date()
        : data.publishedAt;

    // 先写正文：带上打开编辑器时读到的 updatedAt，被别人改过就不落库
    const updateResult = await adminUpdatePostFn({
      data: {
        id: post.id,
        expectedUpdatedAt: options?.force
          ? undefined
          : (expectedUpdatedAtRef.current ?? undefined),
        data: {
          ...data,
          publishedAt,
        },
      },
    });

    if (updateResult.error) {
      if (updateResult.error.reason === "POST_CONFLICT") {
        throw new PostSaveConflictError(
          updateResult.error.currentUpdatedAt ?? null,
        );
      }
      throw new Error(m.admin_post_edit_error_not_found());
    }

    if (updateResult.data?.updatedAt) {
      expectedUpdatedAtRef.current = Math.floor(
        new Date(updateResult.data.updatedAt).getTime() / 1000,
      );
    }

    // 标签/分类放到正文之后，并跳过它们对 updated_at 的 touch，
    // 否则下次保存的乐观锁基准就对不上了。
    await Promise.all([
      setPostTagsFn({
        data: {
          postId: post.id,
          tagIds: data.tagIds,
          skipTouch: true,
        },
      }),
      setPostCategoriesFn({
        data: {
          postId: post.id,
          categoryIds: data.categoryIds,
          skipTouch: true,
        },
      }),
    ]);

    // Invalidate cache to ensure fresh data on next visit
    queryClient.invalidateQueries({ queryKey: POSTS_KEYS.detail(postId) });
    // Invalidate lists and counts, but keep other details cached
    queryClient.invalidateQueries({ queryKey: POSTS_KEYS.lists });
    queryClient.invalidateQueries({ queryKey: POSTS_KEYS.adminLists });
    queryClient.invalidateQueries({ queryKey: POSTS_KEYS.counts });

    queryClient.invalidateQueries({ queryKey: TAGS_KEYS.postTags(postId) });
    queryClient.invalidateQueries({ queryKey: TAGS_KEYS.admin });
    queryClient.invalidateQueries({
      queryKey: CATEGORIES_KEYS.postCategories(postId),
    });
    queryClient.invalidateQueries({ queryKey: CATEGORIES_KEYS.admin });
    // Replaces predicate: matches ["media", "linked-keys", ...]
    queryClient.invalidateQueries({
      queryKey: MEDIA_KEYS.linked,
    });
  };

  return <PostEditor initialData={initialData} onSave={handleSave} />;
}
