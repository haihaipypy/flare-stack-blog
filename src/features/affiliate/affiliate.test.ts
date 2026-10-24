import { describe, expect, it } from "vitest";
import {
  activeOffers,
  createDefaultAffiliateConfig,
  DEFAULT_AFFILIATE_OFFERS,
  resolveAffiliateConfig,
} from "./affiliate.defaults";
import {
  AFFILIATE_SLOT_IDS,
  AffiliateConfigInputSchema,
  AffiliateOfferSchema,
} from "./affiliate.schema";
import { pickOffers } from "./affiliate.slots";
import { affiliateHref } from "./affiliate.url";

describe("广告配置归一化", () => {
  it("空值（首次部署 / 从未保存过）返回默认配置", () => {
    const config = resolveAffiliateConfig(undefined);
    expect(config.slots["post-top"]).toBe(true);
    expect(config.offers.length).toBe(DEFAULT_AFFILIATE_OFFERS.length);
  });

  it("缺字段时补齐默认值，不丢已配置的项", () => {
    const config = resolveAffiliateConfig({
      slots: { "post-top": false },
      offers: [
        {
          slug: "only-one",
          provider: "测试",
          title: "标题",
          perk: "",
          url: "https://example.com/a",
          enabled: true,
        },
      ],
    });

    expect(config.slots["post-top"]).toBe(false);
    expect(config.slots["post-bottom"]).toBe(true); // 补默认
    expect(config.offers).toHaveLength(1);
    expect(config.offers[0]?.slug).toBe("only-one");
  });

  it("脏数据整份退回默认，不让后台配置坏掉整站", () => {
    const config = resolveAffiliateConfig({ offers: "not-an-array" });
    expect(config.offers).toHaveLength(DEFAULT_AFFILIATE_OFFERS.length);
  });

  it("四个位置 id 都有对应开关", () => {
    const config = createDefaultAffiliateConfig();
    for (const id of AFFILIATE_SLOT_IDS) {
      expect(typeof config.slots[id]).toBe("boolean");
    }
    expect(Object.keys(config.slots)).toHaveLength(AFFILIATE_SLOT_IDS.length);
  });

  it("停用的和链接非法的都不会出现在前台", () => {
    const config = resolveAffiliateConfig({
      offers: [
        {
          slug: "off",
          provider: "A",
          title: "T",
          perk: "",
          url: "https://example.com",
          enabled: false,
        },
        {
          slug: "bad-url",
          provider: "B",
          title: "T",
          perk: "",
          url: "javascript:alert(1)",
          enabled: true,
        },
        {
          slug: "ok",
          provider: "C",
          title: "T",
          perk: "",
          url: "https://example.com",
          enabled: true,
        },
      ],
    });

    expect(activeOffers(config).map((offer) => offer.slug)).toEqual(["ok"]);
  });
});

describe("写入校验", () => {
  it("slug 只允许小写字母、数字与短横线", () => {
    const base = {
      provider: "A",
      title: "T",
      perk: "",
      url: "https://example.com",
      enabled: true,
    };
    expect(
      AffiliateOfferSchema.safeParse({ ...base, slug: "ok-slug-1" }).success,
    ).toBe(true);
    expect(
      AffiliateOfferSchema.safeParse({ ...base, slug: "Bad Slug" }).success,
    ).toBe(false);
    expect(
      AffiliateOfferSchema.safeParse({ ...base, slug: "-leading" }).success,
    ).toBe(false);
    expect(
      AffiliateOfferSchema.safeParse({ ...base, slug: "中文" }).success,
    ).toBe(false);
  });

  it("链接必须是 http(s)", () => {
    const base = {
      slug: "x",
      provider: "A",
      title: "T",
      perk: "",
      enabled: true,
    };
    expect(
      AffiliateOfferSchema.safeParse({
        ...base,
        url: "https://a.com/x?y=1&z=2",
      }).success,
    ).toBe(true);
    expect(
      AffiliateOfferSchema.safeParse({ ...base, url: "javascript:alert(1)" })
        .success,
    ).toBe(false);
  });

  it("整份输入允许只传 slots 或只传 offers", () => {
    expect(
      AffiliateConfigInputSchema.safeParse({ slots: { "post-top": false } })
        .success,
    ).toBe(true);
    expect(AffiliateConfigInputSchema.safeParse({ offers: [] }).success).toBe(
      true,
    );
  });
});

describe("广告位挑选", () => {
  const candidates = DEFAULT_AFFILIATE_OFFERS.map((offer) => offer.slug);

  it("文章上方出两条，文末与工具页各一条", () => {
    expect(pickOffers("post-top", "a", candidates)).toHaveLength(2);
    expect(pickOffers("post-bottom", "a", candidates)).toHaveLength(1);
    expect(pickOffers("tools-banner", "a", candidates)).toHaveLength(1);
  });

  it("同一个 seed 结果固定（SSR 与 hydration 一致）", () => {
    expect(pickOffers("post-top", "docker-note", candidates)).toEqual(
      pickOffers("post-top", "docker-note", candidates),
    );
  });

  it("不同文章散开，不会所有文章都推同一条", () => {
    const seen = new Set(
      ["post-a", "post-b", "post-c", "post-d", "post-e", "post-f"].map(
        (seed) => pickOffers("post-bottom", seed, candidates)[0],
      ),
    );
    expect(seen.size).toBeGreaterThan(1);
  });

  it("只在候选池内挑，不会返回池外的 slug", () => {
    for (let i = 0; i < 30; i += 1) {
      const picked = pickOffers("post-top", `seed-${i}`, candidates);
      for (const slug of picked) {
        expect(candidates).toContain(slug);
      }
    }
  });

  it("exclude 生效：文末不会重复正文上方已出现的那条", () => {
    const top = pickOffers("post-top", "docker-note", candidates);
    const bottom = pickOffers("post-bottom", "docker-note", candidates, top);
    expect(top).not.toContain(bottom[0]);
  });

  it("候选排空时退回原始池，宁可重复也不空着", () => {
    const only = ["single-offer"];
    const bottom = pickOffers("post-bottom", "x", only, only);
    expect(bottom).toEqual(["single-offer"]);
  });

  it("没有任何候选时返回空数组", () => {
    expect(pickOffers("post-top", "x", [])).toEqual([]);
  });
});

describe("短链", () => {
  it("统一走站内 /go/ 中转", () => {
    expect(affiliateHref("aliyun-general")).toBe("/go/aliyun-general");
  });

  it("slug 会被 URL 编码，不会拼出非法路径", () => {
    expect(affiliateHref("a b")).toBe("/go/a%20b");
  });
});
