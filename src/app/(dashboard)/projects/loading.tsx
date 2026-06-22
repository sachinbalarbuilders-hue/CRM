import { Card, CardHeader, CardContent } from "@/components/ui/card";

export default function ProjectsLoading() {
  return (
    <div className="flex flex-col gap-4 animate-pulse p-4 md:p-6 w-full max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="h-8 w-48 bg-muted rounded" />
        <div className="h-10 w-32 bg-muted rounded-md" />
      </div>
      <div className="h-4 w-96 bg-muted rounded" />
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i}>
            <div className="h-48 w-full bg-muted/50 rounded-t-xl" />
            <CardHeader className="pb-2">
              <div className="h-5 w-3/4 bg-muted rounded" />
              <div className="h-4 w-1/2 bg-muted rounded mt-2" />
            </CardHeader>
            <CardContent>
              <div className="h-4 w-full bg-muted rounded" />
              <div className="flex gap-2 mt-4">
                <div className="h-9 flex-1 bg-muted rounded-md" />
                <div className="h-9 w-12 bg-muted rounded-md" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
