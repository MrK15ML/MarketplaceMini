"use client";

import { OfferCard } from "./offer-card";
import { OfferFormDialog } from "./offer-form-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Send, FileText } from "lucide-react";
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
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="h-10 w-10 text-muted-foreground/50 mb-3" />
            <p className="text-sm font-medium mb-1">No offers yet</p>
            <p className="text-xs text-muted-foreground max-w-xs">
              {isSeller
                ? "When you're ready, send an offer with your proposed price and scope."
                : "The seller will send a formal offer after discussing your requirements."}
            </p>
            {canSendOffer && (
              <OfferFormDialog jobRequestId={jobRequestId}>
                <Button size="sm" className="mt-4">
                  <Send className="h-3.5 w-3.5 mr-1.5" />
                  Create Offer
                </Button>
              </OfferFormDialog>
            )}
          </CardContent>
        </Card>
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
