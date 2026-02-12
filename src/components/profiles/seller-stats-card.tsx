"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrustTierBadge } from "@/components/profiles/trust-tier-badge";
import { formatResponseTime, formatCompletionRate } from "@/lib/utils/seller-score";
import { Star, Clock, CheckCircle, TrendingUp, Users } from "lucide-react";
import type { SellerStats, PlatformAverages } from "@/lib/types";

type SellerStatsCardProps = {
  stats: SellerStats;
  averages: PlatformAverages | null;
};

function StatItem({
  icon: Icon,
  label,
  value,
  platformAvg,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  platformAvg?: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-semibold">{value}</p>
        {platformAvg && (
          <p className="text-xs text-muted-foreground">
            Avg: {platformAvg}
          </p>
        )}
      </div>
    </div>
  );
}

export function SellerStatsCard({ stats, averages }: SellerStatsCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <span>Handshake Score</span>
          <TrustTierBadge
            score={stats.handshake_score}
            completedDeals={stats.total_completed_deals}
          />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-5">
          <span className="text-4xl font-bold tabular-nums">
            {stats.handshake_score.toFixed(0)}
          </span>
          <span className="text-lg text-muted-foreground"> / 100</span>
          {averages && averages.avg_score > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              Platform average: {averages.avg_score.toFixed(0)}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <StatItem
            icon={Star}
            label="Rating"
            value={
              stats.avg_rating > 0
                ? `${Number(stats.avg_rating).toFixed(1)} / 5`
                : "No ratings"
            }
            platformAvg={
              averages && averages.avg_rating > 0
                ? `${averages.avg_rating.toFixed(1)}`
                : undefined
            }
          />
          <StatItem
            icon={Users}
            label="Reviews"
            value={String(stats.total_reviews)}
          />
          <StatItem
            icon={CheckCircle}
            label="Completion Rate"
            value={formatCompletionRate(stats.completion_rate)}
            platformAvg={
              averages && averages.avg_completion_rate > 0
                ? formatCompletionRate(averages.avg_completion_rate)
                : undefined
            }
          />
          <StatItem
            icon={Clock}
            label="Avg Response"
            value={formatResponseTime(stats.avg_response_hours)}
            platformAvg={
              averages && averages.avg_response_hours > 0
                ? formatResponseTime(averages.avg_response_hours)
                : undefined
            }
          />
          <StatItem
            icon={TrendingUp}
            label="Deals Completed"
            value={String(stats.total_completed_deals)}
          />
        </div>
      </CardContent>
    </Card>
  );
}
