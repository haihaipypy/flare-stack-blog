import { m } from "@/paraglide/messages";
import { ToolsPageProps } from "@/features/theme/contract/pages";

export function ToolsPage({ title, description, content }: ToolsPageProps & { title: string; description: string; content: string }) {
  return (
    <div className="w-full max-w-3xl mx-auto pb-20 px-6 md:px-0">
      {/* Header */}
      <header className="py-12 md:py-20 space-y-6">
        <h1 className="text-4xl md:text-5xl font-serif font-medium tracking-tight text-foreground">
          {title}
        </h1>
        {description && (
          <p className="max-w-xl text-base md:text-lg font-light text-muted-foreground leading-relaxed">
            {description}
          </p>
        )}
      </header>
      
      {/* Content area */}
      <div className="min-h-[400px]">
        {content.trim() !== "" ? (
          <div className="p-8 prose prose-sm max-w-none">
            {/* Using dangerouslySetInnerHTML for simplicity - in production you might want to sanitize */}
            <div
              dangerouslySetInnerHTML={{
                __html: content
              }}
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="text-muted-foreground/60 text-lg mb-4">工具页面内容区域</div>
            <div className="text-sm text-muted-foreground/40">此区域可从后台编辑和管理</div>
          </div>
        )}
      </div>
    </div>
  );
}
