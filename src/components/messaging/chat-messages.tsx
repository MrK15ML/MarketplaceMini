"use client";

import { useEffect, useRef } from "react";
import { MessageBubble } from "./message-bubble";
import type { MessageWithSender } from "@/lib/types";

interface ChatMessagesProps {
  messages: MessageWithSender[];
  currentUserId: string;
}

export function ChatMessages({ messages, currentUserId }: ChatMessagesProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm p-4">
        No messages yet. Start the conversation!
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4">
      {messages.map((message) => (
        <MessageBubble
          key={message.id}
          message={message}
          isOwnMessage={message.sender_id === currentUserId}
        />
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
