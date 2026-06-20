"use client";

import { useState, useEffect, useRef } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MoreVertical, CheckCircle } from "lucide-react";
import { MessageBubble } from "./MessageBubble";
import { MessageInput } from "./MessageInput";
import { getMessages, resolveConversation, markAsRead } from "@/lib/supabase/inbox";
import { supabase } from "@/lib/supabase";
import type { Conversation, Message } from "@prisma/client";
import { toast } from "sonner";

interface ChatWindowProps {
  conversation: Conversation | null;
  orgSettings?: Record<string, any>;
}

export function ChatWindow({ conversation, orgSettings = {} }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const topElementRef = useRef<HTMLDivElement>(null);
  const prevConvIdRef = useRef<string | null>(null);
  
  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  // Fetch messages when conversation changes
  useEffect(() => {
    if (!conversation) {
      setMessages([]);
      prevConvIdRef.current = null;
      return;
    }

    // If it's the same conversation ID, don't refetch all messages!
    // Just mark as read if it has new unread counts.
    if (prevConvIdRef.current === conversation.id) {
      if (conversation.unreadCount > 0) {
        markAsRead(conversation.id).catch(console.error);
      }
      return;
    }

    prevConvIdRef.current = conversation.id;

    async function loadMessages() {
      setIsLoading(true);
      try {
        const data = await getMessages(conversation!.id);
        setMessages(data || []);
        setHasMore((data || []).length === 50);
        
        if (conversation!.unreadCount > 0) {
          await markAsRead(conversation!.id);
        }
      } catch (error) {
        console.error("Failed to load messages:", error);
        toast.error("Failed to load messages");
      } finally {
        setIsLoading(false);
        // Use instant scroll for initial load to prevent getting stuck in the middle
        setTimeout(() => scrollToBottom("auto"), 50);
        // Fallback just in case images/media caused layout shifts
        setTimeout(() => scrollToBottom("auto"), 500);
      }
    }

    loadMessages();
  }, [conversation?.id]);

  // Infinite Scroll Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore && messages.length > 0) {
          const oldestId = messages[0].id;
          setIsLoadingMore(true);
          getMessages(conversation!.id, oldestId).then(older => {
            if (older.length < 50) setHasMore(false);
            if (older.length > 0) {
              const scrollContainer = document.getElementById('chat-scroll-container') as HTMLDivElement;
              const previousScrollHeight = scrollContainer?.scrollHeight || 0;
              setMessages(prev => [...older, ...prev]);
              setTimeout(() => {
                if (scrollContainer) {
                  const newScrollHeight = scrollContainer.scrollHeight;
                  scrollContainer.scrollTop += (newScrollHeight - previousScrollHeight);
                }
              }, 0);
            }
          }).catch(console.error).finally(() => setIsLoadingMore(false));
        }
      },
      { threshold: 0.1 }
    );

    if (topElementRef.current) observer.observe(topElementRef.current);
    return () => observer.disconnect();
  }, [hasMore, isLoadingMore, messages, conversation?.id]);

  // Subscribe to new messages via Supabase Realtime
  useEffect(() => {
    if (!conversation?.id) return;

    const channel = supabase
      .channel(`chat-${conversation.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'Message',
          filter: `conversationId=eq.${conversation.id}`,
        },
        (payload) => {
          setMessages((prev) => {
            const exists = prev.some((m) => m.id === payload.new.id || (payload.new.tempId && m.tempId === payload.new.tempId));
            if (exists) return prev;
            return [...prev, payload.new as Message];
          });
          
          if ((payload.new as Message).direction === 'inbound') {
            markAsRead(conversation.id).catch(console.error);
          }
          
          setTimeout(() => scrollToBottom("smooth"), 100);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'Message',
          filter: `conversationId=eq.${conversation.id}`,
        },
        (payload) => {
          const updatedMessage = payload.new as Message;
          setMessages((prev) => prev.map(m => m.id === updatedMessage.id ? updatedMessage : m));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversation?.id]);



  const handleSendMessage = async (text: string, mediaData?: { mediaUrl: string; mediaType: string; mediaName: string }) => {
    if (!conversation) return;

    const tempId = `temp_${Date.now()}`;
    const optimisticMessage: Message = {
      id: tempId,
      conversationId: conversation.id,
      body: text,
      direction: "outbound",
      status: "sending",
      tempId,
      mediaId: null,
      mediaType: mediaData?.mediaType || null,
      mediaUrl: mediaData?.mediaUrl || null,
      mediaName: mediaData?.mediaName || null,
      waMessageId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setMessages(prev => [...prev, optimisticMessage]);
    setTimeout(() => scrollToBottom("smooth"), 100);

    try {
      const response = await fetch('/api/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: conversation.id,
          text,
          tempId,
          ...(mediaData || {})
        })
      });

      if (!response.ok) throw new Error("Failed to send");
      // The real-time subscription will update the message status
    } catch (error) {
      toast.error("Failed to send message");
      setMessages(prev => prev.map(m => 
        m.id === tempId ? { ...m, status: "failed" } : m
      ));
    }
  };

  const handleResolve = async () => {
    if (!conversation) return;
    setIsResolving(true);
    try {
      await resolveConversation(conversation.id);
      toast.success("Conversation resolved");
    } catch (error) {
      toast.error("Failed to resolve conversation");
    } finally {
      setIsResolving(false);
    }
  };

  if (!conversation) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-muted/10 h-full">
        <div className="rounded-full bg-muted p-6 mb-4">
          <svg className="w-12 h-12 text-muted-foreground/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-foreground">No conversation selected</h3>
        <p className="text-muted-foreground mt-2 max-w-sm text-center">
          Select a conversation from the list or search for a contact to start chatting.
        </p>
      </div>
    );
  }

  const getInitials = (name?: string | null, phone?: string) => {
    if (name) return name.substring(0, 2).toUpperCase();
    if (phone) return phone.substring(phone.length - 2);
    return "??";
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 h-full">
      {/* Header */}
      <div className="flex items-center justify-between border-b p-4 bg-background z-10 shrink-0 h-[73px]">
        <div className="flex items-center gap-3">
          <Avatar className="border">
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {getInitials(conversation.contactName, conversation.phoneNumber)}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold">{conversation.contactName || conversation.phoneNumber}</h2>
              {conversation.status === "resolved" ? (
                <Badge variant="secondary" className="text-[10px] h-4 px-1.5 font-medium bg-muted text-muted-foreground">Resolved</Badge>
              ) : (
                <Badge variant="outline" className="text-[10px] h-4 px-1.5 font-medium text-green-600 border-green-200 bg-green-50">Open</Badge>
              )}
            </div>
            {conversation.contactName && (
              <p className="text-xs text-muted-foreground">{conversation.phoneNumber}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {conversation.status !== "resolved" && (
            <Button 
              variant="outline" 
              size="sm" 
              className="hidden sm:flex items-center gap-1.5 h-8 text-xs"
              onClick={handleResolve}
              disabled={isResolving}
            >
              <CheckCircle className="w-3.5 h-3.5" />
              Resolve
            </Button>
          )}
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 relative overflow-hidden flex flex-col bg-slate-50/50 dark:bg-zinc-950/50">
        {/* Subtle WhatsApp-like background pattern */}
        <div className="absolute inset-0 bg-[url('https://i.pinimg.com/736x/8c/98/99/8c98994518b575bfd8c949e91d20548b.jpg')] bg-repeat opacity-[0.03] dark:invert dark:opacity-[0.02] pointer-events-none z-0"></div>
        
        <div id="chat-scroll-container" className="flex-1 overflow-y-auto p-4 relative z-10 scroll-smooth">
          <div className="flex flex-col gap-3 min-h-full justify-end pb-2">
            {hasMore && !isLoading && messages.length > 0 && (
              <div ref={topElementRef} className="h-4 w-full" />
            )}
            
            {isLoadingMore && (
              <div className="flex justify-center py-2">
                <span className="text-xs text-muted-foreground bg-background/80 px-3 py-1 rounded-full border shadow-sm backdrop-blur-sm">
                  Loading older messages...
                </span>
              </div>
            )}
            
            {isLoading && messages.length === 0 ? (
              <div className="flex justify-center py-4">
                <span className="text-xs text-muted-foreground bg-background/80 px-3 py-1 rounded-full border shadow-sm backdrop-blur-sm">
                  Loading messages...
                </span>
              </div>
            ) : !hasMore && messages.length > 0 ? (
              <div className="flex justify-center py-4">
                <span className="text-xs text-muted-foreground bg-background/80 px-3 py-1 rounded-full border shadow-sm backdrop-blur-sm">
                  Start of conversation
                </span>
              </div>
            ) : null}
            
            {!isLoading && messages.length === 0 ? (
              <div className="flex justify-center py-4">
                <span className="text-xs text-muted-foreground bg-background/80 px-3 py-1 rounded-full border shadow-sm backdrop-blur-sm">
                  No messages yet
                </span>
              </div>
            ) : (
              messages.map((message) => (
                <MessageBubble 
                  key={message.id}
                  message={message} 
                  orgSettings={orgSettings}
                />
              ))
            )}
            <div ref={messagesEndRef} className="h-px w-full" />
          </div>
        </div>
      </div>

      {/* Input */}
      <div className="shrink-0 z-10">
        <MessageInput 
          onSendMessage={handleSendMessage} 
          disabled={conversation.status === "resolved"}
        />
      </div>
    </div>
  );
}
