import { z } from "zod";

export const createTransactionSchema = z
  .object({
    amount: z.number().positive(),
    type: z.enum(["INCOME", "EXPENSE"]),
    categoryId: z.string().uuid().optional(),
    budgetId: z.string().uuid().optional(),
    description: z.string().max(255).optional(),
    date: z.string().datetime().optional(),
  })
  .strict();
