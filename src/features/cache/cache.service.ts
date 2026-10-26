import type { z } from "zod";
import type { Duration } from "@/lib/duration";
import { ms } from "@/lib/duration";
import { purgeSiteCDNCache } from "@/lib/invalidate";
import { serializeKey } from "./cache.utils";
import type { CacheKey, CacheNamespace } from "./types";

/**
 * 缓存层分三级：
 *   1. isolate 内存（毫秒级，单实例内复用）
 *   2. Workers Cache API（边缘缓存，不消耗 KV 读配额）
 *   3. fetcher 回源（D1）
 *
 * KV 只承担「版本指针」这类极低频读写，业务数据不再落 KV —— 免费额度
 * 100k 读/天 很容易被每次 SSR 的 5~8 次读打满。
 */
const MEMORY_MAX_ENTRIES = 512;
/** 内存层最长存活时间，避免同一实例长时间返回旧数据 */
const MEMORY_TTL_CAP_MS = 30_000;
/** 版本指针的内存缓存时间（发布后最多延迟这么久生效） */
const VERSION_MEMORY_TTL_MS = 15_000;
/** Cache API 需要一个 http(s) 作为 key，用不可解析的伪域名 */
const EDGE_CACHE_ORIGIN = "https://internal-cache.invalid";
/** 无 TTL 时的边缘缓存时长（秒），对应 KV 的「永不过期」 */
const EDGE_DEFAULT_MAX_AGE = 31_536_000;

type MemoryEntry = { value: unknown; expiresAt: number };

const memory = new Map<string, MemoryEntry>();

function memoryGet(key: string): { hit: boolean; value?: unknown } {
  const entry = memory.get(key);
  if (!entry) return { hit: false };
  if (entry.expiresAt <= Date.now()) {
    memory.delete(key);
    return { hit: false };
  }
  // 命中即刷新插入顺序，实现近似 LRU
  memory.delete(key);
  memory.set(key, entry);
  return { hit: true, value: entry.value };
}

function memorySet(key: string, value: unknown, ttlMs: number): void {
  if (memory.size >= MEMORY_MAX_ENTRIES && !memory.has(key)) {
    const oldest = memory.keys().next().value;
    if (oldest !== undefined) memory.delete(oldest);
  }
  memory.set(key, {
    value,
    expiresAt: Date.now() + Math.min(ttlMs, MEMORY_TTL_CAP_MS),
  });
}

function memoryDelete(key: string): void {
  memory.delete(key);
}

/**
 * 是否走「内存 + Cache API」路径。
 * test 环境保持纯 KV 行为（集成测试直接断言 KV 内容）；
 * 其余环境（prod / dev）一律不把业务数据写进 KV。
 */
function edgeCacheEnabled(env: Env): boolean {
  if (env.ENVIRONMENT === "test") return false;
  return edgeCache() !== null;
}

/** workers-types 生成的 CacheStorage 未声明 `default`，这里做一次收窄 */
function edgeCache(): Cache | null {
  if (typeof caches === "undefined") return null;
  const store = caches as unknown as { default?: Cache };
  return store.default ?? null;
}

function edgeRequest(key: string): Request {
  return new Request(`${EDGE_CACHE_ORIGIN}/${encodeURIComponent(key)}`);
}

async function edgeGet(key: string): Promise<unknown | null> {
  const cache = edgeCache();
  if (!cache) return null;
  try {
    const response = await cache.match(edgeRequest(key));
    if (!response) return null;
    return await response.json();
  } catch (err) {
    console.error(
      JSON.stringify({
        message: "edge cache get failed",
        key,
        error: String(err),
      }),
    );
    return null;
  }
}

async function edgeSet(
  key: string,
  value: string,
  ttlSeconds: number,
): Promise<void> {
  const cache = edgeCache();
  if (!cache) return;
  try {
    const maxAge = ttlSeconds > 0 ? ttlSeconds : EDGE_DEFAULT_MAX_AGE;
    await cache.put(
      edgeRequest(key),
      new Response(value, {
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Cache-Control": `public, max-age=${maxAge}`,
        },
      }),
    );
  } catch (err) {
    console.error(
      JSON.stringify({
        message: "edge cache set failed",
        key,
        error: String(err),
      }),
    );
  }
}

async function edgeDelete(key: string): Promise<void> {
  const cache = edgeCache();
  if (!cache) return;
  try {
    await cache.delete(edgeRequest(key));
  } catch (err) {
    console.error(
      JSON.stringify({
        message: "edge cache delete failed",
        key,
        error: String(err),
      }),
    );
  }
}

/**
 * 缓存数据
 * @param options.ttl - 缓存时间 (秒) 默认 3600 秒 (1 小时)
 */
export async function get<T extends z.ZodTypeAny>(
  context: BaseContext & { executionCtx: ExecutionContext },
  key: CacheKey,
  schema: T,
  fetcher: () => Promise<z.infer<T>>,
  options: { ttl?: Duration } = {},
): Promise<z.infer<T>> {
  const { ttl = "1h" } = options;
  const serializedKey = serializeKey(key);
  const ttlMs = ms(ttl);

  if (edgeCacheEnabled(context.env)) {
    const cached = memoryGet(serializedKey);
    if (cached.hit) {
      const parsed = schema.safeParse(cached.value);
      if (parsed.success) return parsed.data;
      memoryDelete(serializedKey);
    }

    const edgeData = await edgeGet(serializedKey);
    if (edgeData !== null && edgeData !== undefined) {
      const parsed = schema.safeParse(edgeData);
      if (parsed.success) {
        memorySet(serializedKey, parsed.data, ttlMs);
        return parsed.data;
      }
    }
  } else {
    const kvData = await context.env.KV.get(serializedKey, "json").catch(
      (err) =>
        console.error(
          JSON.stringify({
            message: "cache get failed",
            key: serializedKey,
            error: String(err),
          }),
        ),
    );

    if (kvData !== null && kvData !== undefined) {
      const result = schema.safeParse(kvData);
      if (result.success) return result.data;
    }
  }

  const data = await fetcher();

  if (data === null || data === undefined) return data;

  context.executionCtx.waitUntil(
    set(context, key, JSON.stringify(data), { ttl }),
  );

  console.log(JSON.stringify({ message: "cache miss", key: serializedKey }));
  return data;
}

/**
 * 读取单个缓存 key (不带 fetcher 回源逻辑)
 */
export async function getRaw(
  context: BaseContext,
  key: CacheKey,
): Promise<string | null> {
  const serializedKey = serializeKey(key);

  if (edgeCacheEnabled(context.env)) {
    const cached = memoryGet(serializedKey);
    if (cached.hit && typeof cached.value === "string") return cached.value;

    const cache = edgeCache();
    if (!cache) return null;
    try {
      const response = await cache.match(edgeRequest(serializedKey));
      if (!response) return null;
      return await response.text();
    } catch (err) {
      console.error(
        JSON.stringify({
          message: "edge cache get raw failed",
          key: serializedKey,
          error: String(err),
        }),
      );
      return null;
    }
  }

  const value = await context.env.KV.get(serializedKey).catch((err) => {
    console.error(
      JSON.stringify({
        message: "cache get raw failed",
        key: serializedKey,
        error: String(err),
      }),
    );
    return null;
  });
  return value;
}

/**
 * 设置缓存数据
 * @param options.ttl - 缓存时间 (秒)，不设置则永久
 */
export async function set(
  context: BaseContext,
  key: CacheKey,
  value: string,
  options?: { ttl?: Duration },
): Promise<void> {
  const serializedKey = serializeKey(key);
  const ttlSeconds = options?.ttl ? Math.floor(ms(options.ttl) / 1000) : 0;

  if (edgeCacheEnabled(context.env)) {
    // ttl 为 0 表示「永久」，内存层仍按上限过期，避免实例常驻脏数据
    const memoryTtlMs = ttlSeconds > 0 ? ttlSeconds * 1000 : MEMORY_TTL_CAP_MS;
    try {
      memorySet(serializedKey, JSON.parse(value), memoryTtlMs);
    } catch {
      memoryDelete(serializedKey);
    }
    await edgeSet(serializedKey, value, ttlSeconds);
    return;
  }

  const putOptions = options?.ttl ? { expirationTtl: ttlSeconds } : undefined;

  await context.env.KV.put(serializedKey, value, putOptions)
    .then(() =>
      console.log(JSON.stringify({ message: "cache set", key: serializedKey })),
    )
    .catch((err) =>
      console.error(
        JSON.stringify({
          message: "cache set failed",
          key: serializedKey,
          error: String(err),
        }),
      ),
    );
}

export async function deleteKey(
  context: BaseContext,
  ...keys: Array<CacheKey>
): Promise<void> {
  const serializedKeys = keys.map(serializeKey);

  await Promise.all(
    serializedKeys.map(async (key) => {
      memoryDelete(key);
      if (edgeCacheEnabled(context.env)) {
        await edgeDelete(key);
        return;
      }
      await context.env.KV.delete(key).catch((err) =>
        console.error(
          JSON.stringify({
            message: "cache delete failed",
            key,
            error: String(err),
          }),
        ),
      );
    }),
  );
}

/**
 * 获取缓存 generation token。
 * 规范：Namespace 建议使用 "entity:scope" 格式，如 "posts:list"。
 *
 * 版本指针仍存 KV（每次发布只写 1 次），读取走 15 秒内存缓存，
 * 所以热实例上几乎不产生 KV 读。
 */
export async function getVersion(
  context: BaseContext,
  namespace: CacheNamespace,
): Promise<string> {
  const key = `ver:${namespace}`;

  if (context.env.ENVIRONMENT !== "test") {
    const cached = memoryGet(key);
    if (cached.hit && typeof cached.value === "string") {
      return normalizeVersion(key, cached.value);
    }
  }

  let generation: string | null;
  try {
    generation = await context.env.KV.get(key);
  } catch (err) {
    console.error(
      JSON.stringify({
        message: "cache get version failed",
        key,
        error: String(err),
      }),
    );
    throw err;
  }

  if (generation === null) {
    if (context.env.ENVIRONMENT !== "test") {
      memorySet(key, "v0", VERSION_MEMORY_TTL_MS);
    }
    return "v0";
  }

  const normalized = normalizeVersion(key, generation);
  if (context.env.ENVIRONMENT !== "test") {
    memorySet(key, generation, VERSION_MEMORY_TTL_MS);
  }
  return normalized;
}

function normalizeVersion(key: string, generation: string): string {
  if (generation.length === 0) {
    const error = new Error("cache generation is empty");
    console.error(
      JSON.stringify({
        message: "cache generation invalid",
        key,
        error: error.message,
      }),
    );
    throw error;
  }
  return `v${generation}`;
}

/**
 * 生成新的 cache generation，使旧 generation 的 key 全部不可达。
 */
export async function bumpVersion(
  context: BaseContext,
  namespace: CacheNamespace,
): Promise<void> {
  const key = `ver:${namespace}`;
  const generation = crypto.randomUUID();

  try {
    await context.env.KV.put(key, generation);
  } catch (err) {
    console.error(
      JSON.stringify({
        message: "cache bump version failed",
        key,
        error: String(err),
      }),
    );
    throw err;
  }

  if (context.env.ENVIRONMENT !== "test") {
    memorySet(key, generation, VERSION_MEMORY_TTL_MS);
  }

  console.log(
    JSON.stringify({
      message: "cache version bumped",
      key,
      generation,
    }),
  );
}

/**
 * 读取 versioned cache；generation pointer 不可用时直接回源。
 */
export async function getVersioned<T extends z.ZodTypeAny>(
  context: BaseContext & { executionCtx: ExecutionContext },
  namespace: CacheNamespace,
  keyForVersion: (version: string) => CacheKey,
  schema: T,
  fetcher: () => Promise<z.infer<T>>,
  options: { ttl?: Duration } = {},
): Promise<z.infer<T>> {
  let version: string;
  try {
    version = await getVersion(context, namespace);
  } catch {
    return await fetcher();
  }

  return await get(context, keyForVersion(version), schema, fetcher, options);
}

export async function invalidateSiteCache(
  context: BaseContext & { executionCtx: ExecutionContext },
) {
  const purgeTask = purgeSiteCDNCache(context.env);
  const kvTasks = [
    bumpVersion(context, "posts:list"),
    bumpVersion(context, "posts:detail"),
    bumpVersion(context, "site"),
  ];

  await Promise.all([purgeTask, ...kvTasks]);
  return { success: true };
}
