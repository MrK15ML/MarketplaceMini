import { Badge } from "@/components/ui/badge";
import { Shield, TrendingUp, Award, Sparkles } from "lucide-react";
import { getTrustTier, getTrustTierConfig } from "@/lib/utils/seller-score";
import type { TrustTier } from "@/lib/types";

const TIER_ICONS: Record<TrustTier, React.ElementType> = {
  new: Shield,
  rising: TrendingUp,
  trusted: Award,
  top_provider: Sparkles,
};

type TrustTierBadgeProps = {
  score: number;
  completedDeals: number;
  showLabel?: boolean;
};

export function TrustTierBadge({
  score,
  completedDeals,
  showLabel = true,
}: TrustTierBadgeProps) {
  const tier = getTrustTier(score, completedDeals);
  if (tier === "new") return null;

  const config = getTrustTierConfig(tier);
  const Icon = TIER_ICONS[tier];

  return (
    <Badge variant="secondary" className={`gap-1 ${config.color}`}>
      <Icon className="h-3 w-3" />
      {showLabel && config.label}
    </Badge>
  );
}
