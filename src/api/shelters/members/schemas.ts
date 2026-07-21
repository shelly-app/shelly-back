import { z } from "zod";

export const memberParamsSchema = z.object({
  shelterId: z.coerce.number().int().positive(),
});

export const registerMemberBodySchema = z.object({
  email: z.email(),
  role: z.enum(["admin", "volunteer"]),
});

export const memberResponseSchema = z.array(
  z.object({
    userId: z.number(),
    name: z.string(),
    email: z.email(),
    avatarUrl: z.string().nullable(),
    role: z.string(),
    joinedAt: z.date(),
  }),
);

export const registerMemberResponseSchema = z.object({
  userId: z.number(),
  name: z.string(),
  email: z.email(),
  role: z.string(),
  shelterId: z.number(),
});
