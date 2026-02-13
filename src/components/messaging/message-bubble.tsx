"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { format, formatDistanceToNow } from "date-fns";
import type { MessageWithSender } from "@/lib/types";

interface MessageBubbleProps {
  message: MessageWithSender;
  isOwnMessage: boolean;
  isGrouped?: boolean;
}

export function MessageBubble({
  message,
  isOwnMessage,
  isGrouped = false,
}: MessageBubbleProps) {
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
      className={cn(
        "flex gap-2 group",
        isOwnMessage ? "flex-row-reverse" : "",
        isGrouped ? "mt-0.5" : "mt-3"
      )}
    >
      {/* Avatar or spacer */}
      {isGrouped ? (
        <div className="w-8 shrink-0" />
      ) : (
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarImage src={message.sender?.avatar_url ?? undefined} />
          <AvatarFallback className="text-xs">{senderInitials}</AvatarFallback>
        </Avatar>
      )}

      {/* Bubble */}
      <div className="relative max-w-[75%]">
        <div
          className={cn(
            "rounded-lg px-3 py-2",
            isOwnMessage
              ? "bg-primary text-primary-foreground"
              : "bg-muted"
          )}
        >
          <p className="text-sm whitespace-pre-wrap break-words">
            {message.content}
          </p>
        </div>

        {/* Timestamp — visible on hover (desktop) */}
        <div
          className={cn(
            "absolute -bottom-4 text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none",
            isOwnMessage ? "right-0" : "left-0"
          )}
        >
          {format(new Date(message.created_at), "MMM d, h:mm a")}
        </div>
      </div>
    </div>
  );
}
