import { z } from "zod";
import { contactTypeEnum } from "@/db/schema";

export const createContactSubmissionBodySchema = z.object({
  type: z.enum(contactTypeEnum.enumValues),
  name: z.string().trim().min(1),
  email: z.email(),
  phone: z.string().trim().optional(),
  organization: z.string().trim().optional(),
  message: z.string().trim().min(1),
  shelterName: z.string().trim().optional(),
  shelterLocation: z.string().trim().optional(),
  shelterType: z.string().trim().optional(),
});

export const contactSubmissionResponseSchema = z.object({
  id: z.number(),
  success: z.boolean(),
});
