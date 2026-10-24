import { Check, Copy, ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AffiliateAdminText } from "./text";

interface EmbedSectionProps {
  enabled: boolean;
  t: AffiliateAdminText;
}

const PARAMS = [
  { attr: 'data-position="left"', desc: "左下角（右下有客服/回顶按钮时用）" },
  { attr: 'data-delay="0"', desc: "延迟出现，默认 1500ms" },
  { attr: 'data-dismiss-days="7"', desc: "关闭后多少天内不再出现，默认 3" },
  { attr: 'data-offer="tencent-99"', desc: "强制指定某一条，不再自动挑" },
  { attr: 'data-lang="en"', desc: "英文文案；不填则跟随宿主页 html lang" },
];

export function EmbedSection({ enabled, t }: EmbedSectionProps) {
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const snippet = `<script src="${origin}/embed/float.js" data-aff-float async></script>`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(snippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // 剪贴板被拒（非 https 或权限不足）时退回选中文本
      const input = document.createElement("textarea");
      input.value = snippet;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  };

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <h2 className="text-xl font-serif font-medium tracking-tight">
          {t.embedTitle}
        </h2>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
          {t.embedDesc}
        </p>
      </header>

      <div
        className={cn(
          "flex flex-wrap items-center justify-between gap-3 border px-4 py-3",
          enabled
            ? "border-border/50 bg-muted/20"
            : "border-border/30 bg-transparent",
        )}
      >
        <span
          className={cn(
            "font-mono text-[10px] uppercase tracking-[0.15em]",
            enabled ? "text-foreground" : "text-muted-foreground",
          )}
        >
          {enabled ? t.embedStatusOn : t.embedStatusOff}
        </span>

        <Button
          type="button"
          variant="outline"
          onClick={() => window.open("/embed/float", "_blank")}
          className="h-8 rounded-none px-3 font-mono text-[10px] uppercase tracking-[0.12em]"
        >
          <ExternalLink size={12} className="mr-2" />
          {t.embedPreview}
        </Button>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            {t.embedCode}
          </span>
          <button
            type="button"
            onClick={copy}
            className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground transition-colors hover:text-foreground"
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
            {copied ? t.embedCopied : t.embedCopy}
          </button>
        </div>

        <pre className="overflow-x-auto border border-border/40 bg-muted/25 p-4 font-mono text-[11px] leading-relaxed text-foreground">
          {snippet}
        </pre>
      </div>

      <div className="space-y-2">
        <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          {t.embedWhereTitle}
        </h3>
        <p className="text-xs leading-relaxed text-muted-foreground">
          {t.embedWhere}
        </p>
      </div>

      <div className="space-y-2">
        <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          {t.embedParamsTitle}
        </h3>
        <div className="divide-y divide-border/25 border border-border/35">
          {PARAMS.map((param) => (
            <div
              key={param.attr}
              className="flex flex-col gap-1 px-4 py-2.5 text-xs sm:flex-row sm:items-center sm:gap-4"
            >
              <code className="shrink-0 font-mono text-[11px] text-foreground">
                {param.attr}
              </code>
              <span className="text-muted-foreground">{param.desc}</span>
            </div>
          ))}
        </div>
      </div>

      <p className="border-l-2 border-border/60 pl-3 text-xs leading-relaxed text-muted-foreground">
        {t.embedNote}
      </p>
    </section>
  );
}
