import { Plus, Trash2 } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  AFFILIATE_SLUG_PATTERN,
  type AffiliateOffer,
} from "../../affiliate.schema";
import type { AffiliateAdminText } from "./text";

interface OffersSectionProps {
  offers: AffiliateOffer[];
  onChange: (next: AffiliateOffer[]) => void;
  t: AffiliateAdminText;
}

function nextSlug(offers: AffiliateOffer[]): string {
  let index = offers.length + 1;
  while (offers.some((offer) => offer.slug === `offer-${index}`)) {
    index += 1;
  }
  return `offer-${index}`;
}

function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
      {children}
    </span>
  );
}

export function OffersSection({ offers, onChange, t }: OffersSectionProps) {
  const update = (index: number, patch: Partial<AffiliateOffer>) => {
    onChange(
      offers.map((offer, i) => (i === index ? { ...offer, ...patch } : offer)),
    );
  };

  const remove = (index: number) => {
    onChange(offers.filter((_, i) => i !== index));
  };

  const add = () => {
    onChange([
      ...offers,
      {
        slug: nextSlug(offers),
        provider: "",
        title: "",
        perk: "",
        url: "https://",
        enabled: true,
      },
    ]);
  };

  const duplicateSlugs = new Set(
    offers
      .map((offer) => offer.slug)
      .filter((slug, index, all) => all.indexOf(slug) !== index),
  );

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <h2 className="text-xl font-serif font-medium tracking-tight">
            {t.offersTitle}
          </h2>
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {t.offersDesc}
          </p>
        </div>
        <Button
          type="button"
          onClick={add}
          variant="outline"
          className="h-9 shrink-0 rounded-none px-4 font-mono text-[10px] uppercase tracking-[0.15em]"
        >
          <Plus size={13} className="mr-2" />
          {t.addOffer}
        </Button>
      </header>

      {offers.length === 0 ? (
        <p className="border border-dashed border-border/40 p-8 text-center text-sm text-muted-foreground">
          {t.emptyOffers}
        </p>
      ) : (
        <div className="space-y-4">
          {offers.map((offer, index) => {
            const slugInvalid = !AFFILIATE_SLUG_PATTERN.test(offer.slug);
            const slugDuplicate = duplicateSlugs.has(offer.slug);
            const urlInvalid = !/^https?:\/\/\S+$/i.test(offer.url);

            return (
              <div
                key={index}
                className={cn(
                  "border p-4 transition-colors sm:p-5",
                  offer.enabled
                    ? "border-border/50 bg-muted/20"
                    : "border-border/25 bg-transparent opacity-70",
                )}
              >
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
                  <label>
                    <FieldLabel>{t.colSlug}</FieldLabel>
                    <Input
                      value={offer.slug}
                      onChange={(e) =>
                        update(index, { slug: e.target.value.trim() })
                      }
                      placeholder="aliyun-general"
                      className={cn(
                        "h-9 rounded-none font-mono text-xs",
                        (slugInvalid || slugDuplicate) && "border-destructive",
                      )}
                    />
                  </label>

                  <label>
                    <FieldLabel>{t.colProvider}</FieldLabel>
                    <Input
                      value={offer.provider}
                      onChange={(e) =>
                        update(index, { provider: e.target.value })
                      }
                      placeholder="阿里云"
                      className="h-9 rounded-none text-xs"
                    />
                  </label>

                  <div className="flex items-end gap-4 pb-1">
                    <label className="flex cursor-pointer items-center gap-2">
                      <Checkbox
                        checked={offer.enabled}
                        onCheckedChange={(checked) =>
                          update(index, { enabled: checked })
                        }
                      />
                      <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                        {t.colEnabled}
                      </span>
                    </label>

                    <button
                      type="button"
                      onClick={() => remove(index)}
                      aria-label={t.delete}
                      className="mb-0.5 p-1.5 text-muted-foreground transition-colors hover:text-destructive"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {slugInvalid && (
                  <p className="mt-2 text-xs text-destructive">{t.slugHint}</p>
                )}
                {slugDuplicate && (
                  <p className="mt-2 text-xs text-destructive">
                    slug 重复：{offer.slug}
                  </p>
                )}

                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <label>
                    <FieldLabel>{t.colTitle}</FieldLabel>
                    <Input
                      value={offer.title}
                      onChange={(e) => update(index, { title: e.target.value })}
                      placeholder="云小站 · 上云特惠"
                      className="h-9 rounded-none text-xs"
                    />
                  </label>

                  <label>
                    <FieldLabel>{t.colPerk}</FieldLabel>
                    <Input
                      value={offer.perk}
                      onChange={(e) => update(index, { perk: e.target.value })}
                      placeholder="云服务器 / 轻量 · 新用户 8 折"
                      className="h-9 rounded-none text-xs"
                    />
                  </label>
                </div>

                <label className="mt-3 block">
                  <FieldLabel>{t.colUrl}</FieldLabel>
                  <Input
                    value={offer.url}
                    onChange={(e) => update(index, { url: e.target.value })}
                    placeholder="https://..."
                    spellCheck={false}
                    className={cn(
                      "h-9 rounded-none font-mono text-xs",
                      urlInvalid && "border-destructive",
                    )}
                  />
                </label>

                {!offer.enabled && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    {t.offerDisabledHint}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
