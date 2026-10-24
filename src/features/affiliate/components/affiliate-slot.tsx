import { Server } from "lucide-react";
import { m } from "@/paraglide/messages";
import { type AffiliateOffer, affiliateOffers } from "../affiliate.config";
import {
  type AffiliateSlotId,
  affiliateSlots,
  pickOffers,
} from "../affiliate.slots";
import { affiliateHref } from "../affiliate.url";

interface AffiliateSlotProps {
  slot: AffiliateSlotId;
  /**
   * 随机的种子。传文章 slug，同一篇文章永远是同一组广告；
   * 不同文章自动散开。工具页等固定页面传常量即可。
   */
  seed: string;
}

/**
 * 广告位统一入口。
 *
 * 位置在模板里写死，不看正文内容 —— 所以本次改动之前发布的历史文章也会自动带上广告。
 * 选哪条广告由 seed 决定（确定性随机），刷新不会变、SSR 与 hydration 也不会打架。
 */
export function AffiliateSlot({ slot, seed }: AffiliateSlotProps) {
  const config = affiliateSlots[slot];

  // 同一页面的第二个位置排除第一个位置已选中的，避免一篇文章出现两条相同广告
  const exclude =
    "excludeSlot" in config && config.excludeSlot
      ? pickOffers(config.excludeSlot, seed)
      : [];

  // pickOffers 只返回配置表里存在的 slug，直接取值即可，不存在取不到的情况
  const offers: AffiliateOffer[] = pickOffers(slot, seed, exclude).map(
    (slug) => affiliateOffers[slug],
  );

  if (offers.length === 0) return null;

  if (config.variant === "banner") {
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
            <span className="affiliate-card__provider">
              {offer.providerName}
            </span>
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
          {offer.providerName} · {offer.title}
        </span>
        <span className="affiliate-banner__perk">{offer.perk}</span>
      </span>
      <span className="affiliate-banner__cta">{m.affiliate_cta()} →</span>
    </a>
  );
}
