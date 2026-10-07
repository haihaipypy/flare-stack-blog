import type { AppTheme } from "@/components/common/theme-provider";

/**
 * Mermaid `themeVariables` for the `base` theme, taken from the design tokens in
 * effect on the diagram's element, so diagrams follow the site colours and the
 * light or dark theme.
 */

/** Which theme's design tokens the diagram should read from the DOM. */
export type MermaidTokenVariant = "fuwari" | "default";

interface TokenSet {
  /**
   * `true` when the token holds a ready-to-use colour (fuwari's oklch values),
   * `false` when it holds a bare `hsl()` triplet that needs wrapping.
   */
  raw: boolean;
  /** Token used as the diagram background, also the compositing base. */
  background: string;
  /** Mermaid theme variable name -> CSS custom property. */
  colors: Record<string, string>;
}

const FUWARI_TOKENS: TokenSet = {
  raw: true,
  background: "--fuwari-code-bg",
  colors: {
    primaryColor: "--fuwari-btn-regular-bg",
    primaryTextColor: "--fuwari-fg",
    primaryBorderColor: "--fuwari-primary",
    secondaryColor: "--fuwari-selection-bg",
    tertiaryColor: "--fuwari-page-bg",
    lineColor: "--fuwari-btn-content",
    // Edge labels sit on the diagram background instead of a derived block.
    edgeLabelBackground: "--fuwari-code-bg",
    textColor: "--fuwari-fg",
    noteBkgColor: "--fuwari-warning-bg",
    noteBorderColor: "--fuwari-warning",
    noteTextColor: "--fuwari-fg",
    errorBkgColor: "--fuwari-danger-bg",
    errorTextColor: "--fuwari-danger-fg",
  },
};

const DEFAULT_TOKENS: TokenSet = {
  raw: false,
  background: "--background",
  colors: {
    primaryColor: "--muted",
    primaryTextColor: "--foreground",
    primaryBorderColor: "--border",
    secondaryColor: "--accent",
    tertiaryColor: "--background",
    lineColor: "--muted-foreground",
    edgeLabelBackground: "--background",
    textColor: "--foreground",
    noteBkgColor: "--warning",
    noteBorderColor: "--warning",
    noteTextColor: "--foreground",
    errorBkgColor: "--destructive",
    errorTextColor: "--destructive-foreground",
  },
};

const TOKEN_SETS: Record<MermaidTokenVariant, TokenSet> = {
  fuwari: FUWARI_TOKENS,
  default: DEFAULT_TOKENS,
};

export function mermaidThemeVariables(
  element: Element | null,
  theme: AppTheme,
  variant: MermaidTokenVariant = "fuwari",
): Record<string, string | boolean> {
  const variables: Record<string, string | boolean> = {
    darkMode: theme === "dark",
  };
  if (!element) return variables;

  const tokens = TOKEN_SETS[variant];
  const style = getComputedStyle(element);
  if (style.fontFamily) variables.fontFamily = style.fontFamily;

  const read = (token: string) => {
    const value = style.getPropertyValue(token).trim();
    if (!value) return null;
    return tokens.raw ? value : `hsl(${value})`;
  };

  const toHex = colorConverter(read(tokens.background) ?? "");
  if (!toHex) return variables;

  for (const [name, token] of Object.entries(tokens.colors)) {
    const value = read(token);
    if (value) variables[name] = toHex(value);
  }
  return variables;
}

/**
 * Mermaid derives shades from these colours with a parser that only knows hex,
 * rgb and hsl, while the site tokens are oklch and partly transparent. The
 * canvas resolves any CSS colour, composited over the diagram background, to
 * an opaque hex value. Returns `null` where no canvas is available.
 */
function colorConverter(background: string) {
  if (typeof OffscreenCanvas === "undefined") return null;
  const context = new OffscreenCanvas(1, 1).getContext("2d", {
    willReadFrequently: true,
  });
  if (!context) return null;

  return (color: string) => {
    context.clearRect(0, 0, 1, 1);
    context.fillStyle = background || "#fff";
    context.fillRect(0, 0, 1, 1);
    context.fillStyle = color;
    context.fillRect(0, 0, 1, 1);
    const [r, g, b] = context.getImageData(0, 0, 1, 1).data;
    return `#${[r, g, b].map((n) => n.toString(16).padStart(2, "0")).join("")}`;
  };
}
