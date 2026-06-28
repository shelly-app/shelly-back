import { z } from "zod";
import { adoptionRequestStatusEnum } from "@/db/schema";

export const shelterIdParamsSchema = z.object({
  shelterId: z.coerce.number().int().positive(),
});

export const adoptionRequestParamsSchema = z.object({
  shelterId: z.coerce.number().int().positive(),
  requestId: z.coerce.number().int().positive(),
});

export const shelterPetParamsSchema = z.object({
  shelterId: z.coerce.number().int().positive(),
  petId: z.coerce.number().int().positive(),
});

export const listAdoptionRequestsQuerySchema = z.object({
  status: z.enum(adoptionRequestStatusEnum.enumValues).optional(),
});

export const createAdoptionRequestBodySchema = z.object({
  requesterName: z.string().trim().min(1),
  requesterEmail: z.email(),
  requesterPhone: z.string().trim().min(1).optional(),
  message: z.string().trim().optional(),
  location: z.string().trim().min(1),
  familyComposition: z.string().trim().optional(),
  hasYard: z.boolean().optional(),
});

export const updateAdoptionRequestBodySchema = z.object({
  status: z.enum(["approved", "rejected"]),
  rejectionReason: z.string().trim().optional(),
});

export const adoptionRequestResponseSchema = z.object({
  id: z.number(),
  petId: z.number(),
  petName: z.string(),
  petPhotoUrl: z.string().optional(),
  requesterName: z.string(),
  requesterEmail: z.email(),
  requesterPhone: z.string().nullable(),
  status: z.enum(adoptionRequestStatusEnum.enumValues),
  message: z.string().nullable(),
  rejectionReason: z.string().nullable(),
  approvedAt: z.string().nullable(),
  rejectedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string().nullable(),
  questionnaire: z.object({
    location: z.string(),
    familyComposition: z.string(),
    hasYard: z.boolean(),
  }),
});

export const adoptionRequestListResponseSchema = z.array(
  adoptionRequestResponseSchema,
);
