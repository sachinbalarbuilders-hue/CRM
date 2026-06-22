import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";

export default function ContactsLoading() {
  return (
    <div className="flex-1 space-y-6 max-w-5xl mx-auto w-full p-4 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 w-40 bg-muted rounded" />
          <div className="h-4 w-72 bg-muted rounded" />
        </div>
        <div className="h-10 w-32 bg-muted rounded-md" />
      </div>

      <Card>
        <CardHeader>
          <div className="h-6 w-32 bg-muted rounded mb-2" />
          <div className="h-4 w-48 bg-muted rounded" />
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead><div className="h-4 w-32 bg-muted rounded" /></TableHead>
                  <TableHead><div className="h-4 w-32 bg-muted rounded" /></TableHead>
                  <TableHead><div className="h-4 w-24 bg-muted rounded" /></TableHead>
                  <TableHead className="text-right"><div className="h-4 w-16 bg-muted rounded ml-auto" /></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <TableRow key={i}>
                    <TableCell><div className="h-4 w-48 bg-muted rounded" /></TableCell>
                    <TableCell><div className="h-4 w-32 bg-muted rounded" /></TableCell>
                    <TableCell><div className="h-4 w-24 bg-muted rounded" /></TableCell>
                    <TableCell className="text-right"><div className="h-8 w-8 bg-muted rounded-md ml-auto" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
