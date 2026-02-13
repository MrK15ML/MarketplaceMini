import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrustTierBadge } from "@/components/profiles/trust-tier-badge";
import { Star, CheckCircle2, Clock, Shield } from "lucide-react";
import type { Profile } from "@/lib/types";

interface SellerTrustCardProps {
  seller: Profile;
  completedDealsCount: number;
}

export function SellerTrustCard({
  seller,
  completedDealsCount,
}: SellerTrustCardProps) {
  const hasScore =
    seller.handshake_score !== null && seller.handshake_score !== undefined;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Shield className="h-4 w-4" />
          Trust & Performance
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {hasScore && (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">
                Handshake Score
              </p>
              <span className="text-2xl font-bold tabular-nums">
                {Math.round(seller.handshake_score)}
              </span>
              <span className="text-sm text-muted-foreground">/100</span>
            </div>
            <TrustTierBadge
              score={seller.handshake_score}
              completedDeals={completedDealsCount}
            />
          </div>
        )}

        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <Star className="h-3.5 w-3.5 text-yellow-500" />
            <span>
              {seller.avg_rating > 0
                ? `${seller.avg_rating.toFixed(1)} rating (${seller.total_reviews} reviews)`
                : "No reviews yet"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
            <span>
              {completedDealsCount} deal{completedDealsCount !== 1 ? "s" : ""}{" "}
              completed
            </span>
          </div>

          {seller.avg_response_hours != null && (
            <div className="flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 text-blue-500" />
              <span>
                Responds in{" "}
                {seller.avg_response_hours < 1
                  ? "< 1 hour"
                  : seller.avg_response_hours < 24
                    ? `~${Math.round(seller.avg_response_hours)} hours`
                    : `~${Math.round(seller.avg_response_hours / 24)} days`}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
