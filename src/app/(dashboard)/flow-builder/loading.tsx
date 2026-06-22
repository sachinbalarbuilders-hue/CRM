import { Card } from "@/components/ui/card";

export default function FlowBuilderLoading() {
  return (
    <div className="flex h-[calc(100vh-4rem-2rem)] w-full overflow-hidden rounded-xl border bg-background shadow animate-pulse">
      {/* Sidebar Skeleton */}
      <div className="w-80 flex-shrink-0 border-r flex flex-col bg-muted/10 h-full p-4">
        <div className="h-6 w-32 bg-muted rounded mb-6" />
        <div className="space-y-4">
          <div className="h-20 w-full bg-muted/50 rounded-lg border border-border/50" />
          <div className="h-20 w-full bg-muted/50 rounded-lg border border-border/50" />
          <div className="h-20 w-full bg-muted/50 rounded-lg border border-border/50" />
          <div className="h-20 w-full bg-muted/50 rounded-lg border border-border/50" />
        </div>
      </div>

      {/* Main Canvas Skeleton */}
      <div className="flex-1 bg-muted/5 relative p-6">
        <div className="absolute top-4 right-4 flex gap-2">
          <div className="h-9 w-24 bg-muted rounded-md" />
          <div className="h-9 w-24 bg-muted rounded-md" />
        </div>
        
        {/* Fake nodes on canvas */}
        <div className="absolute top-1/4 left-1/3">
          <Card className="w-64 h-32 border-muted" />
        </div>
        <div className="absolute top-1/2 left-1/2">
          <Card className="w-64 h-32 border-muted" />
        </div>
      </div>
    </div>
  );
}
