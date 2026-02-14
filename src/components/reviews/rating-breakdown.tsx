import { Star } from "lucide-react";

type RatingBreakdownProps = {
  avgRating: number;
  avgCommunication: number;
  avgQuality: number;
  avgReliability: number;
  totalReviews: number;
};

function RatingBar({ label, value }: { label: string; value: number }) {
  const percentage = value > 0 ? (value / 5) * 100 : 0;

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-muted-foreground w-28 shrink-0">
        {label}
      </span>
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-yellow-400 rounded-full transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-sm font-medium tabular-nums w-8 text-right">
        {value > 0 ? value.toFixed(1) : "—"}
      </span>
    </div>
  );
}

export function RatingBreakdown({
  avgRating,
  avgCommunication,
  avgQuality,
  avgReliability,
  totalReviews,
}: RatingBreakdownProps) {
  if (totalReviews === 0) {
    return (
      <p className="text-sm text-muted-foreground">No reviews yet.</p>
    );
  }

  const hasCategories =
    avgCommunication > 0 || avgQuality > 0 || avgReliability > 0;

  return (
    <div className="space-y-4">
      {/* Overall summary */}
      <div className="flex items-center gap-3">
        <span className="text-3xl font-bold tabular-nums">
          {Number(avgRating).toFixed(1)}
        </span>
        <div>
          <div className="flex items-center gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`h-4 w-4 ${
                  i < Math.round(avgRating)
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-gray-300"
                }`}
              />
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {totalReviews} {totalReviews === 1 ? "review" : "reviews"}
          </p>
        </div>
      </div>

      {/* Category breakdown */}
      {hasCategories && (
        <div className="space-y-2.5">
          <RatingBar label="Communication" value={avgCommunication} />
          <RatingBar label="Quality" value={avgQuality} />
          <RatingBar label="Reliability" value={avgReliability} />
        </div>
      )}
    </div>
  );
}
