"use client";

import { useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Loader2, RefreshCw, Store, Bell, Trash2 } from "lucide-react";
import { testMetaConnection, subscribeWebhook } from "../meta-actions";
import { BusinessProfileDialog } from "./BusinessProfileDialog";
import Link from "next/link";

interface AccountActionsProps {
  accountId: string;
  canEdit?: boolean;
  canDelete?: boolean;
}

export function AccountActions({ accountId, canEdit = true, canDelete = true }: AccountActionsProps) {
  const [isTesting, setIsTesting] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [subscribeResult, setSubscribeResult] = useState<{ success: boolean; message: string } | null>(null);

  const [isDeleting, setIsDeleting] = useState(false);

  const handleTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      await testMetaConnection(accountId);
      setTestResult({ success: true, message: "Connection successful!" });
      setTimeout(() => setTestResult(null), 3000);
    } catch (error: any) {
      setTestResult({ success: false, message: error.message || "Connection failed" });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSubscribe = async () => {
    setIsSubscribing(true);
    setSubscribeResult(null);
    try {
      await subscribeWebhook(accountId);
      setSubscribeResult({ success: true, message: "Subscribed successfully!" });
      setTimeout(() => setSubscribeResult(null), 3000);
    } catch (error: any) {
      setSubscribeResult({ success: false, message: error.message || "Subscribe failed" });
    } finally {
      setIsSubscribing(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this account? This action cannot be undone.")) return;
    
    setIsDeleting(true);
    try {
      const { deleteWhatsAppAccount } = await import("../actions");
      await deleteWhatsAppAccount(accountId);
    } catch (error: any) {
      alert(error.message || "Failed to delete account");
      setIsDeleting(false); // Only reset if failed, on success it will unmount
    }
  };

  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleTest} 
          disabled={isTesting || isDeleting}
          className="gap-2 bg-background"
        >
          {isTesting ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Test
        </Button>
        {testResult && (
          <div className={`absolute top-full mt-2 w-max left-1/2 -translate-x-1/2 rounded px-2 py-1 text-xs font-medium ${testResult.success ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'} z-10`}>
            {testResult.message}
          </div>
        )}
      </div>
      
      <div className="relative">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleSubscribe}
          disabled={isSubscribing || isDeleting}
          className="gap-2 bg-background"
        >
          {isSubscribing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bell className="h-4 w-4" />}
          Subscribe
        </Button>
        {subscribeResult && (
          <div className={`absolute top-full mt-2 w-max left-1/2 -translate-x-1/2 rounded px-2 py-1 text-xs font-medium ${subscribeResult.success ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'} z-10`}>
            {subscribeResult.message}
          </div>
        )}
      </div>

      <Button 
        variant="outline" 
        size="sm" 
        className="gap-2 bg-background"
        onClick={() => setIsProfileOpen(true)}
        disabled={isDeleting}
      >
        <Store className="h-4 w-4" /> Business Profile
      </Button>

      {canEdit && (
        <Link 
          href={`/settings/accounts/${accountId}`}
          className={buttonVariants({ variant: "outline", size: "sm" }) + " gap-2 bg-background " + (isDeleting ? "pointer-events-none opacity-50" : "")}
        >
          Edit Settings
        </Link>
      )}
      
      {canDelete && (
        <Button 
          variant="destructive" 
          size="sm" 
          className="gap-2"
          onClick={handleDelete}
          disabled={isDeleting}
        >
          {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
          {isDeleting ? "Deleting..." : "Delete"}
        </Button>
      )}

      {isProfileOpen && (
        <BusinessProfileDialog 
          accountId={accountId} 
          open={isProfileOpen} 
          onOpenChange={setIsProfileOpen} 
        />
      )}
    </div>
  );
}
