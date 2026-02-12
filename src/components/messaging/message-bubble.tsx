"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import type { MessageWithSender } from "@/lib/types";

interface MessageBubbleProps {
  message: MessageWithSender;
  isOwnMessage: boolean;
}

export function MessageBubble({ message, isOwnMessage }: MessageBubbleProps) {
  const isSystem =
    message.message_type === "system" ||
    message.message_type === "status_change" ||
    message.message_type === "offer_notification";

  if (isSystem) {
    return (
      <div className="flex justify-center my-2">
        <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
          {message.content}
        </span>
      </div>
    );
  }

  const senderInitials = message.sender
    ? message.sender.display_name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "??";

  return (
    <div
      className={cn("flex gap-2 mb-3", isOwnMessage ? "flex-row-reverse" : "")}
    >
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarImage src={message.sender?.avatar_url ?? undefined} />
        <AvatarFallback className="text-xs">{senderInitials}</AvatarFallback>
      </Avatar>
      <div
        className={cn(
          "max-w-[75%] rounded-lg px-3 py-2",
          isOwnMessage
            ? "bg-primary text-primary-foreground"
            : "bg-muted"
        )}
      >
        <p className="text-sm whitespace-pre-wrap break-words">
          {message.content}
        </p>
        <p
          className={cn(
            "text-[10px] mt-1",
            isOwnMessage ? "text-primary-foreground/70" : "text-muted-foreground"
          )}
        >
          {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
        </p>
      </div>
    </div>
  );
}
