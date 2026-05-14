import { z } from "zod";

export const signupSchema = z
  .object({
    email: z.string().email(),
    password: z.string().min(6),
    fullName: z.string().trim().min(2).max(120),
    role: z.enum(["USER", "ADMIN"]),
  })
  .strict();

export const loginSchema = z
  .object({
    email: z.string().email(),
    password: z.string().min(1),
  })
  .strict();
