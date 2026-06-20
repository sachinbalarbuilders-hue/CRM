"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import type { Conversation } from "@prisma/client";
import { maskPhone } from "@/lib/phone";

interface ConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  onClick: () => void;
  orgSettings?: Record<string, any>;
}

export function ConversationItem({ conversation, isActive, onClick, orgSettings = {} }: ConversationItemProps) {
  const maskPhoneNumbers = orgSettings.maskPhoneNumbers === true;
  const [, setTick] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setTick(t => t + 1);
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const getRelativeTime = (dateString: string | Date | null) => {
    if (!dateString) return "";
    
    let ds = typeof dateString === 'string' ? dateString : dateString.toISOString();
    // If the timestamp comes from Supabase Realtime without timezone info, it defaults to local time in JS.
    // We force it to UTC by appending 'Z' if it lacks a timezone indicator.
    if (ds.includes('T') && !ds.endsWith('Z') && ds.indexOf('+', ds.indexOf('T')) === -1 && ds.indexOf('-', ds.indexOf('T')) === -1) {
      ds += 'Z';
    }

    const date = new Date(ds);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    
    // Format according to organization settings
    const locale = orgSettings.language === 'es' ? 'es-ES' : orgSettings.language === 'hi' ? 'hi-IN' : 'en-US';
    const timeZone = orgSettings.timezone === 'ist' ? 'Asia/Kolkata' : 
                     orgSettings.timezone === 'est' ? 'America/New_York' : 
                     orgSettings.timezone === 'pst' ? 'America/Los_Angeles' : 
                     orgSettings.timezone === 'gmt' ? 'Europe/London' : 'UTC';

    if (orgSettings.dateFormat === 'mmdd') {
      return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', timeZone }).format(date);
    } else if (orgSettings.dateFormat === 'yyyy') {
      return new Intl.DateTimeFormat(locale, { year: 'numeric', month: '2-digit', day: '2-digit', timeZone }).format(date);
    }
    
    // Default ddmm
    return new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', timeZone }).format(date);
  };

  const timeAgo = getRelativeTime(conversation.lastMessageAt ?? conversation.updatedAt);
    
  // Format short initials for Avatar fallback
  const getInitials = (name?: string | null, phone?: string) => {
    if (name) {
      return name.substring(0, 2).toUpperCase();
    }
    if (phone) {
      return phone.substring(phone.length - 2);
    }
    return "??";
  };

  const rawPhone = conversation.phoneNumber;
  const displayPhone = maskPhoneNumbers ? maskPhone(rawPhone) : rawPhone;
  const displayName = conversation.contactName || displayPhone;

  return (
    <button
      onClick={onClick}
      className={`flex items-start gap-3 rounded-lg p-3 text-left text-sm transition-colors hover:bg-muted ${
        isActive ? "bg-muted font-medium" : ""
      }`}
    >
      <Avatar className="h-10 w-10 border bg-background shrink-0">
        <AvatarFallback className="bg-primary/10 text-primary font-semibold">
          {getInitials(conversation.contactName, conversation.phoneNumber)}
        </AvatarFallback>
      </Avatar>
      
      <div className="flex flex-col gap-1 flex-1 overflow-hidden min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="font-semibold truncate text-foreground">{displayName}</span>
          <span suppressHydrationWarning className="text-xs text-muted-foreground whitespace-nowrap shrink-0">{timeAgo}</span>
        </div>
        
        <div className="flex items-center justify-between gap-2">
          <span className={`truncate text-xs ${conversation.unreadCount > 0 && !isActive ? "text-foreground font-medium" : "text-muted-foreground"}`}>
            {conversation.lastMessage || "No messages yet"}
          </span>
          {conversation.unreadCount > 0 && !isActive && (
            <Badge variant="default" className="rounded-full px-1.5 min-w-[20px] h-5 flex items-center justify-center bg-green-500 hover:bg-green-600 border-0 shrink-0">
              {conversation.unreadCount}
            </Badge>
          )}
        </div>
      </div>
    </button>
  );
}
