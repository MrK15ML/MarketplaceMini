"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export function useRealtimeJobStatus(
  jobRequestId: string,
  initialStatus: string
) {
  const [status, setStatus] = useState(initialStatus);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    setStatus(initialStatus);
  }, [initialStatus]);

  useEffect(() => {
    const channel = supabase
      .channel(`job_status:${jobRequestId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "job_requests",
          filter: `id=eq.${jobRequestId}`,
        },
        (payload) => {
          const newStatus = (payload.new as { status: string }).status;
          setStatus(newStatus);
          router.refresh();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [jobRequestId, supabase, router]);

  return status;
}
