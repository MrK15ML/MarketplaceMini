"use client";

import { useUnreadCount } from "@/lib/hooks/use-unread-count";

interface UnreadBadgeProps {
  userId: string;
}

export function UnreadBadge({ userId }: UnreadBadgeProps) {
  const { total } = useUnreadCount(userId);

  if (total === 0) return null;

  return (
    <span className="inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold leading-none">
      {total > 99 ? "99+" : total}
    </span>
  );
}
