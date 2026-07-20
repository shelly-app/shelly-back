import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import {
  eventTypeEnum,
  pet,
  sexEnum,
  sizeEnum,
  specieEnum,
  statusEnum,
} from "@/db/schema";

export const petIdParamsSchema = z.object({
  id: z.coerce
    .number()
    .int()
    .positive()
    .meta({ examples: [1] }),
});

export const petSelectSchema = createSelectSchema(pet);
export const petInsertSchema = createInsertSchema(pet);

export const petResponseSchema = petSelectSchema
  .omit({
    shelterId: true,
    deletedAt: true,
    photoKey: true,
  })
  .partial({ createdAt: true, updatedAt: true })
  .extend({
    birthDate: z.iso.date().nullable(),
    specie: z.enum(specieEnum.enumValues),
    sex: z.enum(sexEnum.enumValues),
    size: z.enum(sizeEnum.enumValues).nullable(),
    status: z.enum(statusEnum.enumValues),
    colors: z.array(z.string()),
    photoUrl: z.string().nullable(),
    shelter: z.object({
      name: z.string(),
      city: z.string(),
    }),
  });

export const detailedPetResponseSchema = petResponseSchema.extend({
  vaccinations: z
    .array(
      z.object({
        vaccine: z.string(),
        vaccineCode: z.string(),
        administeredAt: z.string(),
      }),
    )
    .default([]),
  events: z
    .array(
      z.object({
        id: z.number().int().positive(),
        type: z.enum(eventTypeEnum.enumValues),
        name: z.string(),
        description: z.string().nullable(),
        metadata: z
          .object({
            from: z.string().nullish(),
            to: z.string().nullish(),
            hasTime: z.boolean().optional(),
          })
          .nullable(),
        scheduledFor: z.string().nullable(),
        createdAt: z.string(),
      }),
    )
    .default([]),
});
