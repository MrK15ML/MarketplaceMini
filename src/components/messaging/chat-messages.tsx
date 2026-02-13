"use client";

import { useEffect, useRef } from "react";
import { MessageBubble } from "./message-bubble";
import { TypingIndicator } from "./typing-indicator";
import { useTypingIndicator } from "@/lib/hooks/use-typing-indicator";
import { MessageSquare } from "lucide-react";
import type { MessageWithSender } from "@/lib/types";

interface ChatMessagesProps {
  messages: MessageWithSender[];
  currentUserId: string;
  isCustomer?: boolean;
  otherPartyName?: string;
}

export function ChatMessages({
  messages,
  currentUserId,
  isCustomer,
  otherPartyName,
}: ChatMessagesProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Find the job_request_id from messages for typing indicator
  const jobRequestId = messages.length > 0 ? messages[0].job_request_id : null;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
        <MessageSquare className="h-10 w-10 text-muted-foreground/50 mb-3" />
        <p className="text-sm font-medium mb-1">No messages yet</p>
        <p className="text-xs text-muted-foreground max-w-xs">
          {isCustomer
            ? "Introduce yourself to the seller. Let them know your requirements and timeline."
            : "Say hello to the customer! Ask clarifying questions to understand their needs."}
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4">
      {messages.map((message, idx) => {
        const prevMsg = idx > 0 ? messages[idx - 1] : null;
        const isOwnMessage = message.sender_id === currentUserId;

        // Grouping: consecutive messages from same sender within 2 minutes
        const isSameSenderAsPrev =
          prevMsg &&
          prevMsg.sender_id === message.sender_id &&
          prevMsg.message_type === "text" &&
          message.message_type === "text";
        const timeDiff = prevMsg
          ? new Date(message.created_at).getTime() -
            new Date(prevMsg.created_at).getTime()
          : Infinity;
        const isGrouped = !!(isSameSenderAsPrev && timeDiff < 120000);

        return (
          <MessageBubble
            key={message.id}
            message={message}
            isOwnMessage={isOwnMessage}
            isGrouped={isGrouped}
          />
        );
      })}
      {otherPartyName && jobRequestId && (
        <TypingIndicatorWrapper
          jobRequestId={jobRequestId}
          currentUserId={currentUserId}
          otherPartyName={otherPartyName}
        />
      )}
      <div ref={bottomRef} />
    </div>
  );
}

function TypingIndicatorWrapper({
  jobRequestId,
  currentUserId,
  otherPartyName,
}: {
  jobRequestId: string;
  currentUserId: string;
  otherPartyName: string;
}) {
  const { typingUser } = useTypingIndicator(
    jobRequestId,
    currentUserId,
    otherPartyName // not used for sending here, just for the hook signature
  );

  if (!typingUser) return null;

  return <TypingIndicator userName={typingUser.userName} />;
}
