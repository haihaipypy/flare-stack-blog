import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { adjacentPostsQuery } from "@/features/posts/queries";
import { m } from "@/paraglide/messages";

/**
 * 文章底部的"上一篇 / 下一篇"：按发布时间相邻的两篇。
 * 左侧指向更新的一篇，右侧指向更早的一篇。
 */
export function PostAdjacentNav({ slug }: { slug: string }) {
  const { data } = useSuspenseQuery(adjacentPostsQuery(slug));

  if (!data.newer && !data.older) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 gap-6 animate-in fade-in duration-500 delay-300 fill-mode-both md:grid-cols-2">
      {data.newer ? (
        <Link
          to="/post/$slug"
          params={{ slug: data.newer.slug }}
          aria-label={m.post_previous()}
          className="group flex items-center gap-3 rounded-lg border border-border/60 p-4 transition-colors hover:bg-muted/40"
        >
          <ArrowLeft
            size={16}
            aria-hidden="true"
            className="shrink-0 text-muted-foreground transition-transform duration-300 group-hover:-translate-x-1"
          />
          <div className="min-w-0">
            <div className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground/60">
              {m.post_previous()}
            </div>
            <div className="truncate font-serif leading-snug group-hover:text-primary transition-colors">
              {data.newer.title}
            </div>
          </div>
        </Link>
      ) : (
        <div />
      )}

      {data.older ? (
        <Link
          to="/post/$slug"
          params={{ slug: data.older.slug }}
          aria-label={m.post_next()}
          className="group flex items-center justify-end gap-3 rounded-lg border border-border/60 p-4 text-right transition-colors hover:bg-muted/40 md:col-start-2"
        >
          <div className="min-w-0">
            <div className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground/60">
              {m.post_next()}
            </div>
            <div className="truncate font-serif leading-snug group-hover:text-primary transition-colors">
              {data.older.title}
            </div>
          </div>
          <ArrowRight
            size={16}
            aria-hidden="true"
            className="shrink-0 text-muted-foreground transition-transform duration-300 group-hover:translate-x-1"
          />
        </Link>
      ) : (
        <div />
      )}
    </div>
  );
}

export function PostAdjacentNavSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      {[0, 1].map((i) => (
        <Skeleton key={i} className="h-[4.5rem] w-full rounded-lg" />
      ))}
    </div>
  );
}
