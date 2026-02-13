"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

interface UnreadCounts {
  total: number;
  byJob: Record<string, number>;
}

export function useUnreadCount(userId: string) {
  const [counts, setCounts] = useState<UnreadCounts>({ total: 0, byJob: {} });
  const supabase = createClient();

  const fetchCounts = useCallback(async () => {
    // Fetch unread messages grouped by job_request_id
    const { data, error } = await supabase
      .from("messages")
      .select("job_request_id")
      .neq("sender_id", userId)
      .is("read_at", null);

    if (error || !data) return;

    const byJob: Record<string, number> = {};
    let total = 0;
    for (const row of data) {
      const jrId = (row as { job_request_id: string }).job_request_id;
      byJob[jrId] = (byJob[jrId] || 0) + 1;
      total++;
    }

    setCounts({ total, byJob });
  }, [userId, supabase]);

  useEffect(() => {
    fetchCounts();

    // Subscribe to message changes to keep count fresh
    const channel = supabase
      .channel(`unread:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        () => fetchCounts()
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
        },
        () => fetchCounts()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, supabase, fetchCounts]);

  return counts;
}
