import { isNotInProduction, serverEnv } from "@/lib/env/server.env";

interface PurgeOptions {
  urls?: Array<string>; // 精确匹配的URL
  // 清空整个 zone 的缓存。
  // 注意：Cloudflare 的「按前缀 / 按主机 / 按标签」清除仅企业版（Enterprise）可用，
  // 免费与 Pro 计划一旦提交 prefixes，整条 purge 请求会被拒绝（连同一请求里的 files
  // 也一起失效），因此这里只提供全计划可用的两种方式：按 URL 清除、Purge Everything。
  purgeEverything?: boolean;
}

interface CloudflareApiMessage {
  code?: number;
  message?: string;
}

// Cloudflare purge response envelope:
// https://developers.cloudflare.com/api/resources/cache/subresources/cache/methods/purge/
interface CloudflarePurgeResponse {
  success?: boolean;
  errors?: Array<CloudflareApiMessage>;
}

export async function purgeCDNCache(env: Env, options: PurgeOptions) {
  const { CLOUDFLARE_ZONE_ID, CLOUDFLARE_PURGE_API_TOKEN, DOMAIN, CDN_DOMAIN } =
    serverEnv(env);

  if (isNotInProduction(env)) {
    console.log(
      JSON.stringify({ message: "cdn cache purge skipped in development" }),
    );
    return;
  }

  const domain = CDN_DOMAIN ?? DOMAIN;
  const baseUrl = `https://${domain}`;

  const payload: { files?: Array<string>; purge_everything?: boolean } = {};

  if (options.purgeEverything) {
    payload.purge_everything = true;
  } else if (options.urls && options.urls.length > 0) {
    payload.files = options.urls.flatMap((path) => {
      const fullPath = `${baseUrl}${path.startsWith("/") ? path : "/" + path}`;
      if (path === "/" || path === "") return [`${baseUrl}/`];
      return [fullPath, `${fullPath}/`];
    });
  }

  if (!payload.files && !payload.purge_everything) return;

  const response = await fetch(
    `https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/purge_cache`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${CLOUDFLARE_PURGE_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
  );

  const responseText = await response.text();
  let responseData: CloudflarePurgeResponse | null = null;

  if (responseText) {
    try {
      responseData = JSON.parse(responseText) as CloudflarePurgeResponse;
    } catch {
      responseData = null;
    }
  }

  const apiErrorMessage =
    responseData?.errors
      ?.map((error) => error.message?.trim())
      .filter(Boolean)
      .join("; ") || responseText;

  if (!response.ok || responseData?.success === false) {
    console.error(
      JSON.stringify({
        message: "cloudflare purge api failed",
        status: response.status,
        error: apiErrorMessage,
        success: responseData?.success,
      }),
    );
    throw new Error(`Cloudflare Purge API failed: ${apiErrorMessage}`);
  }
}

export async function purgePostCDNCache(env: Env, slug: string) {
  return purgeCDNCache(env, {
    // 原先用 prefixes 清列表页与搜索页，但「按前缀清除」仅企业版可用：
    // 免费/Pro 计划提交 prefixes 会让整条请求被拒，连带 files 一起失效。
    // 因此这里全部改为按 URL 精确清除（全计划可用）。
    urls: [
      "/", // 首页
      "/posts", // 列表页面
      "/search", // 搜索页面
      "/api/tags", // 标签 API
      "/api/posts", // 列表 API（复数）
      "/api/search", // 搜索 API
      `/post/${slug}`, // 文章页面
      `/api/post/${slug}`, // 单篇 API（单数）
      `/api/post/${slug}/related`, // 相关文章 API
    ],
  });
}

export async function purgeSiteCDNCache(env: Env) {
  // 站点级变更需要清空全站缓存：按前缀清除仅企业版可用，改用 Purge Everything。
  return purgeCDNCache(env, {
    purgeEverything: true,
  });
}
