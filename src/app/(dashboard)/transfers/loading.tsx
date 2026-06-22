import { Card, CardHeader, CardContent } from "@/components/ui/card";

export default function TransfersLoading() {
  return (
    <div className="h-full w-full p-4 md:p-6 overflow-y-auto animate-pulse">
      <div className="flex-1 space-y-6 max-w-6xl mx-auto w-full">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 w-64 bg-muted rounded" />
            <div className="h-4 w-96 bg-muted rounded" />
          </div>
        </div>

        {/* Tabs Skeleton */}
        <div className="h-10 w-64 bg-muted rounded-md mb-4" />

        {/* Data Skeleton */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="border-border">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <div className="h-5 w-32 bg-muted rounded" />
                    <div className="h-4 w-24 bg-muted rounded" />
                  </div>
                  <div className="h-5 w-16 bg-muted rounded-full" />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="h-16 w-full bg-muted/50 rounded p-3" />
                <div className="h-9 w-full bg-muted rounded-md" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
