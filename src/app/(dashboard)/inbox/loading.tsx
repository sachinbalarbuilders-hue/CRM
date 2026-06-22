import { Skeleton } from "@/components/ui/skeleton";
import { Search } from "lucide-react";

export default function InboxLoading() {
  return (
    <div className="flex h-[calc(100vh-4rem-2rem)] w-full overflow-hidden rounded-xl border bg-background shadow animate-pulse">
      {/* Sidebar Skeleton */}
      <div className="w-80 flex-shrink-0 border-r flex flex-col bg-muted/10 h-full">
        <div className="p-4 border-b flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground/50" />
            <div className="h-9 w-full bg-muted rounded-md" />
          </div>
          <div className="h-9 w-9 bg-muted rounded-md" />
        </div>
        
        <div className="flex-1 p-3 space-y-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="flex flex-col gap-2 p-3 rounded-lg border border-transparent">
              <div className="flex items-center justify-between">
                <div className="h-4 w-24 bg-muted rounded" />
                <div className="h-3 w-12 bg-muted rounded" />
              </div>
              <div className="h-3 w-40 bg-muted rounded" />
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area Skeleton */}
      <div className="flex-1 flex flex-col bg-background relative">
        {/* Chat Header Skeleton */}
        <div className="h-16 border-b flex items-center px-6 justify-between bg-background/95">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-muted rounded-full" />
            <div className="space-y-2">
              <div className="h-4 w-32 bg-muted rounded" />
              <div className="h-3 w-24 bg-muted rounded" />
            </div>
          </div>
          <div className="flex gap-2">
            <div className="h-9 w-24 bg-muted rounded-md" />
            <div className="h-9 w-24 bg-muted rounded-md" />
          </div>
        </div>

        {/* Messages Skeleton */}
        <div className="flex-1 p-6 flex flex-col gap-6 justify-end pb-12">
          <div className="self-start flex gap-2 w-full max-w-[80%]">
            <div className="h-16 w-64 bg-muted rounded-2xl rounded-tl-sm" />
          </div>
          <div className="self-end flex gap-2 w-full max-w-[80%] justify-end">
            <div className="h-12 w-48 bg-primary/20 rounded-2xl rounded-tr-sm" />
          </div>
          <div className="self-start flex gap-2 w-full max-w-[80%]">
            <div className="h-20 w-72 bg-muted rounded-2xl rounded-tl-sm" />
          </div>
          <div className="self-end flex gap-2 w-full max-w-[80%] justify-end">
            <div className="h-16 w-56 bg-primary/20 rounded-2xl rounded-tr-sm" />
          </div>
        </div>

        {/* Message Input Skeleton */}
        <div className="p-4 bg-background border-t">
          <div className="h-12 w-full bg-muted rounded-xl" />
        </div>
      </div>
    </div>
  );
}
