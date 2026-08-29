import type { ToolsPageProps } from "@/features/theme/contract/pages";

export function ToolsPage({ title, description, content }: ToolsPageProps & { title: string; description: string; content: string }) {
  return (
    <div className="w-full max-w-6xl mx-auto pb-20 px-6 md:px-4">
      <div className="min-h-[400px]">
        {content && content.trim() !== "" ? (
          <div className="p-8 prose prose-sm max-w-none">
            <div dangerouslySetInnerHTML={{ __html: content }} />
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
