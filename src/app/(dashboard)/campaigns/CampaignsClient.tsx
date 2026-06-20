"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Filter, Send, Clock, FileText, MoreHorizontal, Edit, Trash, Eye, Loader2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Link from "next/link";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { deleteCampaign, launchCampaign } from "./actions";
import { toast } from "sonner";
import { format } from "date-fns";

const statusConfig: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
  Completed: {
    label: "Completed",
    className: "bg-green-500/10 text-green-500 border-green-500/20",
    icon: <Send className="h-3 w-3" />,
  },
  Active: {
    label: "Active",
    className: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    icon: <Clock className="h-3 w-3" />,
  },
  Draft: {
    label: "Draft",
    className: "bg-muted text-muted-foreground border-border",
    icon: <FileText className="h-3 w-3" />,
  },
};

export function CampaignsClient({ campaigns }: { campaigns: any[] }) {
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this campaign?")) return;
    setIsDeleting(id);
    try {
      await deleteCampaign(id);
      toast.success("Campaign deleted successfully");
    } catch (error) {
      toast.error("Failed to delete campaign");
    } finally {
      setIsDeleting(null);
    }
  };

  const handleLaunch = async (id: string) => {
    try {
      await launchCampaign(id);
      toast.success("Campaign launched successfully");
    } catch (error) {
      toast.error("Failed to launch campaign");
    }
  };

  return (
    <div className="flex-1 space-y-6 max-w-6xl mx-auto w-full p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Campaigns</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Send bulk WhatsApp messages to your targeted contacts.
          </p>
        </div>
        <Link href="/campaigns/new">
          <Button className="bg-green-600 hover:bg-green-700 text-white gap-2">
            <Plus className="h-4 w-4" /> Create Campaign
          </Button>
        </Link>
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">All Campaigns</CardTitle>
              <CardDescription className="text-xs">{campaigns.length} campaigns total</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search campaigns..." className="pl-8 h-9 w-56 text-sm" />
              </div>
              <Button variant="outline" size="icon" className="h-9 w-9">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Campaign Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Audience</TableHead>
                <TableHead>Performance</TableHead>
                <TableHead>Sent At</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaigns.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No campaigns found. Create your first campaign to get started.
                  </TableCell>
                </TableRow>
              )}
              {campaigns.map((campaign) => {
                const cfg = statusConfig[campaign.status] || statusConfig["Draft"];
                const readRate = campaign.deliveredCount > 0 ? Math.round((campaign.readCount / campaign.deliveredCount) * 100) : 0;
                const replyRate = campaign.deliveredCount > 0 ? Math.round((campaign.repliedCount / campaign.deliveredCount) * 100) : 0;
                const isExpanded = expandedId === campaign.id;

                return (
                  <React.Fragment key={campaign.id}>
                    <TableRow 
                      className={`cursor-pointer transition-colors ${isExpanded ? "bg-muted/50" : "hover:bg-muted/50"}`}
                      onClick={() => setExpandedId(isExpanded ? null : campaign.id)}
                    >
                      <TableCell className="font-medium">{campaign.name}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium ${cfg.className}`}>
                          {cfg.icon}
                          {cfg.label}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">{campaign.audienceCount.toLocaleString()}</TableCell>
                      <TableCell className="w-[220px]">
                        {campaign.status !== "Draft" ? (
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">Read rate</span>
                              <span className="font-semibold">{readRate}%</span>
                            </div>
                            <Progress value={readRate} className="h-1.5" />
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">Not sent yet</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {campaign.sentAt ? format(new Date(campaign.sentAt), "MMM d, yyyy") : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-muted hover:text-accent-foreground h-8 w-8 focus-visible:outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                            {isDeleting === campaign.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreHorizontal className="h-4 w-4" />}
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {campaign.status === "Draft" && (
                              <>
                                <Link href={`/campaigns/${campaign.id}/edit`}>
                                  <DropdownMenuItem className="cursor-pointer">
                                    <Edit className="mr-2 h-4 w-4" /> Edit Draft
                                  </DropdownMenuItem>
                                </Link>
                                <DropdownMenuItem 
                                  className="cursor-pointer text-green-600 focus:text-green-600"
                                  onClick={() => handleLaunch(campaign.id)}
                                >
                                  <Send className="mr-2 h-4 w-4" /> Launch Campaign
                                </DropdownMenuItem>
                              </>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-destructive cursor-pointer focus:text-destructive focus:bg-destructive/10"
                              onClick={(e) => { e.stopPropagation(); handleDelete(campaign.id); }}
                            >
                              <Trash className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                    {isExpanded && (
                      <TableRow className="bg-muted/20 hover:bg-muted/20">
                        <TableCell colSpan={6} className="p-0 border-b">
                          <div className="p-4 bg-muted/10 grid grid-cols-3 gap-4 border-t shadow-inner">
                            <Card className="shadow-sm border-muted/50">
                              <CardContent className="p-4">
                                <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Total Sent</p>
                                <p className="text-2xl font-bold mt-1">{campaign.deliveredCount.toLocaleString()}</p>
                              </CardContent>
                            </Card>
                            <Card className="shadow-sm border-muted/50">
                              <CardContent className="p-4">
                                <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Total Read</p>
                                <p className="text-2xl font-bold mt-1">{campaign.readCount.toLocaleString()}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">{readRate}% read rate</p>
                              </CardContent>
                            </Card>
                            <Card className="shadow-sm border-muted/50">
                              <CardContent className="p-4">
                                <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Total Replied</p>
                                <p className="text-2xl font-bold mt-1">{campaign.repliedCount.toLocaleString()}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">{replyRate}% reply rate</p>
                              </CardContent>
                            </Card>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
