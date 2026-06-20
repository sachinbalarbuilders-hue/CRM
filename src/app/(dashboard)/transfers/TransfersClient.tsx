"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { assignConversationToMe } from "./actions";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow, format } from "date-fns";
import { UserPlus, User, Clock, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type TransferConversation = {
  id: string;
  contactName: string | null;
  phoneNumber: string;
  lastMessage?: string | null;
  lastMessageAt?: Date | null;
  updatedAt?: Date | null;
  assignedTo?: {
    name: string | null;
    email: string;
  } | null;
};

export default function TransfersClient({
  conversations,
  history
}: {
  conversations: TransferConversation[],
  history: TransferConversation[]
}) {
  const router = useRouter();
  const [pickingId, setPickingId] = useState<string | null>(null);

  const handlePick = async (id: string) => {
    setPickingId(id);
    const res = await assignConversationToMe(id);
    if (res.success) {
      toast.success("Assigned to you!");
      router.push(`/inbox?chat=${id}`);
    } else {
      toast.error(res.error || "Failed to assign");
      setPickingId(null);
    }
  };

  const QueueTab = () => {
    if (conversations.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-[50vh] text-center border rounded-xl bg-background mt-4">
          <div className="bg-muted p-4 rounded-full mb-4">
            <User className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold mb-2">No Waiting Transfers</h2>
          <p className="text-muted-foreground">There are currently no conversations waiting for an agent.</p>
        </div>
      );
    }

    return (
      <div className="bg-background rounded-xl border shadow-sm overflow-hidden mt-4">
        <div className="grid grid-cols-12 gap-4 p-4 border-b bg-muted/40 text-sm font-medium text-muted-foreground">
          <div className="col-span-3">Contact</div>
          <div className="col-span-5">Last Message</div>
          <div className="col-span-2">Waiting Time</div>
          <div className="col-span-2 text-right">Action</div>
        </div>
        
        <div className="divide-y">
          {conversations.map((conv) => (
            <div key={conv.id} className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-muted/30 transition-colors">
              <div className="col-span-3">
                <div className="font-medium">{conv.contactName || "Unknown Contact"}</div>
                <div className="text-xs text-muted-foreground mt-0.5">+{conv.phoneNumber}</div>
              </div>
              <div className="col-span-5 flex items-start gap-2">
                <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div className="text-sm truncate" title={conv.lastMessage || "No message"}>
                  {conv.lastMessage || <span className="italic text-muted-foreground">No message</span>}
                </div>
              </div>
              <div className="col-span-2 flex items-center gap-1.5 text-sm text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                {conv.lastMessageAt ? formatDistanceToNow(new Date(conv.lastMessageAt), { addSuffix: true }) : "Unknown"}
              </div>
              <div className="col-span-2 text-right">
                <Button 
                  size="sm" 
                  onClick={() => handlePick(conv.id)}
                  disabled={pickingId === conv.id}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  <UserPlus className="h-4 w-4 mr-1.5" />
                  {pickingId === conv.id ? "Picking..." : "Pick"}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const HistoryTab = () => {
    if (history.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-[50vh] text-center border rounded-xl bg-background mt-4">
          <h2 className="text-xl font-semibold mb-2">No History Yet</h2>
          <p className="text-muted-foreground">Conversations picked up by agents will appear here.</p>
        </div>
      );
    }

    return (
      <div className="bg-background rounded-xl border shadow-sm overflow-hidden mt-4">
        <div className="p-4 border-b bg-background">
          <h2 className="text-lg font-semibold tracking-tight">Transfer History</h2>
          <p className="text-sm text-muted-foreground">Resumed transfers</p>
        </div>
        <div className="grid grid-cols-5 gap-4 p-4 border-b bg-muted/40 text-sm font-medium text-muted-foreground">
          <div className="col-span-1">Contact</div>
          <div className="col-span-1">Phone</div>
          <div className="col-span-1">Handled By</div>
          <div className="col-span-1">Transferred At</div>
          <div className="col-span-1">Resumed At</div>
        </div>
        
        <div className="divide-y">
          {history.map((conv) => (
            <div key={conv.id} className="grid grid-cols-5 gap-4 p-4 items-center hover:bg-muted/30 transition-colors">
              <div className="col-span-1 font-medium">
                {conv.contactName || "Unknown Contact"}
              </div>
              <div className="col-span-1 text-sm text-muted-foreground">
                +{conv.phoneNumber.replace(/(\d{2})(\d+)(\d{4})/, "$1******$3")}
              </div>
              <div className="col-span-1 text-sm">
                {conv.assignedTo?.name || conv.assignedTo?.email || "-"}
              </div>
              <div className="col-span-1 text-sm text-muted-foreground">
                {conv.lastMessageAt ? format(new Date(conv.lastMessageAt), "dd/MM/yyyy, HH:mm:ss") : "-"}
              </div>
              <div className="col-span-1 text-sm text-muted-foreground">
                {conv.updatedAt ? format(new Date(conv.updatedAt), "dd/MM/yyyy, HH:mm:ss") : "-"}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Transfers Queue</h1>
        <p className="text-muted-foreground mt-2">Manage customer conversations waiting for human agents.</p>
      </div>

      <Tabs defaultValue="queue" className="w-full flex flex-col">
        <TabsList className="bg-muted inline-flex w-fit items-center justify-center rounded-lg p-1">
          <TabsTrigger value="queue" className="px-4">Queue ({conversations.length})</TabsTrigger>
          <TabsTrigger value="history" className="px-4">History</TabsTrigger>
        </TabsList>
        <TabsContent value="queue">
          <QueueTab />
        </TabsContent>
        <TabsContent value="history">
          <HistoryTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
