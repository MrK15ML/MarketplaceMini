import { z } from "zod/v4";

export const reviewSchema = z.object({
  rating: z.number().int().min(1, "Rating is required").max(5),
  rating_communication: z.number().int().min(1).max(5).optional(),
  rating_quality: z.number().int().min(1).max(5).optional(),
  rating_reliability: z.number().int().min(1).max(5).optional(),
  comment: z.string().max(1000, "Comment must be under 1000 characters").optional(),
});

export type ReviewFormValues = z.infer<typeof reviewSchema>;
