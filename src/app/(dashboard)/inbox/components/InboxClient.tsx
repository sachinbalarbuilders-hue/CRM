"use client";

import { useState, useEffect } from "react";
import { ConversationList } from "./ConversationList";
import { ChatWindow } from "./ChatWindow";
import type { Conversation } from "@prisma/client";
import { supabase } from "@/lib/supabase";

interface InboxClientProps {
  initialConversations: Conversation[];
  organizationId: string;
  organizations: { id: string; name: string }[];
  orgSettings?: Record<string, any>;
}

export function InboxClient({ initialConversations, organizationId, organizations, orgSettings = {} }: InboxClientProps) {
  const [conversations, setConversations] = useState<Conversation[]>(initialConversations);
  const [activeConversationId, setActiveConversationIdState] = useState<string | null>(null);

  // Initialize from URL on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const chat = params.get("chat");
      if (chat) {
        setActiveConversationIdState(chat);
      }
    }
  }, []);

  const setActiveConversationId = (id: string | null) => {
    setActiveConversationIdState(id);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      if (id) {
        url.searchParams.set("chat", id);
      } else {
        url.searchParams.delete("chat");
      }
      window.history.replaceState({}, '', url.toString());
    }
  };

  // Set up Supabase real-time subscription for conversations
  useEffect(() => {
    if (!organizationId) return;

    const channel = supabase
      .channel('conversations_channel')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'Conversation',
          filter: `organizationId=eq.${organizationId}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newConv = payload.new as Conversation;
            setConversations((prev) => [newConv, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            const updatedConv = payload.new as Conversation;
            setConversations((prev) => {
              // Replace the updated conversation and sort by lastMessageAt descending
              const filtered = prev.filter(c => c.id !== updatedConv.id);
              const merged = [updatedConv, ...filtered];
              return merged.sort((a, b) => {
                const dateA = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
                const dateB = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
                return dateB - dateA;
              });
            });
          } else if (payload.eventType === 'DELETE') {
            setConversations((prev) => prev.filter(c => c.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [organizationId]);

  const activeConversation = activeConversationId
    ? conversations.find(c => c.id === activeConversationId) || null
    : null;

  return (
    <>
      <ConversationList 
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={setActiveConversationId}
        organizations={organizations}
        activeOrganizationId={organizationId}
        orgSettings={orgSettings}
      />
      <ChatWindow 
        conversation={activeConversation}
        orgSettings={orgSettings}
      />
    </>
  );
}
