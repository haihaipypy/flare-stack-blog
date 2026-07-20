import type { WorkflowEvent, WorkflowStep } from "cloudflare:workers";
import { WorkflowEntrypoint } from "cloudflare:workers";
import { toUTCMidnight } from "@/features/posts/utils/date";
import {
  fetchPost,
  invalidatePostCaches,
  upsertPostSearchIndex,
} from "@/features/posts/workflows/helpers";
import { pushUrlsToBaidu } from "@/features/seo/baidu-push";

interface Params {
  postId: number;
  publishedAt: string; // ISO 8601
}

export class ScheduledPublishWorkflow extends WorkflowEntrypoint<Env, Params> {
  async run(event: WorkflowEvent<Params>, step: WorkflowStep) {
    const { postId } = event.payload;

    await step.sleepUntil(
      "sleep until publish date",
      toUTCMidnight(new Date(event.payload.publishedAt)),
    );

    const post = await step.do("verify post status", async () => {
      return await fetchPost(this.env, postId);
    });

    if (!post || post.status !== "published") return;

    await step.do("invalidate caches", async () => {
      await invalidatePostCaches(this.env, post.slug);
    });

    await step.do("update search index", async () => {
      await upsertPostSearchIndex(this.env, post);
    });

    // Push to Baidu for faster indexing; best-effort, never breaks publishing.
    await step.do("push to Baidu", async () => {
      const postUrl = `https://${this.env.DOMAIN}/post/${encodeURIComponent(
        post.slug,
      )}`;
      await pushUrlsToBaidu(this.env, [postUrl]);
    });
  }
}
