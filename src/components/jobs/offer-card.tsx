"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { acceptOffer, declineOffer } from "@/lib/supabase/actions";
import { getOfferStatusConfig } from "@/lib/constants";
import { OfferFormDialog } from "./offer-form-dialog";
import { toast } from "sonner";
import { Check, X, Edit, Clock, DollarSign } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { Offer } from "@/lib/types";
import { cn } from "@/lib/utils";

interface OfferCardProps {
  offer: Offer;
  jobRequestId: string;
  isCustomer: boolean;
  isSeller: boolean;
}

export function OfferCard({
  offer,
  jobRequestId,
  isCustomer,
  isSeller,
}: OfferCardProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const statusConfig = getOfferStatusConfig(offer.status);
  const isPending = offer.status === "pending";
  const isMuted = offer.status === "superseded" || offer.status === "declined" || offer.status === "expired";

  async function handleAccept() {
    setLoading(true);
    const result = await acceptOffer({ offerId: offer.id });
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Offer accepted! Deal created.");
      setConfirmOpen(false);
    }
    setLoading(false);
  }

  async function handleDecline() {
    setLoading(true);
    const result = await declineOffer({ offerId: offer.id });
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Offer declined.");
    }
    setLoading(false);
  }

  const priceDisplay =
    offer.pricing_type === "hourly"
      ? `$${offer.price}/hr`
      : `$${offer.price}`;

  return (
    <>
      <Card className={cn(isMuted && "opacity-60")}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">
              Offer v{offer.version}
            </CardTitle>
            <Badge className={statusConfig?.color ?? "bg-gray-100 text-gray-800"}>
              {statusConfig?.label ?? offer.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="font-semibold">{priceDisplay}</span>
            </div>
            {offer.estimated_duration && (
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>{offer.estimated_duration}</span>
              </div>
            )}
          </div>

          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {offer.scope_description}
          </p>

          {offer.valid_until && (
            <p className="text-xs text-muted-foreground">
              Valid until{" "}
              {new Date(offer.valid_until).toLocaleDateString("en-NZ")}
            </p>
          )}

          <p className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(offer.created_at), {
              addSuffix: true,
            })}
          </p>

          {isPending && (
            <div className="flex gap-2 pt-2">
              {isCustomer && (
                <>
                  <Button
                    size="sm"
                    onClick={() => setConfirmOpen(true)}
                    disabled={loading}
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleDecline}
                    disabled={loading}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Decline
                  </Button>
                </>
              )}
              {isSeller && (
                <OfferFormDialog
                  jobRequestId={jobRequestId}
                  previousOffer={offer}
                >
                  <Button size="sm" variant="outline">
                    <Edit className="h-4 w-4 mr-1" />
                    Revise
                  </Button>
                </OfferFormDialog>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Accept confirmation dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Accept this offer?</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 text-sm">
            <p>
              <strong>Price:</strong> {priceDisplay}
            </p>
            <p>
              <strong>Scope:</strong> {offer.scope_description}
            </p>
            {offer.estimated_duration && (
              <p>
                <strong>Duration:</strong> {offer.estimated_duration}
              </p>
            )}
            <p className="text-muted-foreground pt-2">
              Accepting creates a deal. The seller will be notified to start
              work.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button onClick={handleAccept} disabled={loading}>
              {loading ? "Accepting..." : "Confirm Accept"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
