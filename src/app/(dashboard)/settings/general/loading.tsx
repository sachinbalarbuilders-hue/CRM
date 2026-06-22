import { Card, CardHeader, CardContent } from "@/components/ui/card";

export default function GeneralSettingsLoading() {
  return (
    <div className="flex-1 space-y-6 max-w-4xl mx-auto w-full p-4 animate-pulse">
      <div className="space-y-2">
        <div className="h-8 w-48 bg-muted rounded" />
        <div className="h-4 w-96 bg-muted rounded" />
      </div>

      <Card>
        <CardHeader>
          <div className="h-6 w-32 bg-muted rounded mb-2" />
          <div className="h-4 w-64 bg-muted rounded" />
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <div className="h-4 w-24 bg-muted rounded" />
            <div className="h-10 w-full bg-muted rounded-md" />
            <div className="h-3 w-64 bg-muted rounded" />
          </div>
          <div className="space-y-2">
            <div className="h-4 w-24 bg-muted rounded" />
            <div className="h-10 w-full bg-muted rounded-md" />
          </div>
          <div className="pt-4 border-t">
            <div className="h-10 w-32 bg-muted rounded-md" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
