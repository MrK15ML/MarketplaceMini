"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { transitionJobStatus } from "@/lib/supabase/actions";
import { OfferFormDialog } from "./offer-form-dialog";
import { getAvailableTransitions, type Role } from "@/lib/utils/state-machine";
import type { JobRequestStatus } from "@/lib/types";
import { toast } from "sonner";
import { Send, XCircle, Ban } from "lucide-react";

interface JobActionBarProps {
  jobRequestId: string;
  jobStatus: string;
  role: Role;
}

export function JobActionBar({
  jobRequestId,
  jobStatus,
  role,
}: JobActionBarProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const transitions = getAvailableTransitions(
    jobStatus as JobRequestStatus,
    role
  );

  // Filter out transitions handled elsewhere (offers tab, deal tab, reviews)
  const actionTransitions = transitions.filter(
    (t) =>
      t.to !== "offered" &&
      t.to !== "accepted" &&
      t.to !== "in_progress" &&
      t.to !== "completed" &&
      t.to !== "reviewed"
  );

  // Check if seller can send offer (shown as special button)
  const canSendOffer = transitions.some((t) => t.to === "offered");

  async function handleTransition(targetStatus: string, label: string) {
    setLoading(true);
    const result = await transitionJobStatus({
      jobRequestId,
      targetStatus,
    });
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(label);
      router.refresh();
    }
    setLoading(false);
  }

  if (actionTransitions.length === 0 && !canSendOffer) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {canSendOffer && role === "seller" && (
        <OfferFormDialog jobRequestId={jobRequestId}>
          <Button size="sm">
            <Send className="h-4 w-4 mr-1" />
            Send Offer
          </Button>
        </OfferFormDialog>
      )}

      {actionTransitions.map((t) => {
        const isDestructive =
          t.to === "cancelled" || t.to === "declined";
        const icon = isDestructive ? (
          t.to === "declined" ? (
            <Ban className="h-4 w-4 mr-1" />
          ) : (
            <XCircle className="h-4 w-4 mr-1" />
          )
        ) : null;

        return (
          <Button
            key={t.to}
            size="sm"
            variant={isDestructive ? "destructive" : "outline"}
            onClick={() => handleTransition(t.to, t.label)}
            disabled={loading}
          >
            {icon}
            {t.label}
          </Button>
        );
      })}
    </div>
  );
}
