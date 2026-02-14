"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { submitReview } from "@/lib/supabase/actions";
import { toast } from "sonner";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface ReviewFormProps {
  dealId: string;
  revieweeName: string;
}

function StarRating({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  const [hovered, setHovered] = useState(0);

  return (
    <div>
      <p className="text-sm text-muted-foreground mb-1.5">{label}</p>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            className="p-0.5 transition-transform hover:scale-110"
          >
            <Star
              className={cn(
                "h-5 w-5 transition-colors",
                (hovered || value) >= star
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-muted-foreground"
              )}
            />
          </button>
        ))}
      </div>
    </div>
  );
}

export function ReviewForm({ dealId, revieweeName }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [ratingCommunication, setRatingCommunication] = useState(0);
  const [ratingQuality, setRatingQuality] = useState(0);
  const [ratingReliability, setRatingReliability] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit() {
    if (rating === 0) {
      toast.error("Please select an overall rating");
      return;
    }

    setSubmitting(true);
    const result = await submitReview({
      dealId,
      rating,
      rating_communication: ratingCommunication || undefined,
      rating_quality: ratingQuality || undefined,
      rating_reliability: ratingReliability || undefined,
      comment: comment.trim() || undefined,
    });

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Review submitted!");
      setSubmitted(true);
    }
    setSubmitting(false);
  }

  if (submitted) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-sm text-muted-foreground">
            Thanks for your review!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          Leave a review for {revieweeName}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall rating */}
        <div>
          <p className="text-sm font-medium mb-1.5">Overall Rating *</p>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                className="p-0.5 transition-transform hover:scale-110"
              >
                <Star
                  className={cn(
                    "h-6 w-6 transition-colors",
                    (hoveredRating || rating) >= star
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-muted-foreground"
                  )}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Category ratings */}
        <div className="border-t pt-4">
          <p className="text-xs text-muted-foreground mb-3">
            Rate specific areas (optional)
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StarRating
              label="Communication"
              value={ratingCommunication}
              onChange={setRatingCommunication}
            />
            <StarRating
              label="Quality"
              value={ratingQuality}
              onChange={setRatingQuality}
            />
            <StarRating
              label="Reliability"
              value={ratingReliability}
              onChange={setRatingReliability}
            />
          </div>
        </div>

        <div>
          <p className="text-sm text-muted-foreground mb-2">
            Comment (optional)
          </p>
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="How was your experience?"
            rows={3}
            maxLength={1000}
          />
        </div>

        <Button
          onClick={handleSubmit}
          disabled={submitting || rating === 0}
          className="w-full"
        >
          {submitting ? "Submitting..." : "Submit Review"}
        </Button>
      </CardContent>
    </Card>
  );
}
