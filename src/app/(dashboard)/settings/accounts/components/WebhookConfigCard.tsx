"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import { useState, useEffect } from "react";

interface WebhookConfigCardProps {
  verifyToken: string | null;
}

export function WebhookConfigCard({ verifyToken }: WebhookConfigCardProps) {
  const [webhookUrl, setWebhookUrl] = useState<string>("");
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);

  useEffect(() => {
    // Generate the webhook URL based on the current domain
    if (typeof window !== "undefined") {
      setWebhookUrl(`${window.location.origin}/api/webhook`);
    }
  }, []);

  const copyToClipboard = async (text: string, isUrl: boolean) => {
    try {
      await navigator.clipboard.writeText(text);
      if (isUrl) {
        setCopiedUrl(true);
        setTimeout(() => setCopiedUrl(false), 2000);
      } else {
        setCopiedToken(true);
        setTimeout(() => setCopiedToken(false), 2000);
      }
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  if (!verifyToken) return null; // Don't show if token hasn't been generated yet (e.g. legacy accounts)

  return (
    <Card className="border-border">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold">Webhook Configuration</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground">Webhook URL</Label>
          <div className="flex gap-2">
            <Input 
              value={webhookUrl} 
              readOnly 
              className="bg-background font-mono text-sm"
            />
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => copyToClipboard(webhookUrl, true)}
              className="shrink-0 text-muted-foreground hover:text-foreground"
            >
              {copiedUrl ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground">Verify Token</Label>
          <div className="flex gap-2">
            <Input 
              value={verifyToken} 
              readOnly 
              className="bg-background font-mono text-sm"
            />
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => copyToClipboard(verifyToken, false)}
              className="shrink-0 text-muted-foreground hover:text-foreground"
            >
              {copiedToken ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
