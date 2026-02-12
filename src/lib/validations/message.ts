import { z } from "zod/v4";

export const messageSchema = z.object({
  content: z
    .string()
    .min(1, "Message cannot be empty")
    .max(2000, "Message must be under 2000 characters"),
});

export type MessageFormValues = z.infer<typeof messageSchema>;
