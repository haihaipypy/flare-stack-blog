import { describe, expect, it } from "vitest";
import {
  AVATAR_DEFAULT_SIZE,
  AVATAR_MAX_SIZE,
  AVATAR_MIN_SIZE,
  clampAvatarSize,
  renderAvatarSvg,
} from "./avatar.render";
import { AVATAR_STYLE_POOL, resolveAvatarStyleId } from "./avatar.styles";
import {
  ANONYMOUS_AVATAR_SEED,
  avatarSeedForFriendLink,
  avatarSeedForUser,
  buildAvatarUrl,
  isGeneratedAvatarUrl,
  MAX_AVATAR_SEED_LENGTH,
  normalizeAvatarSeed,
} from "./avatar.url";

describe("normalizeAvatarSeed", () => {
  it("空值退回匿名 seed", () => {
    expect(normalizeAvatarSeed(null)).toBe(ANONYMOUS_AVATAR_SEED);
    expect(normalizeAvatarSeed(undefined)).toBe(ANONYMOUS_AVATAR_SEED);
    expect(normalizeAvatarSeed("")).toBe(ANONYMOUS_AVATAR_SEED);
    expect(normalizeAvatarSeed("   ")).toBe(ANONYMOUS_AVATAR_SEED);
  });

  it("去掉首尾空白与控制字符", () => {
    expect(normalizeAvatarSeed("  无辣  ")).toBe("无辣");
    expect(normalizeAvatarSeed("a\u0000b\u001fc")).toBe("abc");
  });

  it("超长 seed 被截断", () => {
    const long = "x".repeat(MAX_AVATAR_SEED_LENGTH + 50);
    expect(normalizeAvatarSeed(long)).toHaveLength(MAX_AVATAR_SEED_LENGTH);
  });
});

describe("resolveAvatarStyleId", () => {
  it("同 seed 永远落到同一风格", () => {
    expect(resolveAvatarStyleId("无辣")).toBe(resolveAvatarStyleId("无辣"));
    expect(resolveAvatarStyleId("reader@mail.com")).toBe(
      resolveAvatarStyleId("reader@mail.com"),
    );
  });

  it("结果一定落在风格池内", () => {
    const ids = new Set(AVATAR_STYLE_POOL.map((s) => s.id));
    for (let i = 0; i < 200; i++) {
      expect(ids.has(resolveAvatarStyleId(`seed-${i}`))).toBe(true);
    }
  });

  it("不同 seed 会分散到多个风格（随机感）", () => {
    const seen = new Set<string>();
    for (let i = 0; i < 200; i++) {
      seen.add(resolveAvatarStyleId(`user-${i}`));
    }
    // 池子有 12 个风格，200 个 seed 至少应覆盖到 8 个以上
    expect(seen.size).toBeGreaterThan(7);
  });

  it("中文与英文 seed 都能正常分配", () => {
    expect(resolveAvatarStyleId("无辣")).toBeTruthy();
    expect(resolveAvatarStyleId("haihaipypy")).toBeTruthy();
  });
});

describe("buildAvatarUrl", () => {
  it("对中文 seed 做 URL 编码", () => {
    expect(buildAvatarUrl("无辣")).toBe(
      `/avatar/${encodeURIComponent("无辣")}`,
    );
  });

  it("空 seed 退回匿名", () => {
    expect(buildAvatarUrl("")).toBe(`/avatar/${ANONYMOUS_AVATAR_SEED}`);
  });

  it("带上 size 与 style 查询参数", () => {
    expect(buildAvatarUrl("alex", { size: 96, style: "shapes" })).toBe(
      "/avatar/alex?size=96&style=shapes",
    );
  });

  it("产出以 / 开头，可通过资料表单校验", () => {
    expect(buildAvatarUrl("无辣").startsWith("/")).toBe(true);
  });

  it("isGeneratedAvatarUrl 只认自己的路由", () => {
    expect(isGeneratedAvatarUrl("/avatar/alex")).toBe(true);
    expect(isGeneratedAvatarUrl("https://example.com/a.png")).toBe(false);
    expect(isGeneratedAvatarUrl(null)).toBe(false);
  });
});

describe("avatarSeedForUser", () => {
  it("优先用显示名", () => {
    expect(avatarSeedForUser({ id: "u1", name: "无辣" })).toBe("无辣");
  });

  it("没有名字时退回 id", () => {
    expect(avatarSeedForUser({ id: "u1", name: null })).toBe("u1");
    expect(avatarSeedForUser({ id: "u1", name: "  " })).toBe("u1");
  });

  it("都没有时退回匿名", () => {
    expect(avatarSeedForUser(null)).toBe(ANONYMOUS_AVATAR_SEED);
    expect(avatarSeedForUser({ id: null, name: null })).toBe(
      ANONYMOUS_AVATAR_SEED,
    );
  });
});

describe("avatarSeedForFriendLink", () => {
  it("优先用域名（并去掉 www.）", () => {
    expect(
      avatarSeedForFriendLink({ siteUrl: "https://www.example.com/blog" }),
    ).toBe("example.com");
    expect(avatarSeedForFriendLink({ siteUrl: "https://foo.dev" })).toBe(
      "foo.dev",
    );
  });

  it("URL 非法时退回站点名", () => {
    expect(
      avatarSeedForFriendLink({ siteUrl: "not-a-url", siteName: "某站" }),
    ).toBe("某站");
  });

  it("都没有时退回用户信息", () => {
    expect(
      avatarSeedForFriendLink({
        siteUrl: null,
        siteName: null,
        user: { id: "u9", name: "站主" },
      }),
    ).toBe("站主");
    expect(avatarSeedForFriendLink({})).toBe(ANONYMOUS_AVATAR_SEED);
  });
});

describe("clampAvatarSize", () => {
  it("缺省时用默认尺寸", () => {
    expect(clampAvatarSize(null)).toBe(AVATAR_DEFAULT_SIZE);
    expect(clampAvatarSize(undefined)).toBe(AVATAR_DEFAULT_SIZE);
    expect(clampAvatarSize(Number.NaN)).toBe(AVATAR_DEFAULT_SIZE);
  });

  it("超出范围时收敛到边界", () => {
    expect(clampAvatarSize(1)).toBe(AVATAR_MIN_SIZE);
    expect(clampAvatarSize(99999)).toBe(AVATAR_MAX_SIZE);
    expect(clampAvatarSize(96)).toBe(96);
  });
});

describe("renderAvatarSvg", () => {
  it("产出合法 SVG", async () => {
    const { svg } = await renderAvatarSvg({ seed: "无辣" });
    expect(svg.startsWith("<svg")).toBe(true);
    expect(svg).toContain("</svg>");
  });

  it("同一输入产出完全一致的 SVG（可缓存的前提）", async () => {
    const a = await renderAvatarSvg({ seed: "reader@mail.com" });
    const b = await renderAvatarSvg({ seed: "reader@mail.com" });
    expect(a.svg).toBe(b.svg);
    expect(a.styleId).toBe(b.styleId);
  });

  it("指定 style 时按指定风格渲染", async () => {
    const { svg, styleId } = await renderAvatarSvg({
      seed: "alex",
      style: "identicon",
    });
    expect(styleId).toBe("identicon");
    expect(svg).toContain("</svg>");
  });

  it("非法 style 静默退回默认风格", async () => {
    const { styleId } = await renderAvatarSvg({
      seed: "alex",
      style: "definitely-not-a-style",
    });
    expect(AVATAR_STYLE_POOL.some((s) => s.id === styleId)).toBe(true);
  });

  it("size 会写入 SVG 尺寸并被收敛", async () => {
    const { svg } = await renderAvatarSvg({ seed: "alex", size: 96 });
    expect(svg).toContain('width="96"');
    expect(svg).toContain('height="96"');

    const clamped = await renderAvatarSvg({ seed: "alex", size: 99999 });
    expect(clamped.size).toBe(AVATAR_MAX_SIZE);
  });

  it("不同 seed 产出不同 SVG", async () => {
    const a = await renderAvatarSvg({ seed: "alex" });
    const b = await renderAvatarSvg({ seed: "alice" });
    expect(a.svg).not.toBe(b.svg);
  });
});
