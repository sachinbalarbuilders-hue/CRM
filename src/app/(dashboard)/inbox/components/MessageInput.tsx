"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Paperclip, Send, Smile, X, Loader2 } from "lucide-react";
import EmojiPicker, { Theme } from 'emoji-picker-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";

interface MessageInputProps {
  onSendMessage: (text: string, mediaData?: { mediaUrl: string; mediaType: string; mediaName: string }) => void;
  disabled?: boolean;
}

export function MessageInput({ onSendMessage, disabled }: MessageInputProps) {
  const [text, setText] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const adjustHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  };

  useEffect(() => {
    adjustHeight();
  }, [text]);

  const handleSend = async () => {
    if ((text.trim() || selectedFile) && !disabled && !isUploading) {
      let mediaData;
      
      if (selectedFile) {
        setIsUploading(true);
        const formData = new FormData();
        formData.append("file", selectedFile);
        
        try {
          const res = await fetch("/api/upload-media", {
            method: "POST",
            body: formData,
          });
          
          if (!res.ok) throw new Error("Upload failed");
          const data = await res.json();
          mediaData = {
            mediaUrl: data.url,
            mediaType: data.mediaType,
            mediaName: data.mediaName
          };
        } catch (error) {
          toast.error("Failed to upload file");
          setIsUploading(false);
          return;
        }
      }

      onSendMessage(text.trim(), mediaData);
      setText("");
      clearFile();
      setIsUploading(false);
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (file.type.startsWith("image/") || file.type.startsWith("video/")) {
        setPreviewUrl(URL.createObjectURL(file));
      } else {
        setPreviewUrl(null);
      }
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const onEmojiClick = (emojiObject: any) => {
    setText((prev) => prev + emojiObject.emoji);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="p-4 border-t bg-background">
      {selectedFile && (
        <div className="mb-2 p-2 bg-muted/30 rounded-lg flex items-center justify-between border max-w-sm">
          <div className="flex items-center gap-2 truncate">
            {previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={previewUrl} alt="Preview" className="w-10 h-10 object-cover rounded" />
            ) : (
              <div className="w-10 h-10 bg-muted flex items-center justify-center rounded">
                <Paperclip className="w-5 h-5 text-muted-foreground" />
              </div>
            )}
            <div className="flex flex-col truncate">
              <span className="text-sm font-medium truncate">{selectedFile.name}</span>
              <span className="text-xs text-muted-foreground">{(selectedFile.size / 1024).toFixed(1)} KB</span>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={clearFile}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
      
      <div className="flex items-end gap-2 bg-muted/50 rounded-2xl p-2 border focus-within:ring-1 focus-within:ring-ring focus-within:border-primary transition-all">
        <Popover>
          <PopoverTrigger className="shrink-0 rounded-full h-10 w-10 text-muted-foreground hover:bg-background self-end inline-flex items-center justify-center">
            <Smile className="h-5 w-5" />
          </PopoverTrigger>
          <PopoverContent side="top" align="start" className="p-0 border-none shadow-none bg-transparent mb-2">
            <EmojiPicker onEmojiClick={onEmojiClick} theme={Theme.LIGHT} />
          </PopoverContent>
        </Popover>

        <Button 
          variant="ghost" 
          size="icon" 
          className="shrink-0 rounded-full h-10 w-10 text-muted-foreground hover:bg-background self-end"
          onClick={() => fileInputRef.current?.click()}
        >
          <Paperclip className="h-5 w-5" />
        </Button>
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          onChange={handleFileChange}
        />

        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          disabled={disabled || isUploading}
          className="flex-1 bg-transparent border-0 focus-visible:outline-none resize-none min-h-[40px] max-h-[120px] py-2.5 px-2 text-sm disabled:opacity-50 overflow-y-auto"
          rows={1}
        />
        <Button 
          size="icon" 
          onClick={handleSend}
          disabled={(!text.trim() && !selectedFile) || disabled || isUploading}
          className="shrink-0 rounded-full h-10 w-10 self-end transition-transform active:scale-95"
        >
          {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 ml-0.5" />}
        </Button>
      </div>
    </div>
  );
}
