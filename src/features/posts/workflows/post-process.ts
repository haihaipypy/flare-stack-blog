import type {
  WorkflowEvent,
  WorkflowStep,
  WorkflowStepContext,
} from "cloudflare:workers";
import { WorkflowEntrypoint } from "cloudflare:workers";
import * as CacheService from "@/features/cache/cache.service";
import * as PostRepo from "@/features/posts/data/posts.data";
import { POSTS_CACHE_KEYS } from "@/features/posts/schema/posts.schema";
import * as PostService from "@/features/posts/services/posts.service";
import { highlightCodeBlocks } from "@/features/posts/utils/content";
import { calculatePostHash } from "@/features/posts/utils/sync";
import {
  fetchPost,
  invalidatePostCaches,
  upsertPostSearchIndex,
} from "@/features/posts/workflows/helpers";
import * as SearchService from "@/features/search/service/search.service";
import { pushUrlsToBaidu } from "@/features/seo/baidu-push";
import { getDb } from "@/lib/db";

interface Params {
  postId: number;
  isPublished: boolean;
  publishedAt?: string; // ISO 8601
  isFuturePost?: boolean;
}

export class PostProcessWorkflow extends WorkflowEntrypoint<Env, Params> {
  async run(event: WorkflowEvent<Params>, step: WorkflowStep) {
    const { postId, isPublished } = event.payload;

    if (isPublished) {
      await this.handlePublish(event, step, postId);
    } else {
      await this.handleUnpublish(step, postId);
    }
  }

  private async handlePublish(
    event: WorkflowEvent<Params>,
    step: WorkflowStep,
    postId: number,
  ) {
    // 1. Fetch post and Check Sync Status
    const { post: initialPost, shouldSkip } = await step.do(
      "check sync status",
      async () => {
        const db = getDb(this.env);
        const p = await PostRepo.findPostById(db, postId);
        if (!p) return { post: null, shouldSkip: true };

        const newHash = await calculatePostHash({
          title: p.title,
          contentJson: p.contentJson,
          summary: p.summary,
          tagIds: p.tags.map((t) => t.id),
          slug: p.slug,
          publishedAt: p.publishedAt,
          pinnedAt: p.pinnedAt,
          readTimeInMinutes: p.readTimeInMinutes,
        });
        const oldHash = await CacheService.getRaw(
          { env: this.env },
          POSTS_CACHE_KEYS.syncHash(postId),
        );
        const needsPublicContentBuild = !!p.contentJson && !p.publicContentJson;

        if (newHash === oldHash && !needsPublicContentBuild) {
          console.log(
            JSON.stringify({ message: "Content unchanged, skipping", postId }),
          );
          return { post: p, shouldSkip: true };
        }

        return { post: p, shouldSkip: false };
      },
    );

    if (shouldSkip || !initialPost) return;

    // Helper: run a step but never let it abort the whole workflow.
    // Any failure is logged with the step name so the source of the
    // post-process exception can be pinpointed from Worker logs.
    const safeStep = async (
      name: string,
      fn: (ctx: WorkflowStepContext) => Promise<unknown>,
    ): Promise<void> => {
      try {
        // step.do's callback type requires a Serializable return; our steps are
        // side-effecting and their values are unused, so widen via unknown.
        await step.do(
          name,
          fn as unknown as (ctx: WorkflowStepContext) => Promise<void>,
        );
      } catch (error) {
        console.warn(
          JSON.stringify({
            message: "post-process step failed",
            step: name,
            postId,
            error: error instanceof Error ? error.message : String(error),
          }),
        );
      }
    };

    // 2. Generate summary (best-effort — must NOT block later steps
    //    like Baidu push even if summary generation fails).
    const updatedPost = await step.do(
      `generate summary for post ${postId}`,
      {
        retries: {
          limit: 3,
          delay: "5 seconds",
          backoff: "exponential",
        },
      },
      async () => {
        const db = getDb(this.env);
        const result = await PostService.generateSummaryByPostId({
          context: { db, env: this.env },
          postId,
        });
        if (result.error) {
          return null;
        }
        return result.data;
      },
    );

    // 3. Persist the highlighted public snapshot used by SSR/read paths.
    await safeStep("build public content", async (_ctx) => {
      const db = getDb(this.env);
      const post = await PostRepo.findPostById(db, postId);
      if (!post) return;

      const publicContentJson = post.contentJson
        ? await highlightCodeBlocks(post.contentJson)
        : null;

      await PostRepo.updatePublicContentSnapshot(db, postId, publicContentJson);
    });

    // 4. Update search index (skip for future posts — ScheduledPublishWorkflow handles it)
    const isFuturePost = !!event.payload.isFuturePost;

    if (!isFuturePost && updatedPost) {
      await safeStep("update search index", async (_ctx) => {
        return await upsertPostSearchIndex(this.env, updatedPost);
      });
    }

    // 5. Invalidate caches
    if (updatedPost) {
      await safeStep("invalidate caches", async (_ctx) => {
        await invalidatePostCaches(this.env, updatedPost.slug);
      });
    }

    // 6. Update sync hash in KV
    await safeStep("update sync hash", async (_ctx) => {
      const p = await fetchPost(this.env, postId);
      if (!p) return;

      const hash = await calculatePostHash({
        title: p.title,
        contentJson: p.contentJson,
        summary: p.summary,
        tagIds: p.tags.map((t) => t.id),
        slug: p.slug,
        publishedAt: p.publishedAt,
        pinnedAt: p.pinnedAt,
        readTimeInMinutes: p.readTimeInMinutes,
      });
      await CacheService.set(
        { env: this.env },
        POSTS_CACHE_KEYS.syncHash(postId),
        hash,
      );
    });

    // Push to Baidu for faster indexing; best-effort, never breaks publishing.
    // Runs last and independently so a prior step failure cannot swallow it.
    const baiduUrl = updatedPost
      ? `https://${this.env.DOMAIN}/post/${encodeURIComponent(updatedPost.slug)}`
      : `https://${this.env.DOMAIN}/post/${encodeURIComponent(
          initialPost.slug,
        )}`;
    await safeStep("push to Baidu", async (_ctx) => {
      await pushUrlsToBaidu(this.env, [baiduUrl]);
    });
  }

  private async handleUnpublish(step: WorkflowStep, postId: number) {
    const post = await step.do("fetch post", async () => {
      return await fetchPost(this.env, postId);
    });

    if (!post) return;

    await step.do("remove from search index", async () => {
      return await SearchService.deleteIndex({ env: this.env }, { id: postId });
    });

    await step.do("invalidate caches", async () => {
      await invalidatePostCaches(this.env, post.slug);
      await CacheService.deleteKey(
        { env: this.env },
        POSTS_CACHE_KEYS.syncHash(postId),
      );
    });
  }
}
