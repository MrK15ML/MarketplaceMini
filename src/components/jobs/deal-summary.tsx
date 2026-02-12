"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { transitionJobStatus } from "@/lib/supabase/actions";
import { toast } from "sonner";
import { DollarSign, Clock, PlayCircle, CheckCircle2 } from "lucide-react";
import type { Deal, Profile } from "@/lib/types";

interface DealSummaryProps {
  deal: Deal;
  customer: Profile;
  seller: Profile;
  jobRequestId: string;
  jobStatus: string;
  isCustomer: boolean;
  isSeller: boolean;
}

export function DealSummary({
  deal,
  customer,
  seller,
  jobRequestId,
  jobStatus,
  isCustomer,
  isSeller,
}: DealSummaryProps) {
  const [loading, setLoading] = useState(false);

  async function handleTransition(targetStatus: string) {
    setLoading(true);
    const result = await transitionJobStatus({
      jobRequestId,
      targetStatus,
    });
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(
        targetStatus === "in_progress"
          ? "Work started!"
          : "Marked as complete!"
      );
    }
    setLoading(false);
  }

  const statusColor =
    deal.status === "active"
      ? "bg-blue-100 text-blue-800"
      : deal.status === "completed"
        ? "bg-green-100 text-green-800"
        : "bg-gray-100 text-gray-800";

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Deal Summary</CardTitle>
          <Badge className={statusColor}>
            {deal.status.charAt(0).toUpperCase() + deal.status.slice(1)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <span>
              <strong>Agreed Price:</strong> ${deal.agreed_price}
            </span>
          </div>
          {deal.started_at && (
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>
                Started:{" "}
                {new Date(deal.started_at).toLocaleDateString("en-NZ")}
              </span>
            </div>
          )}
          {deal.completed_at && (
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              <span>
                Completed:{" "}
                {new Date(deal.completed_at).toLocaleDateString("en-NZ")}
              </span>
            </div>
          )}
        </div>

        <Separator />

        <div>
          <p className="text-sm font-medium mb-1">Agreed Scope</p>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {deal.agreed_scope}
          </p>
        </div>

        <Separator />

        <div className="grid sm:grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-muted-foreground">Customer</p>
            <p className="font-medium">{customer.display_name}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Seller</p>
            <p className="font-medium">{seller.display_name}</p>
          </div>
        </div>

        {/* Action buttons */}
        {isSeller && jobStatus === "accepted" && (
          <Button
            onClick={() => handleTransition("in_progress")}
            disabled={loading}
            className="w-full"
          >
            <PlayCircle className="h-4 w-4 mr-2" />
            {loading ? "Starting..." : "Start Work"}
          </Button>
        )}

        {isSeller && jobStatus === "in_progress" && (
          <Button
            onClick={() => handleTransition("completed")}
            disabled={loading}
            className="w-full"
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            {loading ? "Completing..." : "Mark as Complete"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
