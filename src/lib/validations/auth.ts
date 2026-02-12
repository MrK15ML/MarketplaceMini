import { z } from "zod/v4";

export const loginSchema = z.object({
  email: z.email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export type LoginValues = z.infer<typeof loginSchema>;

export const signupSchema = z.object({
  displayName: z.string().min(2, "Name must be at least 2 characters").max(50),
  email: z.email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export type SignupValues = z.infer<typeof signupSchema>;

export const onboardingSchema = z.object({
  role: z.enum(["buyer", "seller", "both"]),
  bio: z.string().max(500).optional(),
  locationCity: z.string().min(1, "Please select a city"),
});

export type OnboardingValues = z.infer<typeof onboardingSchema>;
