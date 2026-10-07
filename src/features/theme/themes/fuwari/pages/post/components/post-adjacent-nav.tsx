import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { adjacentPostsQuery } from "@/features/posts/queries";
import { m } from "@/paraglide/messages";

/**
 * 文章底部的"上一篇 / 下一篇"：按发布时间相邻的两篇。
 * 左侧箭头指向更新的一篇，右侧箭头指向更早的一篇。
 */
export function PostAdjacentNav({ slug }: { slug: string }) {
  const { data } = useSuspenseQuery(adjacentPostsQuery(slug));

  if (!data.newer && !data.older) {
    return null;
  }

  return (
    <div
      className="flex w-full flex-col justify-between gap-4 overflow-hidden md:flex-row fuwari-onload-animation"
      style={{ animationDelay: "150ms" }}
    >
      {data.newer ? (
        <Link
          to="/post/$slug"
          params={{ slug: data.newer.slug }}
          aria-label={m.post_previous()}
          title={data.newer.title}
          className="w-full overflow-hidden font-bold active:scale-95"
        >
          <div className="fuwari-card-base flex h-[3.75rem] w-full max-w-full items-center justify-start gap-4 px-4">
            <ChevronLeft
              size={32}
              className="shrink-0 text-(--fuwari-primary)"
              aria-hidden="true"
            />
            <div className="max-w-[calc(100%-3rem)] overflow-hidden text-ellipsis whitespace-nowrap fuwari-text-75">
              {data.newer.title}
            </div>
          </div>
        </Link>
      ) : (
        <div className="w-full" />
      )}

      {data.older ? (
        <Link
          to="/post/$slug"
          params={{ slug: data.older.slug }}
          aria-label={m.post_next()}
          title={data.older.title}
          className="w-full overflow-hidden font-bold active:scale-95"
        >
          <div className="fuwari-card-base flex h-[3.75rem] w-full max-w-full items-center justify-end gap-4 px-4">
            <div className="max-w-[calc(100%-3rem)] overflow-hidden text-ellipsis whitespace-nowrap fuwari-text-75">
              {data.older.title}
            </div>
            <ChevronRight
              size={32}
              className="shrink-0 text-(--fuwari-primary)"
              aria-hidden="true"
            />
          </div>
        </Link>
      ) : (
        <div className="w-full" />
      )}
    </div>
  );
}

export function PostAdjacentNavSkeleton() {
  return (
    <div className="flex w-full flex-col justify-between gap-4 overflow-hidden md:flex-row">
      {[0, 1].map((i) => (
        <Skeleton key={i} className="h-[3.75rem] w-full rounded-xl" />
      ))}
    </div>
  );
}
