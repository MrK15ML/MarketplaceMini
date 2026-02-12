import { z } from "zod/v4";

export const offerSchema = z.object({
  price: z.number().positive("Price must be positive"),
  pricing_type: z.enum(["fixed", "hourly"]),
  estimated_duration: z.string().max(100).optional(),
  scope_description: z
    .string()
    .min(10, "Scope must be at least 10 characters")
    .max(2000, "Scope must be under 2000 characters"),
  valid_until: z.string().optional(),
});

export type OfferFormValues = z.infer<typeof offerSchema>;
