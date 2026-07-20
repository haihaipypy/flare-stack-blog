/**
 * Baidu active URL push (普通收录 API 提交).
 *
 * Pushes newly published/updated post URLs to Baidu so its crawler discovers
 * them faster than waiting for the sitemap to be crawled. This is the
 * recommended "普通收录" channel on 百度搜索资源平台.
 *
 * Docs: https://ziyuan.baidu.com/linksubmit/index
 * Endpoint: POST http://data.zz.baidu.com/urls?site=<domain>&token=<token>
 *
 * Design notes:
 * - No token configured => silently skip (so non-Baidu users are unaffected).
 * - Any failure => console.warn only. SEO push must NEVER break publishing.
 */

const BAIDU_PUSH_ENDPOINT = "http://data.zz.baidu.com/urls";

interface BaiduPushEnv {
  DOMAIN: string;
  BAIDU_PUSH_TOKEN?: string;
}

/**
 * Push a list of post URLs to Baidu.
 * Resolves to true if a push was attempted (regardless of Baidu's response),
 * false if skipped because no token was configured.
 */
export async function pushUrlsToBaidu(
  env: BaiduPushEnv,
  urls: string[],
): Promise<boolean> {
  const token = env.BAIDU_PUSH_TOKEN?.trim();
  if (!token) {
    return false;
  }

  const normalizedUrls = urls.map((u) => u.trim()).filter(Boolean);
  if (normalizedUrls.length === 0) {
    return false;
  }

  const site = env.DOMAIN;
  const endpoint = `${BAIDU_PUSH_ENDPOINT}?site=${encodeURIComponent(
    site,
  )}&token=${encodeURIComponent(token)}`;

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain",
        "User-Agent":
          "Mozilla/5.0 (compatible; FlareStackBlog/1.0; +https://${site})",
      },
      body: normalizedUrls.join("\n"),
    });

    // Baidu returns 200 with a JSON body describing success/remaining quota.
    // Non-200 or error body should be logged but must not break publishing.
    if (!response.ok) {
      const text = await response.text().catch(() => "");
      console.warn(
        JSON.stringify({
          message: "Baidu push failed",
          status: response.status,
          body: text.slice(0, 500),
        }),
      );
      return true;
    }

    const result = await response.text().catch(() => "");
    console.log(
      JSON.stringify({ message: "Baidu push ok", body: result.slice(0, 500) }),
    );
    return true;
  } catch (error) {
    console.warn(
      JSON.stringify({
        message: "Baidu push error",
        error: error instanceof Error ? error.message : String(error),
      }),
    );
    return true;
  }
}
