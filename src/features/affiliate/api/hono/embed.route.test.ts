import { describe, expect, it } from "vitest";
import app from "./embed.route";

const get = (path: string) => app.request(path);

describe("GET /embed/float.js", () => {
  it("以 JS 返回，允许站外引用", async () => {
    const res = await get("/float.js");
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("javascript");
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe("*");
    expect(res.headers.get("X-Content-Type-Options")).toBe("nosniff");
  });

  it("带 CORP 头，宿主站 COEP: require-corp 下也不会被拦", async () => {
    const res = await get("/float.js");
    expect(res.headers.get("Cross-Origin-Resource-Policy")).toBe("cross-origin");
  });

  it("缓存 5 分钟，改完链接能较快生效", async () => {
    const res = await get("/float.js");
    expect(res.headers.get("Cache-Control")).toContain("max-age=300");
  });

  it("脚本里的回流地址取自请求 origin", async () => {
    const body = await (await get("/float.js")).text();
    expect(body).toContain("http://localhost");
    expect(body).toContain("/go/");
  });
});

describe("GET /embed/float", () => {
  it("预览页可以直接打开，且不缓存", async () => {
    const res = await get("/float");
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("text/html");
    expect(res.headers.get("Cache-Control")).toBe("no-store");
    expect(res.headers.get("Cross-Origin-Resource-Policy")).toBe("cross-origin");
    const html = await res.text();
    expect(html).toContain("data-aff-float");
    expect(html).toContain("/embed/float.js");
  });
});
