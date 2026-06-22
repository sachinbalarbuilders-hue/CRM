"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Users, Send, CheckCircle2, Eye, XCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

export default function CampaignStatisticsClient({ campaign }: { campaign: any }) {
  const total = campaign.audienceCount || 0;
  // For now, we treat deliveredCount as Sent, and we don't have separate Delivered metric, so we'll map them.
  const sent = campaign.deliveredCount || 0;
  const delivered = campaign.deliveredCount || 0; 
  const read = campaign.readCount || 0;
  const failed = campaign.status === "Completed" ? Math.max(0, total - sent) : 0;
  
  const progressPercent = total > 0 ? Math.min(100, Math.round((sent / total) * 100)) : 0;

  return (
    <div className="flex-1 space-y-6 max-w-6xl mx-auto w-full p-4">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/campaigns">
          <Button variant="outline" size="icon" className="h-9 w-9 shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{campaign.name}</h2>
          <p className="text-muted-foreground text-sm mt-1">Campaign Performance and Details</p>
        </div>
      </div>

      <Card className="bg-zinc-950 text-white border-zinc-800">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold text-white">Statistics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-8">
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {/* Total Recipients */}
            <Card className="bg-zinc-950/50 border-zinc-800 flex flex-col items-center justify-center py-6">
              <Users className="h-5 w-5 text-zinc-400 mb-3" />
              <p className="text-2xl font-bold text-white">{total}</p>
              <p className="text-[10px] uppercase tracking-wider text-zinc-400 mt-1 font-medium">Total Recipients</p>
            </Card>

            {/* Sent */}
            <Card className="bg-zinc-950/50 border-zinc-800 flex flex-col items-center justify-center py-6">
              <Send className="h-5 w-5 text-blue-500 mb-3" />
              <p className="text-2xl font-bold text-white">{sent}</p>
              <p className="text-[10px] uppercase tracking-wider text-zinc-400 mt-1 font-medium">Sent</p>
            </Card>

            {/* Delivered */}
            <Card className="bg-zinc-950/50 border-zinc-800 flex flex-col items-center justify-center py-6">
              <CheckCircle2 className="h-5 w-5 text-green-500 mb-3" />
              <p className="text-2xl font-bold text-white">{delivered}</p>
              <p className="text-[10px] uppercase tracking-wider text-zinc-400 mt-1 font-medium">Delivered</p>
            </Card>

            {/* Read */}
            <Card className="bg-zinc-950/50 border-zinc-800 flex flex-col items-center justify-center py-6">
              <Eye className="h-5 w-5 text-purple-500 mb-3" />
              <p className="text-2xl font-bold text-white">{read}</p>
              <p className="text-[10px] uppercase tracking-wider text-zinc-400 mt-1 font-medium">Read</p>
            </Card>

            {/* Failed */}
            <Card className="bg-zinc-950/50 border-zinc-800 flex flex-col items-center justify-center py-6">
              <XCircle className="h-5 w-5 text-red-500 mb-3" />
              <p className="text-2xl font-bold text-white">{failed}</p>
              <p className="text-[10px] uppercase tracking-wider text-zinc-400 mt-1 font-medium">Failed</p>
            </Card>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-zinc-400 font-medium">Progress</span>
              <span className="text-zinc-400 font-medium">{progressPercent}%</span>
            </div>
            
            <div className="relative h-2 w-full overflow-hidden rounded-full bg-zinc-800 flex">
              {total > 0 && (
                <>
                  <div 
                    className="h-full bg-green-500 transition-all duration-500 ease-in-out" 
                    style={{ width: `${Math.min(100, (delivered / total) * 100)}%` }} 
                  />
                  <div 
                    className="h-full bg-blue-500 transition-all duration-500 ease-in-out" 
                    style={{ width: `${Math.min(100, (Math.max(0, sent - delivered) / total) * 100)}%` }} 
                  />
                  <div 
                    className="h-full bg-red-500 transition-all duration-500 ease-in-out" 
                    style={{ width: `${Math.min(100, (failed / total) * 100)}%` }} 
                  />
                </>
              )}
            </div>

            <div className="flex items-center gap-6 text-xs text-zinc-400 pt-2">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                <span>Delivered</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-blue-500" />
                <span>Sent</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-red-500" />
                <span>Failed</span>
              </div>
            </div>
          </div>
          
        </CardContent>
      </Card>

      <Card className="bg-zinc-950 text-white border-zinc-800">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold text-white">Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div>
                <p className="text-xs text-zinc-400 uppercase tracking-wider font-medium mb-1">WhatsApp Template</p>
                <p className="font-medium">{campaign.templateName || "None"}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-400 uppercase tracking-wider font-medium mb-1">Campaign Type</p>
                <p className="font-medium capitalize">{campaign.type || "Marketing"}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-400 uppercase tracking-wider font-medium mb-1">Status</p>
                <p className="font-medium">{campaign.status}</p>
              </div>
            </div>

            {campaign.mediaUrl && (
              <div>
                <p className="text-xs text-zinc-400 uppercase tracking-wider font-medium mb-2">Header Media</p>
                <div className="rounded-lg border border-zinc-800 overflow-hidden inline-block bg-zinc-900">
                  {campaign.mediaUrl.match(/\.(jpeg|jpg|gif|png|webp)$/i) ? (
                    <img 
                      src={campaign.mediaUrl} 
                      alt="Campaign Header Media" 
                      className="max-h-48 object-contain"
                    />
                  ) : campaign.mediaUrl.match(/\.(mp4|webm|ogg)$/i) ? (
                    <video 
                      src={campaign.mediaUrl} 
                      controls 
                      className="max-h-48"
                    />
                  ) : (
                    <div className="p-6 flex flex-col items-center justify-center">
                      <div className="h-10 w-10 rounded-full bg-zinc-800 flex items-center justify-center mb-2">
                        <Link href={campaign.mediaUrl} target="_blank" className="text-blue-400">
                          View File
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-zinc-950 text-white border-zinc-800">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold text-white">Audience List</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
            <div className="text-xs text-zinc-400 mb-3 flex justify-between">
              <span>{campaign.audienceList?.length || 0} Contacts</span>
              <span>Numbers extracted from CSV/Manual Input</span>
            </div>
            
            {campaign.audienceList && campaign.audienceList.length > 0 ? (
              <div className="max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                <table className="w-full text-left text-sm">
                  <thead className="sticky top-0 bg-zinc-900 z-10 text-xs text-zinc-400 uppercase tracking-wider">
                    <tr>
                      <th className="pb-3 pt-2 font-medium">Recipient</th>
                      <th className="pb-3 pt-2 font-medium">Status</th>
                      <th className="pb-3 pt-2 font-medium">Sent At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800">
                    {campaign.audienceList.map((phone: string, idx: number) => {
                      // Find message for this phone
                      const msg = campaign.messages?.find((m: any) => m.conversation?.phoneNumber === phone || m.conversation?.phoneNumber === `+${phone}`);
                      
                      // Status colors
                      const status = msg?.status || (campaign.status === "Completed" ? "failed" : "pending");
                      let badgeColor = "bg-zinc-800 text-zinc-400 border-zinc-700";
                      if (status === "delivered") badgeColor = "bg-green-500/10 text-green-500 border-green-500/20";
                      else if (status === "read") badgeColor = "bg-purple-500/10 text-purple-400 border-purple-500/20";
                      else if (status === "failed") badgeColor = "bg-red-500/10 text-red-500 border-red-500/20";
                      else if (status === "sent") badgeColor = "bg-blue-500/10 text-blue-400 border-blue-500/20";

                      const maskedPhone = phone.length > 4 ? `********${phone.slice(-4)}` : phone;

                      return (
                        <tr key={idx}>
                          <td className="py-3 font-mono text-zinc-300">{maskedPhone}</td>
                          <td className="py-3">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[11px] font-medium uppercase tracking-wide ${badgeColor}`}>
                              {status}
                            </span>
                          </td>
                          <td className="py-3 text-zinc-400">
                            {msg?.createdAt ? format(new Date(msg.createdAt), "MMM d, yyyy, h:mm a") : (campaign.status === "Completed" ? "Failed to send" : "—")}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-zinc-500 italic">No audience list found for this campaign.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
