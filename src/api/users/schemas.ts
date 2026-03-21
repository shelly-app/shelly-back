import { z } from "zod";

export const userIdParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const userResponseSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.email(),
  shelters: z.array(
    z.object({
      id: z.number(),
      name: z.string(),
      role: z.string(),
    }),
  ),
});

export const updateUserBodySchema = z.object({
  name: z.string().trim().min(1).optional(),
  shelterRoles: z
    .array(
      z.object({
        shelterId: z.number().int().positive(),
        role: z.string().trim().min(1),
      }),
    )
    .optional(),
});

export const updateUserResponseSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.email(),
});

export const meResponseSchema = z.object({
  name: z.string(),
  email: z.email(),
  shelters: z.array(
    z.object({
      id: z.number(),
      name: z.string(),
      role: z.string(),
    }),
  ),
});
