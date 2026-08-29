import { m } from "@/paraglide/messages";
import { ToolsPageProps } from "@/features/theme/contract/pages";

export function ToolsPage({}: ToolsPageProps) {
  return (
    <div className="w-full max-w-3xl mx-auto pb-20 px-6 md:px-0">
      {/* Header */}
      <header className="py-12 md:py-20 space-y-6">
        <h1 className="text-4xl md:text-5xl font-serif font-medium tracking-tight text-foreground">
          {m.tools_page_title()}
        </h1>
        <p className="max-w-xl text-base md:text-lg font-light text-muted-foreground leading-relaxed">
          {m.tools_page_desc()}
        </p>
      </header>
      
      {/* Editable area - ready for CMS integration */}
      <div className="min-h-[400px] border-2 border-dashed border-border rounded-lg p-8 bg-muted/20">
        <div className="text-center py-20">
          <div className="text-muted-foreground/60 text-lg mb-4">工具页面内容区域</div>
          <div className="text-sm text-muted-foreground/40">此区域可从后台编辑和管理</div>
        </div>
      </div>
    </div>
  );
}
