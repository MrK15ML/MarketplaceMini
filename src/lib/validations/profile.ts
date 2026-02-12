import { z } from "zod/v4";

export const profileUpdateSchema = z.object({
  display_name: z.string().min(2, "Name must be at least 2 characters").max(50),
  bio: z.string().max(500).optional(),
  location_city: z.string().optional(),
});

export type ProfileUpdateValues = z.infer<typeof profileUpdateSchema>;

export const qualificationSchema = z.object({
  type: z.enum(["license", "certificate", "portfolio", "testimonial"]),
  title: z.string().min(2, "Title must be at least 2 characters").max(100),
  description: z.string().max(500).optional(),
  expires_at: z.string().optional(),
});

export type QualificationFormValues = z.infer<typeof qualificationSchema>;
