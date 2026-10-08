import { describe, expect, it } from "vitest";
import { AVATAR_PICKER_BATCH_SIZE, buildAvatarSeedBatch } from "./avatar.batch";

describe("buildAvatarSeedBatch", () => {
  it("同一 base 产出完全一致的批次（SSR 安全的前提）", () => {
    expect(buildAvatarSeedBatch("user@example.com#0")).toEqual(
      buildAvatarSeedBatch("user@example.com#0"),
    );
  });

  it("不同 base 产出不同批次", () => {
    expect(buildAvatarSeedBatch("user@example.com#0")).not.toEqual(
      buildAvatarSeedBatch("user@example.com#1"),
    );
  });

  it("默认长度等于选择器一屏数量", () => {
    expect(buildAvatarSeedBatch("x")).toHaveLength(AVATAR_PICKER_BATCH_SIZE);
  });

  it("可指定长度，且能生成空批次", () => {
    expect(buildAvatarSeedBatch("x", 5)).toHaveLength(5);
    expect(buildAvatarSeedBatch("x", 0)).toHaveLength(0);
    expect(buildAvatarSeedBatch("x", -3)).toHaveLength(0);
  });

  it("批次内 seed 互不重复", () => {
    const batch = buildAvatarSeedBatch("user@example.com#0", 60);
    expect(new Set(batch).size).toBe(batch.length);
  });

  it("seed 只含安全字符，可直接进 URL", () => {
    for (const seed of buildAvatarSeedBatch("base", 40)) {
      expect(seed).toMatch(/^[a-z2-9]{8}$/);
      expect(encodeURIComponent(seed)).toBe(seed);
    }
  });
});
