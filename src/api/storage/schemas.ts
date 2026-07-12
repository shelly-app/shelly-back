import { z } from "zod";

export const uploadUrlBodySchema = z.object({
  contentType: z.string().trim().min(1),
});

export const uploadUrlResponseSchema = z.object({
  uploadUrl: z.string(),
  key: z.string(),
});
