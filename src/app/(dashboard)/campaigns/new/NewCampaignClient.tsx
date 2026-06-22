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
import { createCampaign, updateCampaign, uploadCampaignMedia } from "../actions";

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
  initialData,
  templates = [],
  accounts = []
}: { 
  organizationId: string;
  campaignId?: string;
  initialData?: any;
  templates?: any[];
  accounts?: any[];
}) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  // Campaign details state
  const [campaignName, setCampaignName] = useState(initialData?.name || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [campaignType, setCampaignType] = useState(initialData?.type || "marketing");
  const [template, setTemplate] = useState(initialData?.templateName || (templates.length > 0 ? templates[0].name : ""));
  const [variable, setVariable] = useState(initialData?.variableMapping || "name");
  
  const [whatsAppAccount, setWhatsAppAccount] = useState(initialData?.whatsAppAccountId || (accounts && accounts.length > 0 ? accounts[0].id : ""));
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const mediaInputRef = useRef<HTMLInputElement>(null);

  // Audience state
  const [audienceTab, setAudienceTab] = useState<"csv" | "manual">(initialData?.audienceType || "csv");
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvPreview, setCsvPreview] = useState<string[]>(initialData?.audienceList ? initialData.audienceList.slice(0, 5000) : []);
  const [csvError, setCsvError] = useState("");
  const [manualNumbers, setManualNumbers] = useState(initialData?.audienceList ? initialData.audienceList.join("\n") : "");
  const [finalAudience, setFinalAudience] = useState<string[]>(initialData?.audienceList || []);
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
      setFinalAudience(phones);
      setCsvPreview(phones.slice(0, 5000));
      setParsedCount(phones.length);
      setDuplicateCount(dupes.length);
      setDuplicates(dupes);
    };
    reader.readAsText(file);
  };

  const handleManualChange = (val: string) => {
    setManualNumbers(val);
    const phones = val.split("\n").map((l: string) => l.trim().replace(/[^0-9+]/g, "")).filter((p: string) => p.length >= 7);
    const { unique, dupes } = parseAndDedup(phones);
    setFinalAudience(phones);
    setParsedCount(phones.length);
    setDuplicateCount(dupes.length);
    setDuplicates(dupes);
  };

  const handleRemoveDuplicates = () => {
    if (audienceTab === "manual") {
      const phones = manualNumbers.split("\n").map((l: string) => l.trim().replace(/[^0-9+]/g, "")).filter((p: string) => p.length >= 7);
      const { unique } = parseAndDedup(phones);
      setFinalAudience(unique);
      setManualNumbers(unique.join("\n"));
      setParsedCount(unique.length);
      setDuplicateCount(0);
      setDuplicates([]);
    } else {
      const { unique } = parseAndDedup(finalAudience);
      setFinalAudience(unique);
      setCsvPreview(unique.slice(0, 5000));
      setParsedCount(unique.length);
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
                        onClick={(e) => { e.stopPropagation(); setCsvFile(null); setCsvPreview([]); setParsedCount(0); setFinalAudience([]); setDuplicateCount(0); setDuplicates([]); }}
                      >
                        <X className="h-3.5 w-3.5 mr-1" /> Remove file
                      </Button>
                    </div>
                  ) : finalAudience.length > 0 ? (
                    <div className="space-y-2">
                      <FileSpreadsheet className="h-8 w-8 text-green-500 mx-auto" />
                      <p className="font-medium text-sm">Saved Audience Data</p>
                      <p className="text-xs text-muted-foreground">{parsedCount} numbers loaded from draft</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:text-foreground"
                        onClick={(e) => { e.stopPropagation(); setFinalAudience([]); setCsvPreview([]); setParsedCount(0); setDuplicateCount(0); setDuplicates([]); }}
                      >
                        <X className="h-3.5 w-3.5 mr-1" /> Clear audience
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
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Preview ({csvPreview.length === parsedCount ? "All" : `First ${csvPreview.length}`})</p>
                    <div className="max-h-48 overflow-y-auto space-y-1.5 pr-2">
                      {csvPreview.map((p, i) => {
                        const isDup = duplicates.includes(p);
                        return (
                          <div key={i} className={`text-sm font-mono rounded px-2 py-1.5 flex items-center justify-between transition-colors ${
                            isDup ? "bg-orange-500/10 text-orange-700 border-l-2 border-orange-500 font-medium" : "bg-muted/30 text-foreground"
                          }`}>
                            <span>{p}</span>
                            {isDup && <span className="text-[10px] uppercase tracking-wider font-bold text-orange-600 bg-orange-500/10 px-1.5 py-0.5 rounded">Duplicate</span>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="text-xs text-muted-foreground flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span><span className="font-medium">CSV format:</span> phone,name (one per row). Country code required, e.g. 919876543210</span>
                  <a 
                    href="data:text/csv;charset=utf-8,phone,name%0A919876543210,John Doe%0A918888888888,Jane Smith" 
                    download="sample_audience.csv" 
                    className="text-blue-500 hover:text-blue-400 hover:underline inline-flex items-center font-medium"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Download Sample CSV
                  </a>
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
                    {duplicateCount} duplicate {duplicateCount === 1 ? "number" : "numbers"} detected
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleRemoveDuplicates}
                    className="shrink-0 h-8 text-xs border-orange-500/50 text-orange-600 hover:bg-orange-500/10"
                  >
                    Remove Duplicates
                  </Button>
                </div>
                {duplicates.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {duplicates.slice(0, 3).map((d, i) => (
                      <span key={i} className="px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-600 border border-orange-500/20 text-xs font-mono">
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
                    <p className="text-muted-foreground text-xs mt-1">Total recipients</p>
                  </div>
                  {duplicateCount > 0 && (
                    <>
                      <div className="w-px h-10 bg-border" />
                      <div className="text-center">
                        <p className="text-3xl font-bold text-orange-500">{duplicateCount.toLocaleString()}</p>
                        <p className="text-muted-foreground text-xs mt-1">Duplicates pending</p>
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
                <Label>WhatsApp Account</Label>
                <NativeSelect
                  value={whatsAppAccount}
                  onChange={setWhatsAppAccount}
                  options={accounts && accounts.length > 0 ? accounts.map(a => ({ value: a.id, label: a.name })) : [{ value: "", label: "No WhatsApp Accounts found" }]}
                />
              </div>

              <div className="space-y-1.5">
                <Label>WhatsApp Template</Label>
                <NativeSelect
                  value={template}
                  onChange={setTemplate}
                  options={templates.length > 0 ? templates.map(t => ({ value: t.name, label: `${t.name} — ${t.category}` })) : [{ value: "", label: "No approved templates found" }]}
                />
              </div>

              {(() => {
                const selectedTpl = templates.find(t => t.name === template);
                if (selectedTpl && ["image", "video", "document"].includes(selectedTpl.headerType)) {
                  return (
                    <div className="space-y-1.5 rounded-lg border border-dashed p-4 bg-muted/10">
                      <Label>Header Media ({selectedTpl.headerType})</Label>
                      <input 
                        type="file" 
                        ref={mediaInputRef}
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) setMediaFile(f);
                        }}
                        accept={selectedTpl.headerType === 'image' ? 'image/*' : selectedTpl.headerType === 'video' ? 'video/*' : '.pdf,.doc,.docx'}
                      />
                      <div className="flex items-center gap-3 mt-2">
                        <Button 
                          variant="outline" 
                          onClick={() => mediaInputRef.current?.click()}
                          className="h-9 gap-2 shrink-0"
                        >
                          <Upload className="h-4 w-4" />
                          Upload Media
                        </Button>
                        <span className="text-sm text-muted-foreground truncate">
                          {mediaFile ? mediaFile.name : initialData?.mediaUrl ? "Using existing media" : "No file chosen (required for sending)"}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        You must upload the actual {selectedTpl.headerType} to be sent in this campaign.
                      </p>
                    </div>
                  );
                }
                return null;
              })()}

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
                  <div className="flex justify-between"><span>Template</span><span className="font-medium text-foreground">{template || "None selected"}</span></div>
                  <div className="flex justify-between"><span>Type</span><span className="font-medium text-foreground capitalize">{campaignType}</span></div>
                </div>
              </div>
            </div>

            {/* Right: Preview */}
            <div className="w-[280px] shrink-0">
              <p className="text-xs text-muted-foreground text-center mb-3 font-medium">MESSAGE PREVIEW</p>
              <div className="rounded-xl border bg-muted/20 p-4">
                <div className="bg-white text-zinc-900 rounded-lg p-3 shadow text-sm leading-relaxed relative pb-7">
                  {(() => {
                    const selectedTpl = templates.find(t => t.name === template);
                    if (!selectedTpl) return <div className="text-muted-foreground italic text-xs">No template selected</div>;
                    
                    return (
                      <>
                        {selectedTpl.headerType?.toLowerCase() === "image" ? (
                          <div className="mb-2 -mx-3 -mt-3">
                            {mediaFile ? (
                              <img src={URL.createObjectURL(mediaFile)} alt="Header" className="w-full h-32 object-cover rounded-t-lg" />
                            ) : initialData?.mediaUrl ? (
                              <img src={initialData.mediaUrl} alt="Header" className="w-full h-32 object-cover rounded-t-lg" />
                            ) : selectedTpl.headerContent ? (
                              <img src={selectedTpl.headerContent} alt="Header" className="w-full h-32 object-cover rounded-t-lg" />
                            ) : (
                              <div className="w-full h-32 bg-zinc-200 rounded-t-lg flex items-center justify-center text-xs text-zinc-500">Image Preview</div>
                            )}
                          </div>
                        ) : selectedTpl.headerType?.toLowerCase() === "video" ? (
                          <div className="mb-2 -mx-3 -mt-3 w-full h-32 bg-zinc-800 rounded-t-lg flex items-center justify-center text-xs text-white">
                            ▶ Video Attachment
                          </div>
                        ) : selectedTpl.headerType?.toLowerCase() === "document" ? (
                          <div className="mb-2 p-2 bg-zinc-100 rounded border border-zinc-200 text-xs flex items-center gap-2">
                            📄 Document Attachment
                          </div>
                        ) : selectedTpl.headerContent && (
                          <div className="font-bold mb-1 text-sm">{selectedTpl.headerContent}</div>
                        )}
                        <div className="whitespace-pre-wrap text-[13px]">
                          {selectedTpl.bodyContent}
                        </div>
                        {selectedTpl.footerContent && (
                          <div className="text-[10px] text-zinc-500 mt-2 uppercase tracking-wide">
                            {selectedTpl.footerContent}
                          </div>
                        )}
                      </>
                    );
                  })()}
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
                    let uploadedMediaUrl = initialData?.mediaUrl;
                    if (mediaFile) {
                      const formData = new FormData();
                      formData.append("file", mediaFile);
                      const res = await uploadCampaignMedia(formData);
                      uploadedMediaUrl = res.publicUrl;
                    }

                    const data = {
                      name: campaignName,
                      description,
                      type: campaignType,
                      templateName: template,
                      variableMapping: variable,
                      audienceType: audienceTab,
                      audienceList: finalAudience,
                      audienceCount: parsedCount,
                      status: "Draft",
                      organizationId,
                      whatsAppAccountId: whatsAppAccount,
                      mediaUrl: uploadedMediaUrl,
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
                      let uploadedMediaUrl = initialData?.mediaUrl;
                      if (mediaFile) {
                        const formData = new FormData();
                        formData.append("file", mediaFile);
                        const res = await uploadCampaignMedia(formData);
                        uploadedMediaUrl = res.publicUrl;
                      }

                      const data = {
                        name: campaignName,
                        description,
                        type: campaignType,
                        templateName: template,
                        variableMapping: variable,
                        audienceType: audienceTab,
                        audienceList: finalAudience,
                        audienceCount: parsedCount,
                        status: "Active",
                        organizationId,
                        whatsAppAccountId: whatsAppAccount,
                        mediaUrl: uploadedMediaUrl,
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
