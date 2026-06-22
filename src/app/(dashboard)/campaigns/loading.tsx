import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";

export default function CampaignsLoading() {
  return (
    <div className="flex-1 space-y-6 max-w-6xl mx-auto w-full p-4 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 w-40 bg-muted rounded" />
          <div className="h-4 w-72 bg-muted rounded" />
        </div>
        <div className="h-10 w-36 bg-muted rounded-md" />
      </div>

      {/* Table Skeleton */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-5 w-32 bg-muted rounded" />
              <div className="h-4 w-48 bg-muted rounded" />
            </div>
            <div className="flex items-center gap-2">
              <div className="h-9 w-64 bg-muted rounded-md" />
              <div className="h-9 w-24 bg-muted rounded-md" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead><div className="h-4 w-32 bg-muted rounded" /></TableHead>
                <TableHead><div className="h-4 w-20 bg-muted rounded" /></TableHead>
                <TableHead><div className="h-4 w-24 bg-muted rounded" /></TableHead>
                <TableHead><div className="h-4 w-16 bg-muted rounded" /></TableHead>
                <TableHead className="text-right"><div className="h-4 w-12 bg-muted rounded ml-auto" /></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[1, 2, 3, 4, 5].map((i) => (
                <TableRow key={i}>
                  <TableCell>
                    <div className="space-y-2">
                      <div className="h-4 w-48 bg-muted rounded" />
                      <div className="h-3 w-32 bg-muted rounded" />
                    </div>
                  </TableCell>
                  <TableCell><div className="h-6 w-20 bg-muted rounded-full" /></TableCell>
                  <TableCell>
                    <div className="space-y-2">
                      <div className="h-2 w-full bg-muted rounded-full" />
                      <div className="h-3 w-16 bg-muted rounded" />
                    </div>
                  </TableCell>
                  <TableCell><div className="h-4 w-20 bg-muted rounded" /></TableCell>
                  <TableCell className="text-right"><div className="h-8 w-8 bg-muted rounded-md ml-auto" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
