"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Save, Send, Loader2 } from "lucide-react";
import Link from "next/link";
import { ScrollArea } from "@/components/ui/scroll-area";
import { createTemplate, updateTemplate } from "../actions";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function NewTemplateClient({ 
  organizationId, 
  templateId, 
  initialData,
  accounts
}: { 
  organizationId: string;
  templateId?: string;
  initialData?: any;
  accounts?: any[];
}) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  
  const [templateName, setTemplateName] = useState(initialData?.name || "");
  const [category, setCategory] = useState(initialData?.category || "marketing");
  const [language, setLanguage] = useState(initialData?.language || "en_US");
  const [headerType, setHeaderType] = useState(initialData?.headerType || "text");
  const [headerContent, setHeaderContent] = useState(initialData?.headerContent || "");
  const [bodyContent, setBodyContent] = useState(initialData?.bodyContent || "Hi {{1}}, thank you for registering with us!");
  const [footerContent, setFooterContent] = useState(initialData?.footerContent || "");
  const [headerFile, setHeaderFile] = useState<File | null>(null);
  const [accountId, setAccountId] = useState(initialData?.whatsAppAccountId || (accounts && accounts.length > 0 ? accounts[0].id : ""));

  const handleSave = async (status: string) => {
    if (!templateName.trim() || !bodyContent.trim()) {
      toast.error("Template name and body are required");
      return;
    }

    if (!accountId) {
      toast.error("Please select a WhatsApp account");
      return;
    }

    const isMedia = headerType === "image" || headerType === "video" || headerType === "document";
    const isChangingToMedia = isMedia && initialData?.headerType !== headerType;
    
    if (isMedia && !headerFile && (!templateId || isChangingToMedia)) {
      toast.error("A sample file is required for media templates.");
      return;
    }
    
    setIsSaving(true);
    try {
      const formData = new FormData();
      formData.append("name", templateName);
      formData.append("category", category);
      formData.append("language", language);
      formData.append("headerType", headerType);
      formData.append("bodyContent", bodyContent);
      if (footerContent) formData.append("footerContent", footerContent);
      if (headerType === "text" && headerContent) formData.append("headerContent", headerContent);
      formData.append("status", status);
      formData.append("organizationId", organizationId);
      formData.append("whatsAppAccountId", accountId);
      
      if (headerFile) {
        formData.append("file", headerFile);
      }

      if (templateId) {
        await updateTemplate(templateId, formData);
      } else {
        await createTemplate(formData);
      }
      
      toast.success(status === "Draft" ? "Template saved as draft" : "Template submitted for approval");
      router.push("/templates");
    } catch (error: any) {
      toast.error(error.message || "Failed to save template");
    } finally {
      setIsSaving(false);
    }
  };

  const formatWhatsAppText = (text: string) => {
    if (!text) return null;
    const html = text
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\*([^\*]+)\*/g, "<strong>$1</strong>")
      .replace(/_([^_]+)_/g, "<em>$1</em>")
      .replace(/~([^~]+)~/g, "<del>$1</del>")
      .replace(/```([\s\S]*?)```/g, "<code class='bg-gray-100 p-1 rounded'>$1</code>");
    return <span dangerouslySetInnerHTML={{ __html: html }} />;
  };

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/templates">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">{templateId ? "Edit Template" : "Create Template"}</h2>
            <p className="text-muted-foreground text-sm">{templateId ? "Update your draft WhatsApp template." : "Design and submit a new WhatsApp template."}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => handleSave("Draft")} disabled={isSaving}>
            <Save className="mr-2 h-4 w-4"/> Save Draft
          </Button>
          <Button onClick={() => handleSave("Pending")} disabled={isSaving} className="bg-green-600 hover:bg-green-700 text-white">
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4"/>}
            Submit for Approval
          </Button>
        </div>
      </div>

      <div className="flex flex-1 gap-6 overflow-hidden">
        {/* Editor Form */}
        <div className="flex-1 overflow-y-auto pr-2 pb-8 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Template Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Template Name</Label>
                <Input 
                  id="name" 
                  placeholder="e.g., welcome_message_v1" 
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value.toLowerCase().replace(/\s+/g, '_'))}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                {accounts && accounts.length > 0 && (
                  <div className="space-y-2 col-span-2">
                    <Label>WhatsApp Account</Label>
                    <Select value={accountId} onValueChange={setAccountId} disabled={!!templateId}>
                      <SelectTrigger>
                        <span className="truncate">{accounts?.find(a => a.id === accountId)?.name || "Select account"}</span>
                      </SelectTrigger>
                      <SelectContent>
                        {accounts.map(acc => (
                          <SelectItem key={acc.id} value={acc.id}>{acc.name} ({acc.wabaId})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger>
                      <span className="truncate">{category === "marketing" ? "Marketing" : category === "utility" ? "Utility" : "Authentication"}</span>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="marketing">Marketing</SelectItem>
                      <SelectItem value="utility">Utility</SelectItem>
                      <SelectItem value="authentication">Authentication</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Language</Label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger>
                      <span className="truncate">
                        {language === "en_US" ? "English (US)" : 
                         language === "en_GB" ? "English (UK)" : 
                         language === "en" ? "English" : 
                         language === "hi_IN" || language === "hi" ? "Hindi" : 
                         language}
                      </span>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="en_US">English (US)</SelectItem>
                      <SelectItem value="en_GB">English (UK)</SelectItem>
                      <SelectItem value="hi_IN">Hindi</SelectItem>
                      <SelectItem value="hi">Hindi (Generic)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Template Content</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Header */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base">Header <span className="text-muted-foreground text-xs font-normal">(Optional)</span></Label>
                  <Select value={headerType} onValueChange={setHeaderType}>
                    <SelectTrigger className="w-[180px]">
                      <span className="truncate text-capitalize">{headerType}</span>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="text">Text</SelectItem>
                      <SelectItem value="image">Image</SelectItem>
                      <SelectItem value="document">Document</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {headerType === "text" && (
                  <Input 
                    placeholder="Header text..." 
                    value={headerContent}
                    onChange={(e) => setHeaderContent(e.target.value)}
                  />
                )}
                {(headerType === "image" || headerType === "video" || headerType === "document") && (
                  <div className="border-2 border-dashed rounded-md p-6 flex flex-col items-center justify-center text-muted-foreground relative">
                    <p className="text-sm mb-2">{headerFile ? headerFile.name : "Sample file upload required for approval"}</p>
                    <Input 
                      type="file" 
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      accept={headerType === "image" ? "image/*" : headerType === "video" ? "video/*" : ".pdf,.doc,.docx"}
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setHeaderFile(e.target.files[0]);
                        }
                      }}
                    />
                    <Button variant="outline" size="sm" className="pointer-events-none">
                      {headerFile ? "Change File" : "Choose File"}
                    </Button>
                  </div>
                )}
              </div>

              {/* Body */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-base">Body <span className="text-red-500">*</span></Label>
                  <span className="text-xs text-muted-foreground">Use {'{{1}}'}, {'{{2}}'} for variables</span>
                </div>
                <Textarea 
                  className="min-h-[150px]" 
                  placeholder="Enter message body here..." 
                  value={bodyContent}
                  onChange={(e) => setBodyContent(e.target.value)}
                />
              </div>

              {/* Footer */}
              <div className="space-y-2">
                <Label className="text-base">Footer <span className="text-muted-foreground text-xs font-normal">(Optional)</span></Label>
                <Input 
                  placeholder="Short footer text (e.g., Reply STOP to unsubscribe)" 
                  value={footerContent}
                  onChange={(e) => setFooterContent(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Live Preview Panel */}
        <div className="w-[480px] flex-shrink-0 flex flex-col items-center border rounded-xl bg-muted/20 p-6 overflow-y-auto">
          <h3 className="font-semibold mb-6 text-muted-foreground">Live Preview</h3>
          
          <div className="w-full max-w-[400px] h-[750px] bg-[#efeae2] bg-[url('https://i.pinimg.com/736x/8c/98/99/8c98994518b575bfd8c949e91d20548b.jpg')] bg-cover bg-center border border-gray-200 overflow-hidden relative flex flex-col font-sans">
            
            {/* Message Area */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              
              <div className="bg-white text-[#111b21] rounded-lg p-2 shadow-sm text-[14.2px] leading-[19px] relative pb-5 w-max max-w-[100%] self-start rounded-tl-none">
                {/* Bubble Tail SVG */}
                <svg viewBox="0 0 8 13" width="8" height="13" className="absolute top-0 -left-[8px] text-white">
                  <path opacity="1" fill="currentColor" d="M1.533 3.568 8 12.193V1H2.812C1.042 1 .474 2.099 1.533 3.568z"></path>
                </svg>

                {headerType === "text" && headerContent && (
                  <div className="font-bold mb-1 px-1 pt-1">{headerContent}</div>
                )}
                
                {(headerType === "image" || headerType === "video" || headerType === "document") && (
                  <div className="w-full min-w-[250px] aspect-video bg-[#e4e6eb] rounded-md mb-2 flex items-center justify-center overflow-hidden">
                    {headerFile ? (
                      <span className="truncate px-2 text-xs text-muted-foreground">{headerFile.name}</span>
                    ) : headerType === "image" && headerContent && headerContent.startsWith("http") ? (
                      <img src={headerContent} alt="Header" className="w-full h-full object-cover" />
                    ) : headerType === "video" && headerContent && headerContent.startsWith("http") ? (
                      <video src={headerContent} controls className="w-full h-full object-cover" />
                    ) : headerType === "document" ? (
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#bcc0c4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                    ) : (
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#bcc0c4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                    )}
                  </div>
                )}

                <div className="whitespace-pre-wrap break-words px-1">
                  {bodyContent ? formatWhatsAppText(bodyContent) : "Message body..."}
                </div>

                {footerContent && (
                  <div className="text-[13px] text-zinc-500 mt-2 px-1">
                    {footerContent}
                  </div>
                )}

                <div className="absolute bottom-1 right-2 text-[11px] text-zinc-500">
                  11:00
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
