import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BarChart3,
  Check,
  Code2,
  LayoutTemplate,
  List,
  Loader2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  AFFILIATE_SLUG_PATTERN,
  type AffiliateConfig,
  type AffiliateSlotId,
} from "../../affiliate.schema";
import { saveAffiliateConfigFn } from "../../api/affiliate.api";
import { AFFILIATE_KEYS, affiliateAdminConfigQuery } from "../../queries";
import { EmbedSection } from "./embed-section";
import { OffersSection } from "./offers-section";
import { SlotsSection } from "./slots-section";
import { StatsSection } from "./stats-section";
import { getAdminText } from "./text";

type TabValue = "slots" | "offers" | "stats" | "embed";

export function AffiliateManager() {
  const t = getAdminText();
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery(affiliateAdminConfigQuery);
  const [draft, setDraft] = useState<AffiliateConfig | null>(null);
  const [tab, setTab] = useState<TabValue>("slots");

  useEffect(() => {
    if (data) setDraft(data);
  }, [data]);

  const isDirty = useMemo(
    () =>
      Boolean(draft && data && JSON.stringify(draft) !== JSON.stringify(data)),
    [draft, data],
  );

  const mutation = useMutation({
    mutationFn: (input: AffiliateConfig) =>
      saveAffiliateConfigFn({ data: input }),
    onSuccess: () => {
      toast.success(t.saved);
      void queryClient.invalidateQueries({ queryKey: AFFILIATE_KEYS.all });
    },
    onError: (error) => {
      toast.error(t.saveFailed, {
        description: error instanceof Error ? error.message : undefined,
      });
    },
  });

  const tabItems = [
    { value: "slots" as const, icon: LayoutTemplate, label: t.tabSlots },
    { value: "offers" as const, icon: List, label: t.tabOffers },
    { value: "stats" as const, icon: BarChart3, label: t.tabStats },
    { value: "embed" as const, icon: Code2, label: t.tabEmbed },
  ];

  const validate = (config: AffiliateConfig): string | null => {
    const seen = new Set<string>();
    for (const offer of config.offers) {
      if (!AFFILIATE_SLUG_PATTERN.test(offer.slug)) {
        return `slug 不合法：${offer.slug || "(空)"}`;
      }
      if (seen.has(offer.slug)) {
        return `slug 重复：${offer.slug}`;
      }
      seen.add(offer.slug);

      if (!offer.provider.trim()) return `${offer.slug}：平台名不能为空`;
      if (!offer.title.trim()) return `${offer.slug}：标题不能为空`;
      if (!/^https?:\/\/\S+$/i.test(offer.url)) {
        return `${offer.slug}：链接必须以 http(s):// 开头`;
      }
    }
    return null;
  };

  const save = () => {
    if (!draft) return;
    const error = validate(draft);
    if (error) {
      toast.error(error);
      return;
    }
    mutation.mutate(draft);
  };

  const setSlot = (id: AffiliateSlotId, next: boolean) => {
    setDraft((prev) =>
      prev ? { ...prev, slots: { ...prev.slots, [id]: next } } : prev,
    );
  };

  if (isLoading || !draft) {
    return (
      <div className="space-y-4 pb-20">
        <div className="h-10 w-48 animate-pulse bg-muted/30" />
        <div className="h-64 animate-pulse border border-border/30 bg-muted/20" />
      </div>
    );
  }

  return (
    <div
      className="space-y-8 pb-20"
      onKeyDown={(event) => {
        // 这里嵌在设置页的大表单里，输入框回车会误触外层保存，拦掉
        if (event.key === "Enter" && event.target instanceof HTMLInputElement) {
          event.preventDefault();
        }
      }}
    >
      <header className="flex flex-col gap-4 border-b border-border/30 pb-5 sm:flex-row sm:items-end sm:justify-between lg:pb-8">
        <div className="space-y-1">
          <h1 className="text-2xl font-serif font-medium tracking-tight text-foreground sm:text-3xl">
            {t.title}
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground">{t.desc}</p>
        </div>

        <div className="flex items-center gap-3">
          {isDirty && (
            <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
              {t.unsaved}
            </span>
          )}
          <Button
            type="button"
            onClick={save}
            disabled={!isDirty || mutation.isPending}
            className="h-11 rounded-none bg-foreground px-8 font-mono text-[11px] uppercase tracking-[0.2em] text-background shadow-lg shadow-foreground/5 transition-all hover:bg-foreground/90 disabled:opacity-50"
          >
            {mutation.isPending ? (
              <Loader2 size={14} className="mr-3 animate-spin" />
            ) : (
              <Check size={14} className="mr-3" />
            )}
            {mutation.isPending ? t.saving : t.save}
          </Button>
        </div>
      </header>

      <Tabs
        value={tab}
        onValueChange={(value) => setTab(value as TabValue)}
        className="flex flex-col items-start gap-8 lg:grid lg:grid-cols-[200px_1fr] lg:gap-14"
      >
        <div className="w-full self-start border-b border-border/20 pb-2 lg:border-b-0 lg:border-r lg:border-border/20 lg:pb-0 lg:pr-6">
          <div className="overflow-x-auto no-scrollbar">
            <TabsList className="flex w-max min-w-full flex-row gap-1.5 rounded-2xl border border-border/25 bg-background/90 p-1.5 lg:w-full lg:min-w-0 lg:flex-col lg:justify-start lg:gap-1.5 lg:rounded-none lg:border-0 lg:bg-transparent lg:p-0">
              {tabItems.map(({ value, icon: Icon, label }) => (
                <TabsTrigger
                  key={value}
                  value={value}
                  className={cn(
                    "flex shrink-0 items-center justify-center whitespace-nowrap rounded-full border-none px-3 py-2.5 text-[10px] font-mono uppercase tracking-[0.15em] shadow-none transition-all duration-300 lg:w-full lg:justify-start lg:rounded-none lg:border-l-2 lg:border-transparent lg:px-4 lg:py-3",
                    "text-muted-foreground data-[state=active]:bg-foreground data-[state=active]:text-background lg:data-[state=active]:border-foreground lg:data-[state=active]:bg-muted/30 lg:data-[state=active]:text-foreground",
                  )}
                >
                  <Icon size={14} className="shrink-0 opacity-70" />
                  <span className="ml-2 text-left lg:ml-3">{label}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <TabsContent value="slots" className="mt-0">
            <SlotsSection t={t} value={draft.slots} onChange={setSlot} />
          </TabsContent>

          <TabsContent value="offers" className="mt-0">
            <OffersSection
              t={t}
              offers={draft.offers}
              onChange={(offers) =>
                setDraft((prev) => (prev ? { ...prev, offers } : prev))
              }
            />
          </TabsContent>

          <TabsContent value="stats" className="mt-0">
            <StatsSection t={t} />
          </TabsContent>

          <TabsContent value="embed" className="mt-0">
            <EmbedSection t={t} enabled={draft.slots["embed-float"]} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
