import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import { renderAvatarSvg } from "@/features/avatar/avatar.render";
import { CACHE_CONTROL } from "@/lib/constants";

/**
 * GET /avatar/:seed
 *
 * 按 seed 生成一张确定性的 DiceBear 头像（SVG）。
 *
 * 为什么不把 `@dicebear/core` 搬到客户端：
 *   - 输出只由 URL 决定 → 可以打 `immutable` 缓存头，边缘缓存后
 *     同一个 seed 在整网只需生成一次；
 *   - 客户端零 JS、零包体增量，`<img src>` 直接能用，SSR/CSR 表现一致。
 *
 * 因为 seed 完全决定输出，响应可以被无限期缓存；`style` 与 `size` 均在
 * 查询串里，所以 URL 本身就是完整的缓存键。
 */
const app = new Hono<{ Bindings: Env }>();

const paramSchema = z.object({
  // 上限放宽到 512，避免超长路径刷日志；真正生效的长度在 normalizeAvatarSeed 里截断
  seed: z.string().min(1).max(512),
});

const querySchema = z.object({
  // size 是纯装饰性参数，非法时静默退回默认尺寸而不是 400 ——
  // 这个端点是被 <img> 直接引用的，任何 4xx 都会表现为一张裂图。
  size: z
    .string()
    .optional()
    .transform((value) => {
      if (value == null) return undefined;
      const parsed = Number.parseInt(value, 10);
      return Number.isFinite(parsed) ? parsed : undefined;
    }),
  style: z.string().optional(),
});

app.get(
  "/:seed",
  zValidator("param", paramSchema),
  zValidator("query", querySchema),
  async (c) => {
    const { seed } = c.req.valid("param");
    const { size, style } = c.req.valid("query");

    const {
      svg,
      styleId,
      size: resolvedSize,
    } = await renderAvatarSvg({
      seed,
      size,
      style,
    });

    return new Response(svg, {
      headers: {
        "Content-Type": "image/svg+xml; charset=utf-8",
        "X-Content-Type-Options": "nosniff",
        // 生成结果是纯图形，禁止任何外部资源与脚本执行
        "Content-Security-Policy":
          "default-src 'none'; style-src 'unsafe-inline'",
        "X-Avatar-Style": styleId,
        "X-Avatar-Size": String(resolvedSize),
        ...CACHE_CONTROL.immutable,
      },
    });
  },
);

export default app;
