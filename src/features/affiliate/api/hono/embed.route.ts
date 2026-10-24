import { Hono } from "hono";
import { buildFloatEmbedScript } from "@/features/affiliate/embed/float-embed";

const app = new Hono<{ Bindings: Env }>();

const SCRIPT_HEADERS = {
  "Content-Type": "application/javascript; charset=utf-8",
  // 站外引用要允许跨域；链接本身是导航，不受 CORS 影响，但脚本标签的
  // crossorigin / 某些站长平台的探测请求需要这个头
  "Access-Control-Allow-Origin": "*",
  "X-Content-Type-Options": "nosniff",
} as const;

/**
 * 悬浮广告嵌入脚本。
 *
 * 缓存 5 分钟：改完 affiliate.config.ts 部署后，所有嵌入站点最迟 5 分钟自动换新，
 * 又不会让每个访客都回源。
 */
app.get("/float.js", (c) => {
  const origin = new URL(c.req.url).origin;
  return c.body(buildFloatEmbedScript(origin), 200, {
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
</style>
</head>
<body>
  <div class="wrap">
    <h1>悬浮广告 · 嵌入预览</h1>
    <p>桌面端（宽度 ≥ 1024px）右下角会出现悬浮卡；手机上不显示。点一下卡片，应当先跳到
       <code>${origin}/go/&lt;slug&gt;</code>，再由 302 转到对应厂商。</p>
    <pre>&lt;script src="${origin}/embed/float.js" data-aff-float async&gt;&lt;/script&gt;</pre>
    <p class="tip">可以加这些属性：<code>data-position="left"</code>、<code>data-delay="0"</code>、
       <code>data-dismiss-days="7"</code>、<code>data-offer="tencent-99"</code>、<code>data-lang="en"</code>。</p>
  </div>
  <script src="${origin}/embed/float.js" data-aff-float async></script>
</body>
</html>`,
    200,
    { "Cache-Control": "no-store" },
  );
});

export default app;
