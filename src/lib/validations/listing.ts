import { z } from "zod/v4";

export const listingSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(100),
  description: z.string().min(20, "Description must be at least 20 characters").max(2000),
  category: z.enum([
    "odd_jobs", "trades", "remote", "tutoring", "consultation",
    "creative", "tech", "pet_services", "health_wellness", "events", "automotive", "home_property",
  ]),
  subcategory: z.string().optional(),
  pricing_type: z.enum(["fixed", "range", "hourly"]),
  price_fixed: z.number().positive().optional(),
  price_min: z.number().positive().optional(),
  price_max: z.number().positive().optional(),
  is_remote: z.boolean(),
  location_radius_km: z.number().int().min(1).max(200).optional(),
  requires_license: z.boolean(),
  license_type: z.string().optional(),
}).refine(
  (data) => {
    if (data.pricing_type === "fixed") return data.price_fixed !== undefined;
    return true;
  },
  { message: "Fixed price is required", path: ["price_fixed"] }
).refine(
  (data) => {
    if (data.pricing_type === "range") return data.price_min !== undefined && data.price_max !== undefined;
    return true;
  },
  { message: "Both min and max price are required", path: ["price_min"] }
).refine(
  (data) => {
    if (data.pricing_type === "hourly") return data.price_fixed !== undefined;
    return true;
  },
  { message: "Hourly rate is required", path: ["price_fixed"] }
).refine(
  (data) => {
    if (data.pricing_type === "range" && data.price_min && data.price_max) {
      return data.price_max > data.price_min;
    }
    return true;
  },
  { message: "Max price must be greater than min price", path: ["price_max"] }
);

export type ListingFormValues = z.infer<typeof listingSchema>;
