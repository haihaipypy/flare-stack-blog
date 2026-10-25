import type { Context } from "hono";
import { Hono } from "hono";
import { activeOffers } from "@/features/affiliate/affiliate.defaults";
import { buildFloatEmbedScript } from "@/features/affiliate/embed/float-embed";
import { getAffiliateConfig } from "@/features/affiliate/service/affiliate.service";
import { getDb } from "@/lib/db";

const app = new Hono<{ Bindings: Env }>();

const SCRIPT_HEADERS = {
  "Content-Type": "application/javascript; charset=utf-8",
  // 站外引用要允许跨域；链接本身是导航，不受 CORS 影响，但脚本标签的
  // crossorigin / 某些站长平台的探测请求需要这个头
  "Access-Control-Allow-Origin": "*",
  // 宿主站可能开了 Cross-Origin-Embedder-Policy: require-corp（为了 WASM 多线程、
  // SharedArrayBuffer），此时跨域 <script> 必须自带 CORP，否则控制台会报
  // net::ERR_BLOCKED_BY_RESPONSE，看起来像「脚本坏了」。
  // 本脚本只做 DOM 操作，没有 iframe / 外链图片 / fetch，所以一个头就够。
  "Cross-Origin-Resource-Policy": "cross-origin",
  "X-Content-Type-Options": "nosniff",
} as const;

function buildDbContext(c: Context<{ Bindings: Env }>) {
  let executionCtx: ExecutionContext;
  try {
    executionCtx = c.executionCtx;
  } catch {
    executionCtx = {
      waitUntil: () => {},
      passThroughOnException: () => {},
    } as unknown as ExecutionContext;
  }

  return { env: c.env, db: getDb(c.env), executionCtx };
}

/**
 * 悬浮广告嵌入脚本。
 *
 * 内容是运行时从数据库读的（后台「广告管理」）：
 * - 悬浮位总开关关掉，或一条可用广告都没有 → 下发空脚本，宿主站不会报错；
 * - 缓存 5 分钟，改完配置最迟 5 分钟全站生效。
 */
app.get("/float.js", async (c) => {
  const origin = new URL(c.req.url).origin;

  let offers: Awaited<ReturnType<typeof activeOffers>> = [];
  try {
    const config = await getAffiliateConfig(buildDbContext(c));
    if (config.slots["embed-float"]) {
      offers = activeOffers(config);
    }
  } catch (error) {
    console.warn(
      JSON.stringify({
        message: "affiliate embed config read failed",
        error: error instanceof Error ? error.message : String(error),
      }),
    );
  }

  return c.body(buildFloatEmbedScript(origin, offers), 200, {
    ...SCRIPT_HEADERS,
    "Cache-Control": "public, max-age=300",
  });
});

/**
 * 预览页：把脚本插进去，方便接入前先看一眼实际效果。
 * 不缓存，避免调样式时看到旧版本。
 */
app.get("/float", (c) => {
  const origin = new URL(c.req.url).origin;

  return c.html(
    `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex" />
<title>悬浮广告 · 嵌入预览</title>
<style>
  body { margin:0; min-height:100vh; padding:48px 24px; background:#f6f7f9; color:#1f2328;
         font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Microsoft YaHei",sans-serif; }
  .wrap { max-width:680px; margin:0 auto; }
  h1 { font-size:20px; margin:0 0 8px; }
  p { font-size:14px; line-height:1.7; color:#57606a; margin:0 0 16px; }
  pre { padding:14px 16px; border-radius:10px; background:#0d1117; color:#c9d1d9;
        font-size:12.5px; line-height:1.6; overflow:auto; }
  .tip { font-size:13px; color:#8b949e; }
  @media (prefers-color-scheme:dark) {
    body { background:#16171a; color:#f0f1f3; }
    p { color:#a0a6ad; }
  }
</style>
</head>
<body>
  <div class="wrap">
    <h1>悬浮广告 · 嵌入预览</h1>
    <p>桌面端（宽度 ≥ 1024px）右下角会出现悬浮卡；手机上不显示。点一下卡片，应当先跳到
       <code>${origin}/go/&lt;slug&gt;</code>，再由 302 转到对应厂商。</p>
    <pre>&lt;script src="${origin}/embed/float.js" data-aff-float async&gt;&lt;/script&gt;</pre>
    <p class="tip">位置不限：<code>&lt;head&gt;</code> 里、<code>&lt;/body&gt;</code> 前、<code>&lt;footer&gt;</code> 内部，
       或网站后台的「页脚代码」输入框都可以 —— 脚本会自己等 DOM 就绪再把卡片挂到页面最外层。
       同一页贴多份也只出一个卡片。</p>
    <p class="tip">可以加这些属性：<code>data-position="left"</code>、<code>data-delay="0"</code>、
       <code>data-dismiss-days="7"</code>、<code>data-offer="tencent-99"</code>、<code>data-lang="en"</code>。</p>
    <p class="tip">在后台「广告管理 → 悬浮广告」里关掉这个位置后，本页刷新就不会再出现卡片。</p>
  </div>
  <script src="${origin}/embed/float.js" data-aff-float async></script>
</body>
</html>`,
    200,
    {
      "Cache-Control": "no-store",
      // 允许被开了 COEP: require-corp 的站点用 iframe 预览
      "Cross-Origin-Resource-Policy": "cross-origin",
    },
  );
});

export default app;
