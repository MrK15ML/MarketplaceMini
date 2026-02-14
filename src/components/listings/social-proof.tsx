import { Badge } from "@/components/ui/badge";
import { Flame, Sparkles } from "lucide-react";
import { differenceInDays } from "date-fns";

type SocialProofProps = {
  requestCount: number;
  createdAt: string;
};

export function SocialProof({ requestCount, createdAt }: SocialProofProps) {
  const isNew = differenceInDays(new Date(), new Date(createdAt)) <= 7;
  const isPopular = requestCount > 3;

  if (!isNew && !isPopular) return null;

  return (
    <div className="flex items-center gap-2">
      {isPopular && (
        <span className="flex items-center gap-1 text-xs text-amber-600">
          <Flame className="h-3 w-3" />
          {requestCount} requests
        </span>
      )}
      {isNew && (
        <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 border-green-200">
          <Sparkles className="h-3 w-3 mr-0.5" />
          New
        </Badge>
      )}
    </div>
  );
}
