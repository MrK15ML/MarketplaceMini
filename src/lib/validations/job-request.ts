import { z } from "zod/v4";

export const jobRequestSchema = z.object({
  description: z.string().min(20, "Please describe what you need in at least 20 characters").max(2000),
  budget_min: z.number().positive("Budget must be positive").optional(),
  budget_max: z.number().positive("Budget must be positive").optional(),
  preferred_time: z.string().optional(),
  location: z.string().optional(),
  is_remote: z.boolean(),
}).refine(
  (data) => {
    if (data.budget_min && data.budget_max) {
      return data.budget_max >= data.budget_min;
    }
    return true;
  },
  { message: "Max budget must be greater than or equal to min budget", path: ["budget_max"] }
).refine(
  (data) => {
    if (data.preferred_time) {
      return new Date(data.preferred_time) > new Date();
    }
    return true;
  },
  { message: "Preferred time must be in the future", path: ["preferred_time"] }
);

export type JobRequestFormValues = z.infer<typeof jobRequestSchema>;
