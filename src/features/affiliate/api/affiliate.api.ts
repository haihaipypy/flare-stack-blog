import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { adminMiddleware, dbMiddleware } from "@/lib/middlewares";
import { AffiliateConfigInputSchema } from "../affiliate.schema";
import * as AffiliateService from "../service/affiliate.service";

/**
 * 前台渲染用：只要「启用中且链接合法」的推广位。
 *
 * 不返回停用的、也不返回管理字段（后台才需要全量）。
 */
export const getAffiliatePublicConfigFn = createServerFn()
  .middleware([dbMiddleware])
  .handler(async ({ context }) => {
    const config = await AffiliateService.getAffiliateConfig(context);
    return {
      slots: config.slots,
      offers: config.offers.filter((offer) => offer.enabled),
    };
  });

/** 后台读取：含停用项，用于编辑 */
export const getAffiliateAdminConfigFn = createServerFn()
  .middleware([adminMiddleware])
  .handler(async ({ context }) => {
    return AffiliateService.getAffiliateConfig(context);
  });

export const saveAffiliateConfigFn = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .inputValidator(AffiliateConfigInputSchema)
  .handler(async ({ data, context }) => {
    return AffiliateService.updateAffiliateConfig(context, data);
  });

const StatsInputSchema = z.object({
  days: z.number().int().min(1).max(365).default(30),
});

export const getAffiliateStatsFn = createServerFn()
  .middleware([adminMiddleware])
  .inputValidator(StatsInputSchema)
  .handler(async ({ data, context }) => {
    return AffiliateService.getAffiliateStats(context, data.days);
  });
