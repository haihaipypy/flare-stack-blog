import type { ReactNode } from "react";
import { useTheme } from "@/components/common/theme-provider";
import { MermaidDiagram } from "./mermaid-diagram";
import type { MermaidTokenVariant } from "./mermaid-theme";

/**
 * A Mermaid code block's diagram inside a code block card, coloured for the
 * current site theme. `fallback` (the block's source) shows until the diagram
 * renders and stays on a syntax error.
 */
export function ThemedMermaidDiagram({
  source,
  fallback,
  variant = "fuwari",
}: {
  source: string;
  fallback: ReactNode;
  variant?: MermaidTokenVariant;
}) {
  const { appTheme } = useTheme();
  return (
    <MermaidDiagram
      source={source}
      theme={appTheme}
      variant={variant}
      fallback={fallback}
      className="custom-scrollbar [&>svg]:my-4"
    />
  );
}
