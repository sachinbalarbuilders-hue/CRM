"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, CheckCircle2, ChevronRight, Send, Upload, Users, ChevronDown, FileSpreadsheet, PenLine, X, AlertCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createCampaign, updateCampaign } from "../actions";

const steps = ["Campaign Details", "Audience", "Content & Review"];

function NativeSelect({
  id,
  value,
  onChange,
  options,
  className = "",
}: {
  id?: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  className?: string;
}) {
  return (
    <div className={`relative ${className}`}>
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

export default function NewCampaignWizard({ 
  organizationId,
  campaignId,
  initialData 
}: { 
  organizationId: string;
  campaignId?: string;
  initialData?: any;
}) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  // Campaign details state
  const [campaignName, setCampaignName] = useState(initialData?.name || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [campaignType, setCampaignType] = useState(initialData?.type || "marketing");
  const [template, setTemplate] = useState(initialData?.templateName === "site_visit_reminder" ? "t2" : "t1");
  const [variable, setVariable] = useState(initialData?.variableMapping || "name");

  // Audience state
  const [audienceTab, setAudienceTab] = useState<"csv" | "manual">(initialData?.audienceType || "csv");
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvPreview, setCsvPreview] = useState<string[]>([]);
  const [csvError, setCsvError] = useState("");
  const [manualNumbers, setManualNumbers] = useState(initialData?.audienceList ? initialData.audienceList.join("\n") : "");
  const [parsedCount, setParsedCount] = useState(initialData?.audienceCount || 0);
  const [duplicateCount, setDuplicateCount] = useState(0);
  const [duplicates, setDuplicates] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseAndDedup = (phones: string[]) => {
    const seen = new Set<string>();
    const dupes: string[] = [];
    const unique: string[] = [];
    for (const p of phones) {
      const clean = p.replace(/^\+/, ""); // normalize +91 => 91
      if (seen.has(clean)) {
        if (!dupes.includes(clean)) dupes.push(clean);
      } else {
        seen.add(clean);
        unique.push(clean);
      }
    }
    return { unique, dupes };
  };

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith(".csv")) {
      setCsvError("Please upload a .csv file");
      return;
    }
    setCsvError("");
    setCsvFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
      const phones = lines.slice(1).map(line => {
        const cols = line.split(",");
        return cols[0].replace(/[^0-9+]/g, "");
      }).filter(p => p.length >= 7);
      const { unique, dupes } = parseAndDedup(phones);
      setCsvPreview(unique.slice(0, 5));
      setParsedCount(unique.length);
      setDuplicateCount(dupes.length);
      setDuplicates(dupes.slice(0, 3));
    };
    reader.readAsText(file);
  };

  const handleManualChange = (val: string) => {
    setManualNumbers(val);
    const phones = val.split("\n").map(l => l.trim().replace(/[^0-9+]/g, "")).filter(p => p.length >= 7);
    const { unique, dupes } = parseAndDedup(phones);
    setParsedCount(unique.length);
    setDuplicateCount(dupes.length);
    setDuplicates(dupes.slice(0, 3));
  };

  const handleRemoveDuplicates = () => {
    if (audienceTab === "manual") {
      const phones = manualNumbers.split("\n").map(l => l.trim().replace(/[^0-9+]/g, "")).filter(p => p.length >= 7);
      const { unique } = parseAndDedup(phones);
      setManualNumbers(unique.join("\n"));
      setDuplicateCount(0);
      setDuplicates([]);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-5 max-w-xl mx-auto">
            <div className="space-y-1.5">
              <Label htmlFor="name">Campaign Name</Label>
              <Input 
                id="name" 
                placeholder="e.g., Diwali Offer 2024" 
                value={campaignName}
                onChange={e => setCampaignName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="desc">Description (Internal)</Label>
              <Textarea 
                id="desc" 
                placeholder="Briefly describe the goal of this campaign..." 
                rows={3} 
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="campaign-type">Campaign Type</Label>
              <NativeSelect
                id="campaign-type"
                value={campaignType}
                onChange={setCampaignType}
                options={[
                  { value: "marketing", label: "Marketing — Promotions & Offers" },
                  { value: "utility", label: "Utility — Updates & Reminders" },
                ]}
              />
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-5 max-w-xl mx-auto">
            {/* Tab switcher */}
            <div className="flex rounded-lg border overflow-hidden">
              <button
                onClick={() => { setAudienceTab("csv"); setParsedCount(0); }}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors ${
                  audienceTab === "csv" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <FileSpreadsheet className="h-4 w-4" /> Upload CSV
              </button>
              <button
                onClick={() => { setAudienceTab("manual"); setParsedCount(0); }}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors border-l ${
                  audienceTab === "manual" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <PenLine className="h-4 w-4" /> Manual Entry
              </button>
            </div>

            {audienceTab === "csv" ? (
              <div className="space-y-4">
                <div
                  className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/20 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const file = e.dataTransfer.files[0];
                    if (file) handleCsvUpload({ target: { files: [file] } } as any);
                  }}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={handleCsvUpload}
                  />
                  {csvFile ? (
                    <div className="space-y-2">
                      <FileSpreadsheet className="h-8 w-8 text-green-500 mx-auto" />
                      <p className="font-medium text-sm">{csvFile.name}</p>
                      <p className="text-xs text-muted-foreground">{parsedCount} valid phone numbers found</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={(e) => { e.stopPropagation(); setCsvFile(null); setCsvPreview([]); setParsedCount(0); }}
                      >
                        <X className="h-3.5 w-3.5 mr-1" /> Remove file
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="h-8 w-8 text-muted-foreground mx-auto" />
                      <p className="text-sm font-medium">Drop your CSV here or click to browse</p>
                      <p className="text-xs text-muted-foreground">First column should be the phone number (with country code)</p>
                    </div>
                  )}
                </div>

                {csvError && (
                  <div className="flex items-center gap-2 text-destructive text-sm">
                    <AlertCircle className="h-4 w-4" /> {csvError}
                  </div>
                )}

                {csvPreview.length > 0 && (
                  <div className="rounded-lg border p-3 space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Preview (first 5)</p>
                    {csvPreview.map((p, i) => (
                      <div key={i} className="text-sm font-mono bg-muted/30 rounded px-2 py-1">{p}</div>
                    ))}
                  </div>
                )}

                <div className="text-xs text-muted-foreground">
                  <span className="font-medium">CSV format: </span>phone,name (one per row). Country code required, e.g. 919876543210
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label>Phone Numbers</Label>
                  <Textarea
                    placeholder={`Enter one phone number per line (with country code)\n\n919876543210\n917012345678\n918888888888`}
                    rows={10}
                    value={manualNumbers}
                    onChange={(e) => handleManualChange(e.target.value)}
                    className="font-mono text-sm resize-none"
                  />
                  <p className="text-xs text-muted-foreground">One number per line. Include country code (e.g. 91 for India).</p>
                </div>
              </div>
            )}

            {/* Duplicate warning */}
            {duplicateCount > 0 && (
              <div className="rounded-lg border border-orange-500/30 bg-orange-500/10 p-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 text-orange-500 text-sm font-medium mt-0.5">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {duplicateCount} duplicate {duplicateCount === 1 ? "number" : "numbers"} removed automatically
                  </div>
                  {audienceTab === "manual" && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleRemoveDuplicates}
                      className="h-7 text-xs border-orange-500/30 hover:bg-orange-500/20 text-orange-600 hover:text-orange-700 bg-transparent"
                    >
                      Clean List
                    </Button>
                  )}
                </div>
                {duplicates.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {duplicates.map((d, i) => (
                      <span key={i} className="font-mono text-xs bg-orange-500/10 border border-orange-500/20 text-orange-400 rounded px-2 py-0.5">
                        {d}
                      </span>
                    ))}
                    {duplicateCount > 3 && (
                      <span className="text-xs text-muted-foreground self-center">+{duplicateCount - 3} more</span>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Count display */}
            {parsedCount > 0 && (
              <div className="rounded-md border border-dashed p-5">
                <div className="flex items-center justify-around">
                  <div className="text-center">
                    <p className="text-3xl font-bold">{parsedCount.toLocaleString()}</p>
                    <p className="text-muted-foreground text-xs mt-1">Unique recipients</p>
                  </div>
                  {duplicateCount > 0 && (
                    <>
                      <div className="w-px h-10 bg-border" />
                      <div className="text-center">
                        <p className="text-3xl font-bold text-orange-500">{duplicateCount.toLocaleString()}</p>
                        <p className="text-muted-foreground text-xs mt-1">Duplicates removed</p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        );

      case 2:
        return (
          <div className="flex gap-6 max-w-4xl mx-auto">
            {/* Left: Configuration */}
            <div className="flex-1 space-y-5">
              <div className="space-y-1.5">
                <Label>WhatsApp Template</Label>
                <NativeSelect
                  value={template}
                  onChange={setTemplate}
                  options={[
                    { value: "t1", label: "diwali_offer_v1 — Marketing" },
                    { value: "t2", label: "site_visit_reminder — Utility" },
                  ]}
                />
              </div>

              <div className="space-y-3 rounded-lg border p-4 bg-muted/10">
                <h4 className="font-medium text-sm">Variable Mapping</h4>
                <div className="flex items-center gap-3">
                  <Badge variant="secondary" className="shrink-0 font-mono">{"{{1}}"}</Badge>
                  <NativeSelect
                    value={variable}
                    onChange={setVariable}
                    className="flex-1"
                    options={[
                      { value: "name", label: "Lead First Name" },
                      { value: "phone", label: "Lead Phone Number" },
                    ]}
                  />
                </div>
              </div>

              <div className="rounded-lg border p-4 bg-muted/10 space-y-2">
                <h4 className="font-medium text-sm">Summary</h4>
                <div className="text-xs text-muted-foreground space-y-1">
                  <div className="flex justify-between"><span>Recipients</span><span className="font-medium text-foreground">{parsedCount.toLocaleString()}</span></div>
                  <div className="flex justify-between"><span>Template</span><span className="font-medium text-foreground">{template === "t1" ? "diwali_offer_v1" : "site_visit_reminder"}</span></div>
                  <div className="flex justify-between"><span>Type</span><span className="font-medium text-foreground capitalize">{campaignType}</span></div>
                </div>
              </div>
            </div>

            {/* Right: Preview */}
            <div className="w-[280px] shrink-0">
              <p className="text-xs text-muted-foreground text-center mb-3 font-medium">MESSAGE PREVIEW</p>
              <div className="rounded-xl border bg-muted/20 p-4">
                <div className="bg-white text-zinc-900 rounded-lg p-3 shadow text-sm leading-relaxed relative pb-7">
                  <div className="font-bold mb-1 text-sm">🎉 Diwali Special Offer!</div>
                  <div className="whitespace-pre-wrap text-[13px]">
                    Hi [Lead First Name], book a plot at Sunrise Valley this week and get a 50gm Silver Coin free!
                  </div>
                  <div className="text-[10px] text-zinc-500 mt-2 uppercase tracking-wide">
                    Reply STOP to unsubscribe
                  </div>
                  <div className="absolute bottom-1.5 right-2 text-[10px] text-zinc-400">12:00 PM ✓✓</div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto w-full p-4">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/campaigns">
          <Button variant="outline" size="icon" className="h-9 w-9 shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{campaignId ? "Edit Campaign" : "Create Campaign"}</h2>
          <p className="text-muted-foreground text-sm">{campaignId ? "Update your draft campaign broadcast." : "Follow the steps to configure and launch your broadcast."}</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          {/* Stepper */}
          <div className="flex items-center mb-8">
            {steps.map((step, idx) => (
              <div key={idx} className="flex items-center flex-1 last:flex-none">
                <div className="flex items-center gap-2.5 shrink-0">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full border-2 font-semibold text-sm transition-colors ${
                    currentStep === idx
                      ? "border-primary bg-primary text-primary-foreground"
                      : currentStep > idx
                        ? "border-green-500 bg-green-500/10 text-green-500"
                        : "border-muted-foreground/30 text-muted-foreground"
                  }`}>
                    {currentStep > idx ? <CheckCircle2 className="h-4 w-4" /> : idx + 1}
                  </div>
                  <span className={`text-sm font-medium whitespace-nowrap ${
                    currentStep === idx ? "text-foreground" : "text-muted-foreground"
                  }`}>
                    {step}
                  </span>
                </div>
                {idx < steps.length - 1 && (
                  <div className={`h-px flex-1 mx-4 ${currentStep > idx ? "bg-green-500/50" : "bg-border"}`} />
                )}
              </div>
            ))}
          </div>

          {/* Step Content */}
          <div className="min-h-[320px]">
            {renderStep()}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between border-t pt-5 mt-6">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
              disabled={currentStep === 0}
            >
              Previous
            </Button>

            <div className="flex items-center gap-3">
              <Button 
                variant="secondary" 
                className="bg-muted/50 hover:bg-muted"
                disabled={isSaving || !campaignName}
                onClick={async () => {
                  if (!campaignName) return;
                  setIsSaving(true);
                  try {
                    const data = {
                      name: campaignName,
                      description,
                      type: campaignType,
                      templateName: template === "t1" ? "diwali_offer_v1" : "site_visit_reminder",
                      variableMapping: variable,
                      audienceType: audienceTab,
                      audienceList: manualNumbers ? manualNumbers.split("\n") : [],
                      audienceCount: parsedCount,
                      status: "Draft",
                      organizationId,
                    };
                    if (campaignId) {
                      await updateCampaign(campaignId, data);
                    } else {
                      await createCampaign(data);
                    }
                    toast.success("Draft saved");
                    router.push("/campaigns");
                  } catch (e) {
                    toast.error("Failed to save draft");
                  } finally {
                    setIsSaving(false);
                  }
                }}
              >
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Save as Draft
              </Button>
              {currentStep < steps.length - 1 ? (
                <Button onClick={() => setCurrentStep(prev => Math.min(steps.length - 1, prev + 1))}>
                  Next <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              ) : (
                <Button 
                  className="bg-green-600 hover:bg-green-700 text-white gap-2"
                  disabled={isSaving || parsedCount === 0 || !campaignName}
                  onClick={async () => {
                    setIsSaving(true);
                    try {
                      const data = {
                        name: campaignName,
                        description,
                        type: campaignType,
                        templateName: template === "t1" ? "diwali_offer_v1" : "site_visit_reminder",
                        variableMapping: variable,
                        audienceType: audienceTab,
                        audienceList: manualNumbers ? manualNumbers.split("\n") : [],
                        audienceCount: parsedCount,
                        status: "Active",
                        organizationId,
                      };
                      if (campaignId) {
                        await updateCampaign(campaignId, data);
                      } else {
                        await createCampaign(data);
                      }
                      toast.success("Campaign launched successfully!");
                      router.push("/campaigns");
                    } catch (e) {
                      toast.error("Failed to launch campaign");
                    } finally {
                      setIsSaving(false);
                    }
                  }}
                >
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Launch Campaign
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
