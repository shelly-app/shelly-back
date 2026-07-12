import { z } from "zod";
import { petInsertSchema } from "@/api/pets/schemas";
import {
  colorEnum,
  sexEnum,
  sizeEnum,
  specieEnum,
  statusEnum,
} from "@/db/schema";

export const shelterPetParamsSchema = z.object({
  shelterId: z.coerce.number().int().positive(),
  petId: z.coerce.number().int().positive(),
});

export const shelterIdParamsSchema = z.object({
  shelterId: z.coerce.number().int().positive(),
});

export const registerPetBodySchema = petInsertSchema
  .omit({
    id: true,
    shelterId: true,
  })
  .extend({
    birthDate: z.iso.date().optional(),
    colors: z.array(z.enum(colorEnum.enumValues)).optional(),
    status: z.enum(statusEnum.enumValues),
    specie: z.enum(specieEnum.enumValues),
    sex: z.enum(sexEnum.enumValues),
    size: z.preprocess(
      (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
      z.enum(sizeEnum.enumValues).optional(),
    ),
    breed: z.preprocess(
      (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
      z.string().trim().min(1).optional(),
    ),
    vaccines: z.array(z.string()).optional(),
  });

export const updatePetBodySchema = registerPetBodySchema.partial();

export const registerVaccinationBodySchema = z.object({
  vaccineCode: z.string(),
  administeredAt: z.iso
    .datetime()
    .transform((v) => new Date(v))
    .optional(),
});

export const registerEventBodySchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  scheduledFor: z
    .union([z.iso.datetime(), z.iso.date()])
    .transform((v) => new Date(v))
    .optional(),
});

export const petEventParamsSchema = z.object({
  shelterId: z.coerce.number().int().positive(),
  petId: z.coerce.number().int().positive(),
  eventId: z.coerce.number().int().positive(),
});
