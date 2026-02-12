import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { ReviewWithReviewer } from "@/lib/types";

export function ReviewList({ reviews }: { reviews: ReviewWithReviewer[] }) {
  if (reviews.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4">No reviews yet.</p>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => {
        const reviewer = review.reviewer;
        const initials = reviewer.display_name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
          .slice(0, 2);

        return (
          <div key={review.id} className="flex gap-3 pb-4 border-b last:border-0">
            <Avatar className="h-8 w-8">
              <AvatarImage src={reviewer.avatar_url ?? undefined} />
              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium">
                  {reviewer.display_name}
                </span>
                <div className="flex items-center">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-3 w-3 ${
                        i < review.rating
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(review.created_at), {
                    addSuffix: true,
                  })}
                </span>
              </div>
              {review.comment && (
                <p className="text-sm text-muted-foreground">
                  {review.comment}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
