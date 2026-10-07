import type { HighlighterCore } from "shiki/core";
import { createHighlighterCore } from "shiki/core";
import { createJavaScriptRegexEngine } from "shiki/engine/javascript";
import viteDark from "shiki/themes/vitesse-dark.mjs";
import viteLight from "shiki/themes/vitesse-light.mjs";
import { PLAIN_TEXT, resolveCodeLanguage } from "@/lib/code-languages";

// 语法加载器、别名解析统一由 @/lib/code-languages 提供，这里不再各存一份，
// 避免"选择器有的语言高亮不了 / 高亮有的语言选择器没有"这类漂移。

export const themes = {
  light: "vitesse-light",
  dark: "vitesse-dark",
} as const;

let highlighterPromise: Promise<HighlighterCore> | null = null;

export async function getHighlighter() {
  if (!highlighterPromise) {
    // Customizing the background color of vitesse-dark to remove the greenish tint
    // using Zinc-900 (#18181b) to match the dark mode UI
    const customViteDark = {
      ...viteDark,
      bg: "#18181b",
      name: "vitesse-dark", // Ensure name matches
    };

    highlighterPromise = createHighlighterCore({
      themes: [customViteDark, viteLight],
      langs: [],
      engine: createJavaScriptRegexEngine(),
    });
  }
  return highlighterPromise;
}

/**
 * 懒加载某个代码块语言的语法。返回解析后的 Shiki 语言 id，无法解析（不支持
 * 或空字符串）时返回 undefined，调用方按纯文本处理。
 */
export async function loadLanguage(lang: string) {
  const language = resolveCodeLanguage(lang);
  if (!language) return undefined;

  const highlighter = await getHighlighter();
  if (!highlighter.getLoadedLanguages().includes(language.id)) {
    const langModule = await language.load();
    await highlighter.loadLanguage(...langModule.default);
  }
  return language.id;
}

export async function highlight(code: string, lang: string) {
  const safeLang = (await loadLanguage(lang)) ?? PLAIN_TEXT;

  const highlighter = await getHighlighter();

  try {
    return highlighter.codeToHtml(code, {
      lang: safeLang,
      themes: {
        dark: themes.dark,
        light: themes.light,
      },
    });
  } catch (e) {
    console.warn(`Failed to highlight language: ${lang}`, e);
    return `<pre><code>${code}</code></pre>`;
  }
}

/**
 * Get tokens for ProseMirror decorations with dual-theme support.
 * Loads the language lazily if not already loaded.
 */
export async function codeToTokens(code: string, lang: string) {
  const safeLang = (await loadLanguage(lang)) ?? PLAIN_TEXT;
  const highlighter = await getHighlighter();

  return highlighter.codeToTokens(code, {
    lang: safeLang,
    themes: {
      light: themes.light,
      dark: themes.dark,
    },
  });
}
