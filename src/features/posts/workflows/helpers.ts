import * as CacheService from "@/features/cache/cache.service";
import * as PostService from "@/features/posts/services/posts.service";
import * as SearchService from "@/features/search/service/search.service";
import { getDb } from "@/lib/db";
import { purgePostCDNCache } from "@/lib/invalidate";

export async function fetchPost(env: Env, postId: number) {
  const db = getDb(env);
  return await PostService.findPostById({ db, env }, { id: postId });
}

export async function invalidatePostCaches(env: Env, slug: string) {
  await Promise.all([
    // 版本号全局生效；Cache API 的 delete 只在当前数据中心有效，不能用它做跨区失效
    CacheService.bumpVersion({ env }, "posts:detail"),
    purgePostCDNCache(env, slug),
    CacheService.bumpVersion({ env }, "posts:list"),
    CacheService.bumpVersion({ env }, "site"),
  ]);
}

export async function upsertPostSearchIndex(
  env: Env,
  post: {
    id: number;
    slug: string;
    title: string;
    summary: string | null;
    contentJson: Parameters<typeof SearchService.upsert>[1]["contentJson"];
    tags: Array<{ name: string }>;
  },
) {
  await SearchService.upsert(
    { env },
    {
      id: post.id,
      slug: post.slug,
      title: post.title,
      summary: post.summary,
      contentJson: post.contentJson,
      tags: post.tags.map((t) => t.name),
    },
  );
}
