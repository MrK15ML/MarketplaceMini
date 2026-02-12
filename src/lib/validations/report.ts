import { z } from "zod/v4";

export const reportSchema = z.object({
  reason: z.string().min(3, "Please select a reason"),
  description: z.string().max(2000, "Description must be under 2000 characters").optional(),
});

export type ReportFormValues = z.infer<typeof reportSchema>;
