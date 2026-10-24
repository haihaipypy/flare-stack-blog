import { cn } from "@/lib/utils";
import {
  AFFILIATE_SLOT_IDS,
  type AffiliateSlotId,
} from "../../affiliate.schema";
import type { AffiliateAdminText } from "./text";

interface SlotsSectionProps {
  value: Record<AffiliateSlotId, boolean>;
  onChange: (id: AffiliateSlotId, next: boolean) => void;
  t: AffiliateAdminText;
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-6 w-11 shrink-0 rounded-full border transition-colors duration-200",
        checked
          ? "border-foreground bg-foreground"
          : "border-border/60 bg-muted/40",
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 h-4 w-4 rounded-full transition-all duration-200",
          checked
            ? "left-[1.375rem] bg-background"
            : "left-0.5 bg-muted-foreground/60",
        )}
      />
    </button>
  );
}

export function SlotsSection({ value, onChange, t }: SlotsSectionProps) {
  const meta: Record<
    AffiliateSlotId,
    { title: string; desc: string; where: string }
  > = {
    "post-top": {
      title: t.slotPostTop,
      desc: t.slotPostTopDesc,
      where: "/post/:slug",
    },
    "post-bottom": {
      title: t.slotPostBottom,
      desc: t.slotPostBottomDesc,
      where: "/post/:slug",
    },
    "tools-banner": {
      title: t.slotToolsBanner,
      desc: t.slotToolsBannerDesc,
      where: "/tools",
    },
    "embed-float": {
      title: t.slotEmbedFloat,
      desc: t.slotEmbedFloatDesc,
      where: "/embed/float.js",
    },
  };

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <h2 className="text-xl font-serif font-medium tracking-tight">
          {t.slotsTitle}
        </h2>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
          {t.slotsDesc}
        </p>
      </header>

      <div className="space-y-3">
        {AFFILIATE_SLOT_IDS.map((id) => {
          const item = meta[id];
          const enabled = value[id];

          return (
            <div
              key={id}
              className={cn(
                "flex items-start gap-4 border p-4 transition-colors sm:p-5",
                enabled
                  ? "border-border/50 bg-muted/20"
                  : "border-border/25 bg-transparent",
              )}
            >
              <div className="min-w-0 flex-1 space-y-1.5">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="text-sm font-medium text-foreground">
                    {item.title}
                  </span>
                  <code className="font-mono text-[10px] tracking-wider text-muted-foreground/70">
                    {item.where}
                  </code>
                  <span
                    className={cn(
                      "font-mono text-[10px] uppercase tracking-[0.15em]",
                      enabled ? "text-foreground" : "text-muted-foreground/60",
                    )}
                  >
                    {enabled ? t.on : t.off}
                  </span>
                </div>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {item.desc}
                </p>
              </div>

              <Toggle
                checked={enabled}
                label={item.title}
                onChange={(next) => onChange(id, next)}
              />
            </div>
          );
        })}
      </div>
    </section>
  );
}
