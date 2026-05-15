import { z } from "zod";

export const recommendationRequestSchema = z
  .object({
    query: z.string().min(1).max(200),
    userContext: z.string().max(500).optional(),
  })
  .strict();
