import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";

export default function TemplatesLoading() {
  return (
    <div className="flex-1 space-y-6 max-w-6xl mx-auto w-full p-4 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-muted rounded" />
          <div className="h-4 w-64 bg-muted rounded" />
        </div>
        <div className="h-10 w-36 bg-muted rounded-md" />
      </div>

      {/* Grid Skeleton */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="h-9 w-64 bg-muted rounded-md" />
            <div className="h-9 w-24 bg-muted rounded-md" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="border border-muted animate-pulse shadow-sm">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div className="h-5 w-32 bg-muted rounded" />
                    <div className="h-5 w-16 bg-muted rounded-full" />
                  </div>
                  <div className="h-3 w-20 bg-muted rounded mt-2" />
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="h-16 w-full bg-muted/50 rounded" />
                  <div className="flex gap-2">
                    <div className="h-4 w-12 bg-muted rounded" />
                    <div className="h-4 w-12 bg-muted rounded" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
