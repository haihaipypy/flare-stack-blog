import { z } from "zod";
import { blogConfig } from "@/blog.config";
import { AffiliateConfigStoredSchema } from "@/features/affiliate/affiliate.schema";
import {
  createSiteConfigInputFormSchema,
  type SiteConfigInput,
  SiteConfigInputSchema,
} from "@/features/config/site-config.schema";
import { webhookEndpointSchema } from "@/features/webhook/webhook.schema";
import type { Messages } from "@/lib/i18n";

export const SystemConfigSchema = z.object({
  /** 广告位配置：位置开关 + 推广位列表，由后台「设置 → 广告」单独维护 */
  affiliate: AffiliateConfigStoredSchema.optional(),
  email: z
    .object({
      apiKey: z.string().optional(),
      host: z.string().optional(),
      port: z.number().int().positive().optional(),
      username: z.string().optional(),
      password: z.string().optional(),
      senderName: z.string().optional(),
      senderAddress: z.union([z.email(), z.literal("")]).optional(),
    })
    .optional(),
  notification: z
    .object({
      admin: z
        .object({
          channels: z
            .object({
              email: z.boolean().optional(),
              webhook: z.boolean().optional(),
            })
            .optional(),
        })
        .optional(),
      user: z
        .object({
          emailEnabled: z.boolean().optional(),
        })
        .optional(),
      webhooks: z.array(webhookEndpointSchema).optional(),
    })
    .optional(),
  site: SiteConfigInputSchema.optional(),
});

export const createSystemConfigFormSchema = (messages: Messages) =>
  z.object({
    email: SystemConfigSchema.shape.email,
    notification: SystemConfigSchema.shape.notification,
    site: createSiteConfigInputFormSchema(messages).optional(),
  });

export type SystemConfig = z.infer<typeof SystemConfigSchema>;
export type {
  SiteConfig,
  SiteConfigInput,
} from "@/features/config/site-config.schema";

export const DEFAULT_CONFIG: SystemConfig = {
  email: {
    host: "",
    port: 465,
    username: "",
    password: "",
    senderName: "",
    senderAddress: "",
  },
  notification: {
    admin: {
      channels: {
        email: true,
        webhook: true,
      },
    },
    user: {
      emailEnabled: true,
    },
    webhooks: [],
  },
  site: blogConfig satisfies SiteConfigInput,
  // 注意：这里不放默认广告配置。读的时候由 resolveAffiliateConfig() 兜底，
  // 避免把 5 条默认链接写进每次保存的系统配置里（换了链接还要向后兼容）。
};

export const CONFIG_CACHE_KEYS = {
  system: ["system"] as const,
} as const;
