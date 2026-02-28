"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { sendMessage } from "@/lib/supabase/actions";
import { useTypingIndicator } from "@/lib/hooks/use-typing-indicator";
import { Send } from "lucide-react";
import { toast } from "sonner";

interface ChatInputProps {
  jobRequestId: string;
  currentUserId: string;
  currentUserName: string;
  disabled?: boolean;
}

export function ChatInput({
  jobRequestId,
  currentUserId,
  currentUserName,
  disabled,
}: ChatInputProps) {
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const { sendTyping } = useTypingIndicator(
    jobRequestId,
    currentUserId,
    currentUserName
  );

  async function handleSend() {
    const trimmed = content.trim();
    if (!trimmed || sending) return;

    sendTyping(false);
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

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setContent(e.target.value);
    if (e.target.value.trim()) {
      sendTyping(true);
    } else {
      sendTyping(false);
    }
  }

  return (
    <div className="border-t p-3 flex gap-2 shrink-0">
      <Textarea
        value={content}
        onChange={handleChange}
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
