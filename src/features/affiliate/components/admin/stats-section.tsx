import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { affiliateStatsQuery } from "../../queries";
import type { AffiliateAdminText } from "./text";

interface StatsSectionProps {
  t: AffiliateAdminText;
}

const RANGES = [7, 30, 90] as const;

function formatDate(seconds: number | null): string {
  if (!seconds) return "—";
  try {
    return new Date(seconds * 1000).toLocaleDateString();
  } catch {
    return "—";
  }
}

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="border border-border/40 bg-muted/20 p-4">
      <div className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
        {label}
      </div>
      <div className="mt-2 font-serif text-2xl tabular-nums text-foreground">
        {value}
      </div>
    </div>
  );
}

function Empty({ children }: { children: ReactNode }) {
  return (
    <p className="border border-dashed border-border/40 p-6 text-center text-xs text-muted-foreground">
      {children}
    </p>
  );
}

export function StatsSection({ t }: StatsSectionProps) {
  const [days, setDays] = useState<number>(30);
  const { data, isLoading } = useQuery(affiliateStatsQuery(days));

  const maxDaily = Math.max(1, ...(data?.daily.map((d) => d.clicks) ?? [1]));

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <h2 className="text-xl font-serif font-medium tracking-tight">
            {t.statsTitle}
          </h2>
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {t.statsDesc}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-1 border border-border/40 p-1">
          {RANGES.map((range) => (
            <button
              key={range}
              type="button"
              onClick={() => setDays(range)}
              className={cn(
                "px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] transition-colors",
                days === range
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {range === 7 ? t.days7 : range === 30 ? t.days30 : t.days90}
            </button>
          ))}
        </div>
      </header>

      {isLoading || !data ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-20 animate-pulse border border-border/30 bg-muted/20"
            />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard label={t.statClicks} value={data.totals.clicks} />
            <StatCard label={t.statSources} value={data.totals.sources} />
            <StatCard label={t.statOffers} value={data.totals.offers} />
            <StatCard label={t.statPosts} value={data.totals.posts} />
          </div>

          {/* 站外来源 */}
          <div className="space-y-3">
            <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              {t.bySource}
            </h3>
            {data.bySource.length === 0 ? (
              <Empty>{t.bySourceEmpty}</Empty>
            ) : (
              <div className="overflow-x-auto border border-border/40">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/30 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                    <tr>
                      <th className="px-4 py-2.5 font-normal">source</th>
                      <th className="px-4 py-2.5 text-right font-normal">
                        {t.statClicks}
                      </th>
                      <th className="px-4 py-2.5 text-right font-normal">
                        {t.lastClick}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.bySource.map((row) => (
                      <tr
                        key={row.source}
                        className="border-t border-border/25"
                      >
                        <td className="px-4 py-2.5 font-mono text-foreground">
                          {row.source || "—"}
                        </td>
                        <td className="px-4 py-2.5 text-right tabular-nums">
                          {row.clicks}
                        </td>
                        <td className="px-4 py-2.5 text-right text-muted-foreground tabular-nums">
                          {formatDate(row.lastAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* 各推广位 */}
          <div className="space-y-3">
            <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              {t.byOffer}
            </h3>
            {data.byOffer.length === 0 ? (
              <Empty>{t.dailyEmpty}</Empty>
            ) : (
              <div className="space-y-2">
                {data.byOffer.map((row) => (
                  <div
                    key={row.slug}
                    className="flex items-center justify-between gap-4 border border-border/35 px-4 py-2.5 text-xs"
                  >
                    <span className="truncate font-mono text-foreground">
                      {row.slug}
                    </span>
                    <span className="shrink-0 tabular-nums text-muted-foreground">
                      {row.clicks}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 各文章 */}
          <div className="space-y-3">
            <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              {t.byPost}
            </h3>
            {data.byPost.length === 0 ? (
              <Empty>{t.byPostEmpty}</Empty>
            ) : (
              <div className="space-y-2">
                {data.byPost.map((row) => (
                  <div
                    key={row.postSlug}
                    className="flex items-center justify-between gap-4 border border-border/35 px-4 py-2.5 text-xs"
                  >
                    <span className="truncate text-foreground">
                      {row.postSlug}
                    </span>
                    <span className="shrink-0 tabular-nums text-muted-foreground">
                      {row.clicks}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 每日趋势 */}
          <div className="space-y-3">
            <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              {t.daily}
            </h3>
            {data.daily.length === 0 ? (
              <Empty>{t.dailyEmpty}</Empty>
            ) : (
              <div className="space-y-1.5">
                {data.daily.map((row) => (
                  <div
                    key={row.day}
                    className="flex items-center gap-3 text-xs"
                  >
                    <span className="w-24 shrink-0 font-mono text-[10px] text-muted-foreground">
                      {row.day}
                    </span>
                    <div className="h-2 flex-1 bg-muted/40">
                      <div
                        className="h-full bg-foreground/70"
                        style={{
                          width: `${Math.max(2, (row.clicks / maxDaily) * 100)}%`,
                        }}
                      />
                    </div>
                    <span className="w-8 shrink-0 text-right tabular-nums text-muted-foreground">
                      {row.clicks}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
}
