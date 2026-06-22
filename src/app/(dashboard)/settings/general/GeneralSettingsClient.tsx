"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Globe, Settings, Bell, Loader2, Building2, Clock, Calendar, EyeOff, AlertTriangle, ChevronDown } from "lucide-react";
import { updateOrganizationSettings } from "./actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import type { Organization } from "@prisma/client";

interface GeneralSettingsClientProps {
  organization: Organization;
}

const TIMEZONES = [
  { value: "utc", label: "UTC" },
  { value: "ist", label: "IST — India Standard Time (UTC+5:30)" },
  { value: "est", label: "EST — Eastern Standard Time (UTC-5)" },
  { value: "pst", label: "PST — Pacific Standard Time (UTC-8)" },
  { value: "gmt", label: "GMT — Greenwich Mean Time" },
];

const DATE_FORMATS = [
  { value: "ddmm", label: "DD/MM/YYYY — e.g. 17/06/2026" },
  { value: "mmdd", label: "MM/DD/YYYY — e.g. 06/17/2026" },
  { value: "yyyy", label: "YYYY-MM-DD — e.g. 2026-06-17" },
];

const LANGUAGES = [
  { value: "en", label: "🇺🇸 English" },
  { value: "es", label: "🇪🇸 Español" },
  { value: "hi", label: "🇮🇳 हिंदी (Hindi)" },
];

function NativeSelect({
  id,
  value,
  onChange,
  options,
}: {
  id?: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="relative">
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none rounded-md border border-input bg-background px-3 py-2 pr-8 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
    </div>
  );
}

export function GeneralSettingsClient({ organization }: GeneralSettingsClientProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"general" | "notifications">("general");
  const settings = (organization.settings as Record<string, any>) || {};

  const [name, setName] = useState(organization.name);
  const [timezone, setTimezone] = useState(settings.timezone || "utc");
  const [dateFormat, setDateFormat] = useState(settings.dateFormat || "ddmm");
  const [language, setLanguage] = useState(settings.language || "en");
  const [maskPhoneNumbers, setMaskPhoneNumbers] = useState<boolean>(settings.maskPhoneNumbers || false);
  const [emailNotifications, setEmailNotifications] = useState<boolean>(settings.emailNotifications ?? true);
  const [newMessageAlerts, setNewMessageAlerts] = useState<boolean>(settings.newMessageAlerts ?? true);
  const [campaignUpdates, setCampaignUpdates] = useState<boolean>(settings.campaignUpdates ?? true);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await updateOrganizationSettings({
        name, timezone, dateFormat, language, maskPhoneNumbers,
        emailNotifications, newMessageAlerts, campaignUpdates,
      });
      toast.success("Settings saved");
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Failed to save settings");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 max-w-3xl mx-auto w-full p-6 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground text-sm mt-1">Manage your organization preferences and notifications.</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 border-b pb-0">
        <button
          onClick={() => setActiveTab("general")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
            activeTab === "general"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Settings className="h-4 w-4" /> General
        </button>
        <button
          onClick={() => setActiveTab("notifications")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
            activeTab === "notifications"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Bell className="h-4 w-4" /> Notifications
        </button>
      </div>

      {/* ── GENERAL ─────────────────────────────────── */}
      {activeTab === "general" && (
        <div className="space-y-4">
          {/* Organization Card */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-sm font-semibold">Organization</CardTitle>
              </div>
              <CardDescription className="text-xs">Basic details about your organization.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-1.5 max-w-sm">
                <Label htmlFor="org-name" className="text-sm">Organization Name</Label>
                <Input
                  id="org-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-background"
                  placeholder="My Company"
                />
              </div>
            </CardContent>
          </Card>

          {/* Locale Card */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-sm font-semibold">Locale & Display</CardTitle>
              </div>
              <CardDescription className="text-xs">Timezone, date format, and language preferences.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 max-w-lg">
                <div className="space-y-1.5">
                  <Label htmlFor="timezone" className="text-sm flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" /> Timezone
                  </Label>
                  <NativeSelect id="timezone" value={timezone} onChange={setTimezone} options={TIMEZONES} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="date-format" className="text-sm flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" /> Date Format
                  </Label>
                  <NativeSelect id="date-format" value={dateFormat} onChange={setDateFormat} options={DATE_FORMATS} />
                </div>
              </div>
              <div className="space-y-1.5 max-w-xs">
                <Label htmlFor="language" className="text-sm">Language</Label>
                <NativeSelect id="language" value={language} onChange={setLanguage} options={LANGUAGES} />
                <p className="text-xs text-muted-foreground">Choose your preferred display language.</p>
              </div>
            </CardContent>
          </Card>

          {/* Privacy Card */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <EyeOff className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-sm font-semibold">Privacy</CardTitle>
              </div>
              <CardDescription className="text-xs">Control how sensitive data is displayed across the app.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between max-w-lg">
                <div>
                  <p className="text-sm font-medium">Mask Phone Numbers</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Show only the last 4 digits (e.g. ••••••5020)</p>
                </div>
                <Switch checked={maskPhoneNumbers} onCheckedChange={setMaskPhoneNumbers} />
              </div>
            </CardContent>
          </Card>

          {/* Save */}
          <div className="flex justify-end pt-1">
            <Button onClick={handleSave} disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </div>

          {/* Danger Zone */}
          <Card className="border-destructive/30 mt-4">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                <CardTitle className="text-sm font-semibold text-destructive">Danger Zone</CardTitle>
              </div>
              <CardDescription className="text-xs">
                Permanently delete this organization and all its data. This cannot be undone.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="destructive"
                size="sm"
                onClick={async () => {
                  if (confirm("Are you sure? This will permanently delete the organization and all its data.")) {
                    try {
                      const { deleteOrganization } = await import("@/app/(dashboard)/org-actions");
                      await deleteOrganization();
                      window.location.reload();
                    } catch (e: any) {
                      alert(e.message);
                    }
                  }
                }}
              >
                Delete Organization
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── NOTIFICATIONS ────────────────────────────── */}
      {activeTab === "notifications" && (
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-sm font-semibold">Notification Preferences</CardTitle>
              </div>
              <CardDescription className="text-xs">Control which notifications you receive.</CardDescription>
            </CardHeader>
            <CardContent className="divide-y divide-border max-w-lg">
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium">Email Notifications</p>
                  <p className="text-xs text-muted-foreground">Receive important updates via email</p>
                </div>
                <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
              </div>
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium">New Message Alerts</p>
                  <p className="text-xs text-muted-foreground">Get notified when new messages arrive</p>
                </div>
                <Switch checked={newMessageAlerts} onCheckedChange={setNewMessageAlerts} />
              </div>
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium">Campaign Updates</p>
                  <p className="text-xs text-muted-foreground">Receive campaign status notifications</p>
                </div>
                <Switch checked={campaignUpdates} onCheckedChange={setCampaignUpdates} />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end pt-1">
            <Button onClick={handleSave} disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
