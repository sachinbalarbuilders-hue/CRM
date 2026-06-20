"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus, Loader2 } from "lucide-react";
import { createConversation } from "@/lib/supabase/inbox";
import { toast } from "sonner";

interface NewChatDialogProps {
  organizations: { id: string; name: string }[];
  activeOrganizationId: string;
  onSuccess: (conversationId: string) => void;
  trigger?: React.ReactElement;
}

export function NewChatDialog({ organizations, activeOrganizationId, onSuccess, trigger }: NewChatDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [orgId, setOrgId] = useState(activeOrganizationId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !orgId) {
      toast.error("Phone number and organization are required");
      return;
    }

    setIsLoading(true);
    try {
      const conv = await createConversation({
        contactName: name.trim(),
        phoneNumber: phone.trim(),
        organizationId: orgId
      });
      
      toast.success("Chat started");
      setOpen(false);
      setName("");
      setPhone("");
      onSuccess(conv.id);
    } catch (error: any) {
      toast.error(error.message || "Failed to start chat");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? (
        <DialogTrigger render={trigger} />
      ) : (
        <DialogTrigger className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground h-9 w-9 shrink-0 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50">
          <UserPlus className="h-5 w-5 text-muted-foreground" />
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Start New Chat</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="name">Contact Name (Optional)</Label>
            <Input 
              id="name" 
              placeholder="John Doe" 
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Mobile Number</Label>
            <Input 
              id="phone" 
              placeholder="+1234567890" 
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>
          {organizations.length > 1 && (
            <div className="space-y-2">
              <Label htmlFor="org">Organization</Label>
              <Select value={orgId} onValueChange={setOrgId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select organization" />
                </SelectTrigger>
                <SelectContent>
                  {organizations.map((org) => (
                    <SelectItem key={org.id} value={org.id}>
                      {org.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="flex justify-end pt-4">
            <Button type="submit" disabled={isLoading} className="gap-2">
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              {isLoading ? "Starting..." : "Start Chat"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
