import { z } from "zod";

/**
 * 广告位 id。
 *
 * 前三个是站内模板位置，第四个是「站外悬浮脚本」的总开关 ——
 * 它不在页面上渲染，只控制 /embed/float.js 是否下发。
 */
export const AFFILIATE_SLOT_IDS = [
  "post-top",
  "post-bottom",
  "tools-banner",
  "embed-float",
] as const;

export type AffiliateSlotId = (typeof AFFILIATE_SLOT_IDS)[number];

interface SlotMeta {
  /** 一次展示几条 */
  count: number;
  variant: "env" | "banner" | "float";
  /** 同页内排除另一个位置已选中的，避免一篇文章出现两条相同广告 */
  excludeSlot?: AffiliateSlotId;
}

/**
 * 位置的渲染属性。**不给后台改** —— 后台只能开关，不能改布局，
 * 否则一套主题模板要处理任意种组合，维护成本远大于收益。
 */
export const AFFILIATE_SLOT_META = {
  "post-top": { count: 2, variant: "env" },
  "post-bottom": { count: 1, variant: "banner", excludeSlot: "post-top" },
  "tools-banner": { count: 1, variant: "banner" },
  "embed-float": { count: 1, variant: "float" },
} as const satisfies Record<AffiliateSlotId, SlotMeta>;

export function isAffiliateSlotId(value: string): value is AffiliateSlotId {
  return (AFFILIATE_SLOT_IDS as readonly string[]).includes(value);
}

/** slug 会进 URL（/go/:slug），所以只允许小写字母、数字、短横线 */
export const AFFILIATE_SLUG_PATTERN = /^[a-z0-9][a-z0-9-]{0,63}$/;

export interface AffiliateOffer {
  /** 稳定标识，也是 /go/:slug 的 slug。建好之后不要改，老链接会失效 */
  slug: string;
  /** 展示名，如「阿里云」 */
  provider: string;
  /** 卡片标题 */
  title: string;
  /** 读者视角的优惠点 */
  perk: string;
  /** 目标链接，必须 http(s) */
  url: string;
  /** 关掉后不再被挑中，但保留配置，方便季节性活动上下架 */
  enabled: boolean;
}

export interface AffiliateConfig {
  slots: Record<AffiliateSlotId, boolean>;
  offers: AffiliateOffer[];
}

const httpUrl = z
  .string()
  .trim()
  .max(2000)
  .refine((value) => /^https?:\/\/\S+$/i.test(value), {
    message: "必须以 http:// 或 https:// 开头",
  });

export const AffiliateOfferSchema = z.object({
  slug: z
    .string()
    .trim()
    .regex(AFFILIATE_SLUG_PATTERN, "只能用小写字母、数字和短横线"),
  provider: z.string().trim().min(1, "不能为空").max(40),
  title: z.string().trim().min(1, "不能为空").max(80),
  perk: z.string().trim().max(120),
  url: httpUrl,
  enabled: z.boolean(),
});

/** 写入时的校验（后台提交用）。slots 允许部分字段，读取时再补齐默认值。 */
export const AffiliateConfigInputSchema = z.object({
  slots: z
    .object({
      "post-top": z.boolean().optional(),
      "post-bottom": z.boolean().optional(),
      "tools-banner": z.boolean().optional(),
      "embed-float": z.boolean().optional(),
    })
    .optional(),
  offers: z.array(AffiliateOfferSchema).max(30, "最多 30 条").optional(),
});

export type AffiliateConfigInput = z.infer<typeof AffiliateConfigInputSchema>;

/** 读取时的宽松 schema：历史数据缺字段、脏数据都不能让整站读配置失败 */
export const AffiliateConfigStoredSchema = z.object({
  slots: z.any().optional(),
  offers: z.any().optional(),
});

/** 校验 slug 是否可写进 URL */
export function isValidAffiliateSlug(value: string): boolean {
  return AFFILIATE_SLUG_PATTERN.test(value);
}
