import { describe, expect, it } from "vitest";
import {
  CODE_LANGUAGES,
  MERMAID,
  PLAIN_TEXT,
  isMermaidLanguage,
  isPlainTextLanguage,
  resolveCodeLanguage,
} from "./code-languages";

describe("isPlainTextLanguage", () => {
  it.each([PLAIN_TEXT, "txt", "plaintext", "TXT", " Text ", "", null])(
    "treats %j as plain text",
    (name) => {
      expect(isPlainTextLanguage(name)).toBe(true);
    },
  );

  it.each(["ts", "typescript", "not-a-language"])(
    "does not treat %j as plain text",
    (name) => {
      expect(isPlainTextLanguage(name)).toBe(false);
    },
  );
});

describe("resolveCodeLanguage", () => {
  it("resolves a grammar id, ignoring case and surrounding spaces", () => {
    expect(resolveCodeLanguage("TypeScript")?.id).toBe("typescript");
    expect(resolveCodeLanguage("  python  ")?.id).toBe("python");
  });

  it("resolves aliases to their language", () => {
    expect(resolveCodeLanguage("ts")?.id).toBe("typescript");
    expect(resolveCodeLanguage("yml")?.id).toBe("yaml");
    expect(resolveCodeLanguage("bash")?.id).toBe("shell");
    expect(resolveCodeLanguage("cmd")?.id).toBe("bat");
    expect(resolveCodeLanguage("objc")?.id).toBe("objective-c");
  });

  it("returns undefined for unsupported or empty languages", () => {
    expect(resolveCodeLanguage("not-a-language")).toBeUndefined();
    expect(resolveCodeLanguage("")).toBeUndefined();
    expect(resolveCodeLanguage(null)).toBeUndefined();
  });
});

describe("isMermaidLanguage", () => {
  it("matches mermaid however it is spelled", () => {
    expect(isMermaidLanguage("mermaid")).toBe(true);
    expect(isMermaidLanguage(" Mermaid ")).toBe(true);
    expect(isMermaidLanguage("typescript")).toBe(false);
  });
});

describe("CODE_LANGUAGES registry", () => {
  it("has no duplicate ids or aliases with conflicting owners", () => {
    const seen = new Map<string, string>();
    for (const language of CODE_LANGUAGES) {
      for (const name of [language.id, ...language.aliases]) {
        const owner = seen.get(name);
        expect(
          owner === undefined || owner === language.id,
          `${name} is claimed by both ${owner} and ${language.id}`,
        ).toBe(true);
        seen.set(name, language.id);
      }
    }
  });

  it("ships every lazy loader as a function", () => {
    for (const language of CODE_LANGUAGES) {
      expect(typeof language.load).toBe("function");
    }
  });

  it("supports 33 more languages on top of the original set", () => {
    const ids = new Set(CODE_LANGUAGES.map((language) => language.id));
    for (const id of [
      "vue",
      "svelte",
      "astro",
      "scss",
      "less",
      "diff",
      "toml",
      "ini",
      "powershell",
      "bat",
      "nginx",
      "apache",
      "graphql",
      "proto",
      "make",
      "cmake",
      "lua",
      "dart",
      "scala",
      "haskell",
      "r",
      "elixir",
      "erlang",
      "zig",
      "nix",
      "latex",
      "viml",
      "groovy",
      "objective-c",
      "perl",
      "matlab",
      "solidity",
      "prisma",
    ]) {
      expect(ids.has(id), `missing ${id}`).toBe(true);
    }
  });

  it("keeps mermaid in the registry for the diagram renderer", () => {
    expect(resolveCodeLanguage(MERMAID)?.label).toBe("Mermaid");
  });
});
