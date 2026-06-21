"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Filter, MoreHorizontal, Edit, Trash, Eye, Loader2, RefreshCw } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { deleteTemplate, syncTemplatesFromMeta } from "./actions";
import { toast } from "sonner";
import { format } from "date-fns";

export function TemplatesClient({ templates, organizationId, accounts }: { templates: any[], organizationId: string, accounts?: any[] }) {
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncAccountId, setSyncAccountId] = useState(accounts && accounts.length > 0 ? accounts[0].id : "");

  const filteredTemplates = templates.filter((t) =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSync = async () => {
    if (!syncAccountId) {
      toast.error("Please select a WhatsApp account to sync from.");
      return;
    }
    setIsSyncing(true);
    try {
      await syncTemplatesFromMeta(syncAccountId);
      toast.success("Templates synced with Meta successfully!");
      window.location.reload();
    } catch (e: any) {
      toast.error(e.message || "Failed to sync templates");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this template?")) return;
    setIsDeleting(id);
    try {
      await deleteTemplate(id);
      toast.success("Template deleted successfully");
    } catch (e) {
      toast.error("Failed to delete template");
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <div className="flex-1 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">WhatsApp Templates</h2>
          <p className="text-muted-foreground">
            Manage and submit your WhatsApp message templates for Meta approval.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {accounts && accounts.length > 0 && (
            <Select value={syncAccountId} onValueChange={setSyncAccountId}>
              <SelectTrigger className="w-[200px]">
                <span className="truncate">{accounts?.find(a => a.id === syncAccountId)?.name || "Select account"}</span>
              </SelectTrigger>
              <SelectContent>
                {accounts.map(acc => (
                  <SelectItem key={acc.id} value={acc.id}>{acc.name} ({acc.wabaId})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Button variant="outline" onClick={handleSync} disabled={isSyncing || !syncAccountId}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isSyncing ? "animate-spin" : ""}`} /> 
            {isSyncing ? "Syncing..." : "Sync from Meta"}
          </Button>
          <Link href="/templates/new">
            <Button className="bg-green-600 hover:bg-green-700 text-white">
              <Plus className="mr-2 h-4 w-4" /> Create Template
            </Button>
          </Link>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-1 items-center gap-2 max-w-sm">
          <div className="relative w-full">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search templates..." 
              className="pl-8 bg-background" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="outline" size="icon" className="bg-background">
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Template Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Language</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Updated</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTemplates.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  No templates found.
                </TableCell>
              </TableRow>
            ) : (
              filteredTemplates.map((template) => (
                <TableRow key={template.id} className="hover:bg-muted/50 transition-colors">
                  <TableCell className="font-medium">{template.name}</TableCell>
                  <TableCell className="capitalize">{template.category}</TableCell>
                  <TableCell>{template.language}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        template.status === "Approved"
                          ? "default"
                          : template.status === "Pending"
                          ? "secondary"
                          : template.status === "Rejected"
                          ? "destructive"
                          : "outline"
                      }
                      className={template.status === "Approved" ? "bg-green-500 hover:bg-green-600" : ""}
                    >
                      {template.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {format(new Date(template.updatedAt), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-muted hover:text-accent-foreground h-8 w-8 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                        {isDeleting === template.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreHorizontal className="h-4 w-4" />}
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">

                          <Link href={`/templates/${template.id}/edit`}>
                            <DropdownMenuItem className="cursor-pointer">
                              <Edit className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                          </Link>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-destructive cursor-pointer focus:text-destructive focus:bg-destructive/10"
                          onClick={() => handleDelete(template.id)}
                        >
                          <Trash className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
