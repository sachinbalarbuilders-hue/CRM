import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Check, CheckCheck, Clock } from "lucide-react";
import type { Message } from "@prisma/client";

interface MessageBubbleProps {
  message: Message;
  orgSettings?: Record<string, any>;
}

export function MessageBubble({ message, orgSettings = {} }: MessageBubbleProps) {
  const isOutbound = message.direction === "outbound";

  return (
    <div
      className={cn(
        "flex w-max max-w-[75%] flex-col gap-1 rounded-lg px-3 py-2 text-sm shadow-sm",
        isOutbound
          ? "bg-green-100 text-green-900 self-end dark:bg-green-900/40 dark:text-green-100"
          : "bg-background border self-start"
      )}
    >
      {/* Image */}
      {message.mediaType === 'image' && message.mediaUrl && (
        <img
          src={message.mediaUrl}
          alt={message.body ?? 'Image'}
          className="max-w-[280px] rounded-lg cursor-pointer"
          onClick={() => window.open(message.mediaUrl!, '_blank')}
          onError={(e) => e.currentTarget.src = '/placeholder-image.png'}
        />
      )}

      {/* Video */}
      {message.mediaType === 'video' && message.mediaUrl && (
        <video
          src={message.mediaUrl}
          controls
          className="max-w-[280px] rounded-lg"
        />
      )}

      {/* Audio / Voice note */}
      {message.mediaType === 'audio' && message.mediaUrl && (
        <audio
          src={message.mediaUrl}
          controls
          className="w-[250px]"
        />
      )}

      {/* Document / PDF */}
      {message.mediaType === 'document' && message.mediaUrl && (
        <a
          href={message.mediaUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-sm hover:opacity-80"
        >
          📄 {message.mediaName ?? 'Download Document'}
        </a>
      )}

      {/* Sticker */}
      {message.mediaType === 'sticker' && message.mediaUrl && (
        <img
          src={message.mediaUrl}
          alt="Sticker"
          className="w-[120px] h-[120px] object-contain"
        />
      )}

      {/* Plain text */}
      {!message.mediaType && message.body && (
        <p className="whitespace-pre-wrap break-words">{message.body}</p>
      )}

      {/* Caption below media */}
      {message.mediaType && message.body && (
        <p className="text-xs mt-1 whitespace-pre-wrap break-words">{message.body}</p>
      )}
      <div
        className={cn(
          "flex items-center gap-1 text-[10px] self-end mt-1",
          isOutbound ? "text-green-700/70 dark:text-green-300/70" : "text-muted-foreground"
        )}
      >
        <span>
          {new Intl.DateTimeFormat(orgSettings.language === 'es' ? 'es-ES' : orgSettings.language === 'hi' ? 'hi-IN' : 'en-US', {
            hour: 'numeric',
            minute: 'numeric',
            hour12: true,
            timeZone: orgSettings.timezone === 'ist' ? 'Asia/Kolkata' : 
                      orgSettings.timezone === 'est' ? 'America/New_York' : 
                      orgSettings.timezone === 'pst' ? 'America/Los_Angeles' : 
                      orgSettings.timezone === 'gmt' ? 'Europe/London' : 'UTC'
          }).format(new Date(message.createdAt))}
        </span>
        {isOutbound && (
          <span className="ml-0.5">
            {message.status === "sending" && <Clock className="h-3 w-3" />}
            {message.status === "sent" && <Check className="h-3 w-3" />}
            {message.status === "delivered" && <CheckCheck className="h-3 w-3" />}
            {message.status === "read" && <CheckCheck className="h-3 w-3 text-blue-500" />}
            {message.status === "failed" && <span className="text-red-500">Failed</span>}
          </span>
        )}
      </div>
    </div>
  );
}
