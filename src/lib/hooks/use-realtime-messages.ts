"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import type { MessageWithSender } from "@/lib/types";

export function useRealtimeMessages(
  jobRequestId: string,
  initialMessages: MessageWithSender[]
) {
  // Track messages by ID to prevent duplicates
  const [messageMap, setMessageMap] = useState<Map<string, MessageWithSender>>(
    () => new Map(initialMessages.map((m) => [m.id, m]))
  );
  const supabase = createClient();
  const prevInitialIdsRef = useRef<string>("");

  // Merge new initialMessages when they change (by comparing IDs, not reference)
  useEffect(() => {
    const newIds = initialMessages.map((m) => m.id).join(",");
    if (newIds !== prevInitialIdsRef.current) {
      prevInitialIdsRef.current = newIds;
      setMessageMap((prev) => {
        const merged = new Map(prev);
        for (const msg of initialMessages) {
          merged.set(msg.id, msg);
        }
        return merged;
      });
    }
  }, [initialMessages]);

  // Subscribe to Realtime for new messages
  useEffect(() => {
    const channel = supabase
      .channel(`messages:${jobRequestId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `job_request_id=eq.${jobRequestId}`,
        },
        async (payload) => {
          const newId = (payload.new as { id: string }).id;

          // Fetch the full message with sender profile
          const { data } = await supabase
            .from("messages")
            .select("*, sender:profiles!sender_id(*)")
            .eq("id", newId)
            .single();

          if (data) {
            setMessageMap((prev) => {
              if (prev.has(newId)) return prev;
              const next = new Map(prev);
              next.set(newId, data as MessageWithSender);
              return next;
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [jobRequestId, supabase]);

  // Convert map to sorted array
  const messages = useMemo(
    () =>
      Array.from(messageMap.values()).sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      ),
    [messageMap]
  );

  return messages;
}
