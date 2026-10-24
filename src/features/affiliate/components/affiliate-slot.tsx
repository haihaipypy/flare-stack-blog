import { useQuery } from "@tanstack/react-query";
import { Server } from "lucide-react";
import { m } from "@/paraglide/messages";
import { activeOffers, DEFAULT_AFFILIATE_CONFIG } from "../affiliate.defaults";
import {
  AFFILIATE_SLOT_META,
  type AffiliateOffer,
  type AffiliateSlotId,
} from "../affiliate.schema";
import { pickOffers } from "../affiliate.slots";
import { affiliateHref } from "../affiliate.url";
import { affiliatePublicConfigQuery } from "../queries";

interface AffiliateSlotProps {
  slot: Exclude<AffiliateSlotId, "embed-float">;
  /**
   * 随机的种子。传文章 slug，同一篇文章永远是同一组广告；
   * 不同文章自动散开。工具页等固定页面传常量即可。
   */
  seed: string;
}

/**
 * 广告位统一入口。
 *
 * 位置在模板里写死，不看正文内容 —— 所以历史文章也会自动带上广告。
 * 选哪条由 seed 决定（确定性随机），刷新不变、SSR 与 hydration 也不会打架。
 *
 * 开关和推广位内容都来自数据库（后台「广告管理」），
 * 页面 loader 预取后这里能直接拿到；拿不到时退回默认配置，不至于空着。
 */
export function AffiliateSlot({ slot, seed }: AffiliateSlotProps) {
  const { data } = useQuery(affiliatePublicConfigQuery);
  const config = data ?? DEFAULT_AFFILIATE_CONFIG;

  const meta = AFFILIATE_SLOT_META[slot];
  if (!config.slots[slot]) return null;

  const usable = activeOffers(config);
  if (usable.length === 0) return null;

  const candidates = usable.map((offer) => offer.slug);

  // 同一页面的第二个位置排除第一个位置已选中的，避免一篇文章出现两条相同广告
  const exclude =
    "excludeSlot" in meta && meta.excludeSlot
      ? pickOffers(meta.excludeSlot, seed, candidates)
      : [];

  const picked = pickOffers(slot, seed, candidates, exclude);
  const bySlug = new Map(usable.map((offer) => [offer.slug, offer]));
  const offers = picked
    .map((slug) => bySlug.get(slug))
    .filter((offer): offer is AffiliateOffer => Boolean(offer));

  if (offers.length === 0) return null;

  if (meta.variant === "banner") {
    return <AffiliateBanner offer={offers[0]} />;
  }

  return <AffiliateEnvironment offers={offers} />;
}

function AdTag() {
  return <span className="affiliate-tag">{m.affiliate_ad_tag()}</span>;
}

function AffiliateEnvironment({ offers }: { offers: AffiliateOffer[] }) {
  return (
    <div className="affiliate-block">
      <div className="affiliate-block__head">
        <Server aria-hidden size={16} strokeWidth={1.75} />
        <span>{m.affiliate_env_title()}</span>
        <AdTag />
      </div>

      <div className="affiliate-grid">
        {offers.map((offer) => (
          <a
            key={offer.slug}
            className="affiliate-card"
            href={affiliateHref(offer.slug)}
            rel="sponsored nofollow noopener"
            target="_blank"
          >
            <span className="affiliate-card__provider">{offer.provider}</span>
            <span className="affiliate-card__title">{offer.title}</span>
            <span className="affiliate-card__perk">{offer.perk}</span>
            <span className="affiliate-card__cta">{m.affiliate_cta()} →</span>
          </a>
        ))}
      </div>

      <p className="affiliate-block__note">{m.affiliate_disclosure()}</p>
    </div>
  );
}

function AffiliateBanner({ offer }: { offer: AffiliateOffer }) {
  return (
    <a
      className="affiliate-banner"
      href={affiliateHref(offer.slug)}
      rel="sponsored nofollow noopener"
      target="_blank"
    >
      <AdTag />
      <span className="affiliate-banner__body">
        <span className="affiliate-banner__title">
          {offer.provider} · {offer.title}
        </span>
        <span className="affiliate-banner__perk">{offer.perk}</span>
      </span>
      <span className="affiliate-banner__cta">{m.affiliate_cta()} →</span>
    </a>
  );
}
