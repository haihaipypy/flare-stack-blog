import { describe, expect, it } from "vitest";
import app from "./avatar.route";

const get = (path: string) => app.request(path);

describe("GET /avatar/:seed", () => {
  it("返回 SVG 并带上强缓存头", async () => {
    const res = await get("/无辣");
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe(
      "image/svg+xml; charset=utf-8",
    );
    // 输出完全由 URL 决定，可以放心长期缓存
    expect(res.headers.get("Cache-Control")).toContain("immutable");
    expect(res.headers.get("X-Content-Type-Options")).toBe("nosniff");

    const body = await res.text();
    expect(body.startsWith("<svg")).toBe(true);
  });

  it("响应体在两次请求间完全一致（缓存有效性的前提）", async () => {
    const a = await (await get("/reader")).text();
    const b = await (await get("/reader")).text();
    expect(a).toBe(b);
  });

  it("不同 seed 产出不同图形", async () => {
    const a = await (await get("/alex")).text();
    const b = await (await get("/alice")).text();
    expect(a).not.toBe(b);
  });

  it("style 查询参数生效，并回写到响应头", async () => {
    const res = await get("/alex?style=identicon");
    expect(res.headers.get("X-Avatar-Style")).toBe("identicon");
  });

  it("非法 style 静默退回池内风格", async () => {
    const res = await get("/alex?style=not-a-real-style");
    expect(res.status).toBe(200);
    expect(res.headers.get("X-Avatar-Style")).not.toBe("not-a-real-style");
  });

  it("size 查询参数生效并被收敛", async () => {
    const ok = await get("/alex?size=96");
    expect(ok.headers.get("X-Avatar-Size")).toBe("96");
    expect(await ok.text()).toContain('width="96"');

    const clamped = await get("/alex?size=99999");
    expect(clamped.headers.get("X-Avatar-Size")).toBe("512");
  });

  it("非法 size 不会 500，退回默认值", async () => {
    const res = await get("/alex?size=abc");
    expect(res.status).toBe(200);
    expect(res.headers.get("X-Avatar-Size")).toBe("128");
  });

  it("中文、邮箱、域名等 seed 都能正常渲染", async () => {
    for (const seed of ["小林同学", "reader@mail.com", "blog.1day.vip"]) {
      const res = await get(`/${encodeURIComponent(seed)}`);
      expect(res.status).toBe(200);
      expect((await res.text()).startsWith("<svg")).toBe(true);
    }
  });
});
