import { Skeleton } from "@/components/ui/skeleton";

export function HomePageSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col rounded-(--fuwari-radius-large) bg-(--fuwari-card-bg) py-1 md:py-0 md:bg-transparent md:gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="px-6 py-5">
            <div className="flex items-start gap-4">
              {/* Avatar skeleton */}
              <Skeleton className="w-10 h-10 rounded-lg shrink-0 bg-(--fuwari-btn-regular-bg)" />
              <div className="flex-1 min-w-0 space-y-3">
                {/* Title */}
                <Skeleton className="h-5 w-3/4 rounded-md bg-(--fuwari-btn-regular-bg)" />
                {/* Meta row */}
                <div className="flex gap-3">
                  <Skeleton className="h-3 w-16 rounded-md bg-(--fuwari-btn-regular-bg)" />
                  <Skeleton className="h-3 w-12 rounded-md bg-(--fuwari-btn-regular-bg)" />
                  <Skeleton className="h-3 w-20 rounded-md bg-(--fuwari-btn-regular-bg)" />
                </div>
                {/* Tags */}
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-14 rounded-lg bg-(--fuwari-btn-regular-bg)" />
                  <Skeleton className="h-6 w-20 rounded-lg bg-(--fuwari-btn-regular-bg)" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
