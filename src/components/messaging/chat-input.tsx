"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { sendMessage } from "@/lib/supabase/actions";
import { Send } from "lucide-react";
import { toast } from "sonner";

interface ChatInputProps {
  jobRequestId: string;
  disabled?: boolean;
}

export function ChatInput({ jobRequestId, disabled }: ChatInputProps) {
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);

  async function handleSend() {
    const trimmed = content.trim();
    if (!trimmed || sending) return;

    setSending(true);
    const result = await sendMessage({
      jobRequestId,
      content: trimmed,
    });

    if (result.error) {
      toast.error(result.error);
    } else {
      setContent("");
    }
    setSending(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="border-t p-3 flex gap-2">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={disabled ? "Chat is closed" : "Type a message..."}
        disabled={disabled || sending}
        className="min-h-[40px] max-h-[120px] resize-none"
        rows={1}
      />
      <Button
        size="icon"
        onClick={handleSend}
        disabled={disabled || sending || !content.trim()}
      >
        <Send className="h-4 w-4" />
      </Button>
    </div>
  );
}
