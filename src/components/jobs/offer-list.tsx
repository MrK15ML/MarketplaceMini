"use client";

import { OfferCard } from "./offer-card";
import { OfferFormDialog } from "./offer-form-dialog";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import type { Offer } from "@/lib/types";

interface OfferListProps {
  offers: Offer[];
  jobRequestId: string;
  isCustomer: boolean;
  isSeller: boolean;
  jobStatus: string;
}

export function OfferList({
  offers,
  jobRequestId,
  isCustomer,
  isSeller,
  jobStatus,
}: OfferListProps) {
  const hasPendingOffer = offers.some((o) => o.status === "pending");
  const canSendOffer =
    isSeller &&
    !hasPendingOffer &&
    ["pending", "clarifying", "offered"].includes(jobStatus);

  // Sort by version descending (latest first)
  const sorted = [...offers].sort((a, b) => b.version - a.version);

  return (
    <div className="space-y-4">
      {canSendOffer && (
        <OfferFormDialog jobRequestId={jobRequestId}>
          <Button className="w-full">
            <Send className="h-4 w-4 mr-2" />
            Send Offer
          </Button>
        </OfferFormDialog>
      )}

      {sorted.length === 0 ? (
        <div className="text-center text-muted-foreground text-sm py-8">
          No offers yet.
        </div>
      ) : (
        sorted.map((offer) => (
          <OfferCard
            key={offer.id}
            offer={offer}
            jobRequestId={jobRequestId}
            isCustomer={isCustomer}
            isSeller={isSeller}
          />
        ))
      )}
    </div>
  );
}
