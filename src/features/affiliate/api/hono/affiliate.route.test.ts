import { beforeEach, describe, expect, it, vi } from "vitest";
import app from "./affiliate.route";

const get = (path: string, init?: RequestInit) => app.request(path, init);

beforeEach(() => {
  // 测试环境没有 D1，点击记录必然失败；这里屏蔽掉预期内的告警
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

describe("GET /go/:slug", () => {
  it("302 到配置里的推广链接", async () => {
    const res = await get("/aliyun-oss");
    expect(res.status).toBe(302);
    expect(res.headers.get("Location")).toContain("aliyun.com");
    expect(res.headers.get("Location")).toContain("userCode=wbeuoz6m");
  });

  it("腾讯云短链同样可达", async () => {
    const res = await get("/tencent-99");
    expect(res.status).toBe(302);
    expect(res.headers.get("Location")).toContain("cloud.tencent.com");
  });

  it("未知 slug 回首页而不是 404 白页", async () => {
    const res = await get("/not-a-real-offer");
    expect(res.status).toBe(302);
    expect(res.headers.get("Location")).toBe("/");
  });

  it("不允许被缓存，也不允许搜索引擎跟进", async () => {
    const res = await get("/aliyun-general");
    expect(res.headers.get("Cache-Control")).toBe("no-store");
    expect(res.headers.get("X-Robots-Tag")).toContain("noindex");
  });

  it("带 Referer 时不影响跳转结果", async () => {
    const res = await get("/aliyun-general", {
      headers: { referer: "https://blog.1day.vip/post/docker-note" },
    });
    expect(res.status).toBe(302);
    expect(res.headers.get("Location")).toContain("aliyun.com");
  });

  it("站外嵌入带 ?src= 时照常跳转，来源只影响记录", async () => {
    const res = await get("/tencent-99?src=other-site.cn");
    expect(res.status).toBe(302);
    expect(res.headers.get("Location")).toContain("cloud.tencent.com");
  });

  it("?src= 乱填不会导致出错", async () => {
    for (const src of ["", "a b", "%00", "x".repeat(300), "../etc/passwd"]) {
      const res = await get(`/tencent-99?src=${encodeURIComponent(src)}`);
      expect(res.status).toBe(302);
    }
  });
});
