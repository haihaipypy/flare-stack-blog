import * as CacheService from "@/features/cache/cache.service";
import type { UpdateCheckResult } from "@/features/version/version.schema";
import {
  GitHubReleaseSchema,
  UpdateCheckResultSchema,
  VERSION_CACHE_KEYS,
} from "@/features/version/version.schema";
import { ms } from "@/lib/duration";
import { serverEnv } from "@/lib/env/server.env";
import type { Result } from "@/lib/errors";
import { err, ok } from "@/lib/errors";

const GITHUB_REPO = "haihaipypy/flare-stack-blog";
const RELEASE_CACHE_TTL = "5m";
// 一次失败的检查会被记住，避免管理后台每次加载都重试同一个必然失败的请求。
const FAILURE_CACHE_TTL = "30m";
const GITHUB_REQUEST_TIMEOUT = ms("5s");

type CheckForUpdateResult = Result<
  UpdateCheckResult,
  { reason: "FETCH_FAILED" }
>;

/**
 * 检查版本更新
 * @param context
 * @param force 是否强制跳过缓存直接检查
 */
export async function checkForUpdate(
  context: BaseContext & { executionCtx: ExecutionContext },
  force = false,
): Promise<CheckForUpdateResult> {
  const fetcher = async () => {
    try {
      return await fetchLatestRelease(serverEnv(context.env).GITHUB_TOKEN);
    } catch (error) {
      // 记下失败，这样 30 分钟内后续加载不会再打一次注定失败的请求。
      context.executionCtx.waitUntil(
        CacheService.set(context, VERSION_CACHE_KEYS.recentFailure, "1", {
          ttl: FAILURE_CACHE_TTL,
        }),
      );
      throw error;
    }
  };

  try {
    let data: UpdateCheckResult;

    if (force) {
      data = await fetcher();
      context.executionCtx.waitUntil(
        CacheService.set(
          context,
          VERSION_CACHE_KEYS.updateCheck,
          JSON.stringify(data),
          { ttl: RELEASE_CACHE_TTL },
        ),
      );
    } else {
      data = await CacheService.get(
        context,
        VERSION_CACHE_KEYS.updateCheck,
        UpdateCheckResultSchema,
        async () => {
          if (
            await CacheService.getRaw(context, VERSION_CACHE_KEYS.recentFailure)
          ) {
            throw new Error("version check failed recently; refresh to retry");
          }
          return await fetcher();
        },
        { ttl: RELEASE_CACHE_TTL },
      );
    }

    return ok(data);
  } catch (error) {
    console.error(
      JSON.stringify({
        message: "version check failed",
        error: error instanceof Error ? error.message : String(error),
      }),
    );
    return err({ reason: "FETCH_FAILED" });
  }
}

/**
 * 设置了 token 时走 API（因为未认证的 GitHub API 配额是按出口 IP 共享的，
 * 同一 IP 上所有 Worker 一起抢）；没有 token，或 API 失败时，读取 release
 * 页面重定向到的标签，这条路径不占用 API 配额。
 */
export async function fetchLatestRelease(
  githubToken: string | undefined,
): Promise<UpdateCheckResult> {
  let release: { version: string; releaseUrl: string; publishedAt?: string };
  if (githubToken) {
    try {
      release = await fetchLatestReleaseFromApi(githubToken);
    } catch (error) {
      console.warn(
        JSON.stringify({
          message: "github api release lookup failed, using release page",
          error: error instanceof Error ? error.message : String(error),
        }),
      );
      release = await fetchLatestReleaseFromReleasePage();
    }
  } else {
    release = await fetchLatestReleaseFromReleasePage();
  }

  return {
    latestVersion: release.version,
    currentVersion: __APP_VERSION__,
    hasUpdate: isNewer(release.version, __APP_VERSION__),
    releaseUrl: release.releaseUrl,
    publishedAt: release.publishedAt,
    checkedAt: Date.now(),
  };
}

async function fetchLatestReleaseFromReleasePage(): Promise<{
  version: string;
  releaseUrl: string;
}> {
  const response = await fetch(
    `https://github.com/${GITHUB_REPO}/releases/latest`,
    {
      method: "HEAD",
      redirect: "manual",
      headers: { "User-Agent": "flare-stack-blog" },
      signal: AbortSignal.timeout(GITHUB_REQUEST_TIMEOUT),
    },
  );

  const location = response.headers.get("location");
  const releaseUrl = location
    ? new URL(location, "https://github.com")
    : undefined;
  const tag = releaseUrl
    ? /\/releases\/tag\/([^/]+)$/.exec(releaseUrl.pathname)?.[1]
    : undefined;
  if (!releaseUrl || !tag) {
    throw new Error(
      `GitHub release page did not redirect to a tag: ${response.status}`,
    );
  }

  return {
    version: decodeURIComponent(tag),
    releaseUrl: releaseUrl.toString(),
  };
}

async function fetchLatestReleaseFromApi(githubToken: string): Promise<{
  version: string;
  releaseUrl: string;
  publishedAt?: string;
}> {
  const headers: Record<string, string> = {
    "User-Agent": "flare-stack-blog",
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    Authorization: `Bearer ${githubToken}`,
  };

  const response = await fetch(
    `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`,
    { headers, signal: AbortSignal.timeout(GITHUB_REQUEST_TIMEOUT) },
  );

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(
      `GitHub API error: ${response.status} ${response.statusText}${body ? ` - ${body.slice(0, 500)}` : ""}`,
    );
  }

  const json = await response.json();
  const data = GitHubReleaseSchema.parse(json);

  return {
    version: data.tag_name, // 比如 "v0.6.0"
    releaseUrl: data.html_url,
    publishedAt: data.published_at,
  };
}

function isNewer(latest: string, current: string) {
  const l = latest
    .replace(/^v/, "")
    .split(".")
    .map((v) => parseInt(v, 10) || 0);
  const c = current
    .replace(/^v/, "")
    .split(".")
    .map((v) => parseInt(v, 10) || 0);

  // 长度补齐
  const length = Math.max(l.length, c.length);
  for (let i = 0; i < length; i++) {
    const lPart = l[i] || 0;
    const cPart = c[i] || 0;
    if (lPart > cPart) return true;
    if (lPart < cPart) return false;
  }
  return false;
}
