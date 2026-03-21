import { z } from "zod";
import { petInsertSchema } from "#/api/pets/schemas.js";

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
    statusId: true,
    specieId: true,
  })
  .extend({
    birthDate: z.iso.date().optional(),
    colors: z.array(z.string().trim().toLowerCase().min(1)).optional(),
    status: z.string().trim().toLowerCase().min(1),
    specie: z.string().trim().toLowerCase().min(1),
    breed: z.string().trim().min(1).optional(),
    sex: z.enum(["male", "female"]).optional(),
    size: z.enum(["small", "medium", "large"]).optional(),
  });

export const updatePetBodySchema = petInsertSchema
  .omit({
    id: true,
    shelterId: true,
    statusId: true,
    specieId: true,
  })
  .extend({
    colors: z.array(z.string().trim().toLowerCase().min(1)),
    status: z.string().trim().toLowerCase().min(1),
    specie: z.string().trim().toLowerCase().min(1),
  })
  .partial();

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
});

export const petEventParamsSchema = z.object({
  shelterId: z.coerce.number().int().positive(),
  petId: z.coerce.number().int().positive(),
  eventId: z.coerce.number().int().positive(),
});
