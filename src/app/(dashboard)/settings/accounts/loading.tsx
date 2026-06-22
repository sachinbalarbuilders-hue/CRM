import { Card, CardHeader, CardContent } from "@/components/ui/card";

export default function AccountsSettingsLoading() {
  return (
    <div className="flex-1 space-y-6 max-w-5xl mx-auto w-full p-4 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 w-64 bg-muted rounded" />
          <div className="h-4 w-96 bg-muted rounded" />
        </div>
        <div className="h-10 w-32 bg-muted rounded-md" />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {[1, 2].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-muted rounded-md" />
                  <div className="space-y-2">
                    <div className="h-5 w-32 bg-muted rounded" />
                    <div className="h-4 w-24 bg-muted rounded" />
                  </div>
                </div>
                <div className="h-6 w-16 bg-muted rounded-full" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 pt-4 border-t">
                <div className="space-y-2">
                  <div className="h-3 w-16 bg-muted rounded" />
                  <div className="h-4 w-48 bg-muted rounded" />
                </div>
                <div className="space-y-2">
                  <div className="h-3 w-16 bg-muted rounded" />
                  <div className="h-4 w-32 bg-muted rounded" />
                </div>
                <div className="flex justify-end pt-2">
                  <div className="h-9 w-24 bg-muted rounded-md" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
