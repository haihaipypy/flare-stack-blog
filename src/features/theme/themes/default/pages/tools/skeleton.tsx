export function ToolsPageSkeleton() {
  return (
    <div className="w-full max-w-3xl mx-auto pb-20 px-6 md:px-0">
      {/* Header skeleton */}
      <header className="py-12 md:py-20 space-y-6">
        <h1 className="h-12 md:h-16 w-64 bg-muted rounded animate-pulse" />
        <div className="h-6 md:h-8 w-96 bg-muted rounded animate-pulse" />
        <div className="h-4 w-full bg-muted rounded animate-pulse" />
      </header>
      
      {/* Content skeleton */}
      <div className="min-h-[400px] border-2 border-dashed border-border rounded-lg p-8 bg-muted/20">
        <div className="text-center py-20">
          <div className="h-6 w-48 bg-muted rounded animate-pulse mx-auto mb-4" />
          <div className="h-4 w-64 bg-muted rounded animate-pulse mx-auto" />
        </div>
      </div>
    </div>
  );
}
