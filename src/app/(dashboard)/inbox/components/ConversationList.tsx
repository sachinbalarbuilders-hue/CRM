"use client";

import { useState, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { ConversationItem } from "./ConversationItem";
import { NewChatDialog } from "./NewChatDialog";
import type { Conversation } from "@prisma/client";
import { supabase } from "@/lib/supabase";

interface ConversationListProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  organizations: { id: string; name: string }[];
  activeOrganizationId: string;
  orgSettings?: Record<string, any>;
  filter: "open" | "all";
  setFilter: (filter: "open" | "all") => void;
}

export function ConversationList({ 
  conversations, 
  activeConversationId, 
  onSelectConversation,
  organizations,
  activeOrganizationId,
  orgSettings = {},
  filter,
  setFilter,
}: ConversationListProps) {
  const [search, setSearch] = useState("");

  // Filter by search query
  const filteredConversations = conversations.filter(c => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      (c.contactName?.toLowerCase().includes(s)) ||
      (c.phoneNumber.includes(s))
    );
  });

  return (
    <div className="w-80 flex-shrink-0 border-r flex flex-col bg-muted/30 h-full">
      <div className="p-4 border-b flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search contacts..."
            className="pl-8 bg-background h-9 text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <NewChatDialog 
          organizations={organizations} 
          activeOrganizationId={activeOrganizationId} 
          onSuccess={onSelectConversation}
        />
      </div>
      
      <div className="flex border-b text-sm">
        <button 
          onClick={() => setFilter("open")}
          className={`flex-1 py-2 text-center transition-colors ${filter === "open" ? "border-b-2 border-primary font-medium text-foreground" : "text-muted-foreground hover:bg-muted"}`}
        >
          Open
        </button>
        <button 
          onClick={() => setFilter("all")}
          className={`flex-1 py-2 text-center transition-colors ${filter === "all" ? "border-b-2 border-primary font-medium text-foreground" : "text-muted-foreground hover:bg-muted"}`}
        >
          All
        </button>
      </div>

      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-1 p-2">
          {filteredConversations.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No conversations found.
            </div>
          ) : (
            filteredConversations.map((conv) => (
              <ConversationItem
                key={conv.id}
                conversation={conv}
                isActive={conv.id === activeConversationId}
                onClick={() => onSelectConversation(conv.id)}
                orgSettings={orgSettings}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
