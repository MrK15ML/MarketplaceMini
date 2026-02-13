"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

interface TypingUser {
  userId: string;
  userName: string;
}

export function useTypingIndicator(
  jobRequestId: string,
  currentUserId: string,
  currentUserName: string
) {
  const [typingUser, setTypingUser] = useState<TypingUser | null>(null);
  const supabase = createClient();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    const channel = supabase.channel(`typing:${jobRequestId}`, {
      config: {
        presence: {
          key: currentUserId,
        },
      },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        let found: TypingUser | null = null;

        for (const key in state) {
          if (key !== currentUserId) {
            const presences = state[key];
            if (presences && presences.length > 0) {
              const p = presences[0] as { isTyping?: boolean; userName?: string };
              if (p.isTyping) {
                found = { userId: key, userName: p.userName ?? "Someone" };
                break;
              }
            }
          }
        }

        setTypingUser(found);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({
            userId: currentUserId,
            userName: currentUserName,
            isTyping: false,
          });
        }
      });

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [jobRequestId, currentUserId, currentUserName, supabase]);

  const sendTyping = useCallback(
    (isTyping: boolean) => {
      if (!channelRef.current) return;

      channelRef.current.track({
        userId: currentUserId,
        userName: currentUserName,
        isTyping,
      });

      // Auto-clear typing after 3 seconds
      if (isTyping) {
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
        typingTimeoutRef.current = setTimeout(() => {
          channelRef.current?.track({
            userId: currentUserId,
            userName: currentUserName,
            isTyping: false,
          });
        }, 3000);
      }
    },
    [currentUserId, currentUserName]
  );

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return { typingUser, sendTyping };
}
