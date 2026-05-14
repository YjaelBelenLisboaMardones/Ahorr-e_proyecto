import { z } from "zod";

export const createCategorySchema = z
  .object({
    name: z.string().min(1).max(80),
    type: z.enum(["INCOME", "EXPENSE"]),
    icon: z.string().max(10).optional(),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  })
  .strict();
