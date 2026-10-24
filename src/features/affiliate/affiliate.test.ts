import { describe, expect, it } from "vitest";
import {
  affiliateOffers,
  affiliateSlugs,
  getAffiliateOffer,
  isAffiliateSlug,
} from "./affiliate.config";
import { affiliateSlots, pickOffers } from "./affiliate.slots";
import { affiliateHref } from "./affiliate.url";

describe("推广位配置", () => {
  it("slug 与对象 key 一致，避免 /go/:slug 找不到目标", () => {
    for (const slug of affiliateSlugs) {
      expect(affiliateOffers[slug].slug).toBe(slug);
    }
  });

  it("所有链接都是 https，且带上推广参数", () => {
    for (const slug of affiliateSlugs) {
      const { url } = affiliateOffers[slug];
      expect(url.startsWith("https://")).toBe(true);
      expect(url).toMatch(/userCode=|cps_key=/);
    }
  });

  it("广告位引用的 slug 都真实存在", () => {
    for (const config of Object.values(affiliateSlots)) {
      for (const slug of config.pool) {
        expect(isAffiliateSlug(slug)).toBe(true);
      }
    }
  });

  it("未知 slug 返回 null 而不是抛错", () => {
    expect(getAffiliateOffer("nope")).toBeNull();
    expect(getAffiliateOffer("")).toBeNull();
    expect(getAffiliateOffer("__proto__")).toBeNull();
  });
});

describe("affiliateHref", () => {
  it("走站内短链，不带外域", () => {
    expect(affiliateHref("aliyun-oss")).toBe("/go/aliyun-oss");
  });
});

describe("pickOffers", () => {
  it("同一 seed 同一位置结果稳定（SSR 与 hydration 必须一致）", () => {
    const a = pickOffers("post-top", "docker-note");
    const b = pickOffers("post-top", "docker-note");
    expect(a).toEqual(b);
  });

  it("按位置配置的数量返回，且不重复", () => {
    const top = pickOffers("post-top", "docker-note");
    expect(top).toHaveLength(2);
    expect(new Set(top).size).toBe(2);

    expect(pickOffers("post-bottom", "docker-note")).toHaveLength(1);
    expect(pickOffers("tools-banner", "tools")).toHaveLength(1);
  });

  it("结果全部落在该位置的池子里", () => {
    for (const [slot, config] of Object.entries(affiliateSlots)) {
      for (const seed of ["a", "b", "docker-note", "中文标题"]) {
        for (const slug of pickOffers(
          slot as keyof typeof affiliateSlots,
          seed,
        )) {
          expect(config.pool).toContain(slug);
        }
      }
    }
  });

  it("不同文章会散开，不是所有文章都挂同一条", () => {
    const picked = new Set(
      Array.from({ length: 30 }, (_, i) =>
        pickOffers("post-bottom", `post-${i}`).join(","),
      ),
    );
    expect(picked.size).toBeGreaterThan(1);
  });

  it("文末位会排除正文顶部已选中的广告", () => {
    for (const seed of ["a", "b", "c", "docker-note", "nas-guide"]) {
      const top = pickOffers("post-top", seed);
      const bottom = pickOffers("post-bottom", seed, top);
      for (const slug of bottom) {
        expect(top).not.toContain(slug);
      }
    }
  });

  it("排除过多时仍能返回结果，不会空着", () => {
    const all = [...affiliateSlugs];
    expect(pickOffers("post-bottom", "x", all).length).toBeGreaterThan(0);
  });
});
