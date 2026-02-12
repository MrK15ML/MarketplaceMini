import type { TrustTier } from "@/lib/types";

export const TRUST_TIER_CONFIG: Record<
  TrustTier,
  {
    label: string;
    color: string;
    minScore: number;
    minDeals: number;
  }
> = {
  new: {
    label: "New",
    color: "bg-gray-100 text-gray-700",
    minScore: 0,
    minDeals: 0,
  },
  rising: {
    label: "Rising",
    color: "bg-blue-100 text-blue-700",
    minScore: 40,
    minDeals: 5,
  },
  trusted: {
    label: "Trusted",
    color: "bg-green-100 text-green-700",
    minScore: 60,
    minDeals: 5,
  },
  top_provider: {
    label: "Top Provider",
    color: "bg-amber-100 text-amber-700",
    minScore: 80,
    minDeals: 5,
  },
};

export function getTrustTier(score: number, completedDeals: number): TrustTier {
  if (completedDeals < 5) return "new";
  if (score >= 80) return "top_provider";
  if (score >= 60) return "trusted";
  if (score >= 40) return "rising";
  return "new";
}

export function getTrustTierConfig(tier: TrustTier) {
  return TRUST_TIER_CONFIG[tier];
}

export function formatResponseTime(hours: number | null): string {
  if (hours === null) return "N/A";
  if (hours < 1) return "< 1 hour";
  if (hours < 24) {
    const h = Math.round(hours);
    return `${h} hour${h !== 1 ? "s" : ""}`;
  }
  const days = Math.round(hours / 24);
  return `${days} day${days !== 1 ? "s" : ""}`;
}

export function formatCompletionRate(rate: number | null): string {
  if (rate === null) return "N/A";
  return `${Math.round(rate)}%`;
}
