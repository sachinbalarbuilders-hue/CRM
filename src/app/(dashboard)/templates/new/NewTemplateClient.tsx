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
  initialData 
}: { 
  organizationId: string;
  templateId?: string;
  initialData?: any;
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

  const handleSave = async (status: string) => {
    if (!templateName.trim() || !bodyContent.trim()) {
      toast.error("Template name and body are required");
      return;
    }
    
    setIsSaving(true);
    try {
      const data = {
        name: templateName,
        category,
        language,
        headerType,
        headerContent: headerType === "text" ? headerContent : undefined,
        bodyContent,
        footerContent,
        status,
        organizationId,
      };

      if (templateId) {
        await updateTemplate(templateId, data);
      } else {
        await createTemplate(data);
      }
      
      toast.success(status === "Draft" ? "Template saved as draft" : "Template submitted for approval");
      router.push("/templates");
    } catch (error: any) {
      toast.error("Failed to save template");
    } finally {
      setIsSaving(false);
    }
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
                      <span className="truncate">{language === "en_US" ? "English (US)" : language === "en_GB" ? "English (UK)" : "Hindi"}</span>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en_US">English (US)</SelectItem>
                      <SelectItem value="en_GB">English (UK)</SelectItem>
                      <SelectItem value="hi_IN">Hindi</SelectItem>
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
                {(headerType === "image" || headerType === "document") && (
                  <div className="border-2 border-dashed rounded-md p-6 flex flex-col items-center justify-center text-muted-foreground">
                    <p className="text-sm">Sample file upload required for approval</p>
                    <Button variant="outline" size="sm" className="mt-2">Choose File</Button>
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
        <div className="w-[400px] flex-shrink-0 flex flex-col items-center border rounded-xl bg-muted/20 p-6 overflow-y-auto">
          <h3 className="font-semibold mb-6 text-muted-foreground">Live Preview</h3>
          
          <div className="w-[320px] h-[650px] bg-[url('https://i.pinimg.com/736x/8c/98/99/8c98994518b575bfd8c949e91d20548b.jpg')] bg-cover bg-center rounded-[3rem] border-[8px] border-zinc-800 shadow-xl overflow-hidden relative flex flex-col">
            {/* WhatsApp Header Mock */}
            <div className="bg-[#075e54] text-white px-4 py-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-xs">P</div>
              <div className="font-semibold text-sm">Plot CRM</div>
            </div>
            
            {/* Message Area */}
            <ScrollArea className="flex-1 p-4">
              <div className="bg-white text-zinc-900 rounded-lg p-3 shadow-sm text-[14px] leading-relaxed relative pb-6 w-max max-w-[90%]">
                
                {headerType === "text" && headerContent && (
                  <div className="font-bold mb-1">{headerContent}</div>
                )}
                {(headerType === "image" || headerType === "document") && (
                  <div className="w-full h-32 bg-muted rounded mb-2 flex items-center justify-center text-xs text-muted-foreground">
                    [Media Header]
                  </div>
                )}

                <div className="whitespace-pre-wrap">
                  {bodyContent || "Message body..."}
                </div>

                {footerContent && (
                  <div className="text-[11px] text-zinc-500 mt-2 uppercase tracking-wide">
                    {footerContent}
                  </div>
                )}

                <div className="absolute bottom-1.5 right-2 text-[10px] text-zinc-400">
                  12:00 PM
                </div>
              </div>
            </ScrollArea>
          </div>
        </div>

      </div>
    </div>
  );
}
