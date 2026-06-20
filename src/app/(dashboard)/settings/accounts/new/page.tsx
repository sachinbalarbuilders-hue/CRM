"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Phone } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AccountForm } from "../AccountForm";

export default function NewAccountPage() {
  const router = useRouter();

  return (
    <div className="flex-1 space-y-6 max-w-6xl mx-auto w-full p-4">
      {/* Header section */}
      <div className="flex items-center gap-4 mb-8">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => router.back()}
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-600 text-white">
            <Phone className="h-5 w-5 fill-current" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-xl font-semibold tracking-tight">New Account</h1>
            <div className="flex items-center text-sm text-muted-foreground">
              <Link href="/settings" className="text-green-600 hover:underline">Settings</Link>
              <span className="mx-1.5 text-muted-foreground/50">{">"}</span>
              <Link href="/settings/accounts" className="text-green-600 hover:underline">Accounts</Link>
              <span className="mx-1.5 text-muted-foreground/50">{">"}</span>
              <span className="text-foreground">New Account</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Form */}
        <div className="lg:col-span-2">
          <AccountForm />
        </div>

        {/* Right Column - Setup Guide */}
        <div className="lg:col-span-1">
          <Card className="border-border bg-muted/30">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold">Setup Guide</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-4 text-sm text-muted-foreground list-decimal list-inside">
                <li className="leading-relaxed">
                  Go to <Link href="#" className="text-green-600 font-medium hover:underline">Meta Developer Console</Link> and create or select your app
                </li>
                <li className="leading-relaxed">
                  Add WhatsApp product to your app and complete the setup
                </li>
                <li className="leading-relaxed">
                  In WhatsApp {">"} API Setup, copy your <span className="font-semibold text-foreground">Phone Number ID</span> and <span className="font-semibold text-foreground">WhatsApp Business Account ID</span>
                </li>
                <li className="leading-relaxed">
                  Create a permanent access token in <Link href="#" className="text-green-600 font-medium hover:underline">Business Settings</Link>
                </li>
                <li className="leading-relaxed">
                  Configure the webhook URL and verify token in your Meta app settings
                </li>
                <li className="leading-relaxed">
                  Subscribe to messages webhook field
                </li>
              </ol>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
