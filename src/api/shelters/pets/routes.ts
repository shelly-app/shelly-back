import { Router } from "express";
import { z } from "zod";
import type { ZodOpenApiPathsObject } from "zod-openapi";
import { Permissions, StatusCodes } from "#/api/constants.js";
import { requirePermission } from "#/api/middleware/require-permission.js";
import {
  detailedPetResponseSchema,
  petResponseSchema,
} from "#/api/pets/schemas.js";
import {
  handleDeleteEvent,
  handleDeletePet,
  handleGetPet,
  handleRegisterEvent,
  handleRegisterPet,
  handleRegisterVaccination,
  handleUpdatePet,
} from "#/api/shelters/pets/handlers.js";
import {
  petEventParamsSchema,
  registerEventBodySchema,
  registerPetBodySchema,
  registerVaccinationBodySchema,
  shelterIdParamsSchema,
  shelterPetParamsSchema,
  updatePetBodySchema,
} from "#/api/shelters/pets/schemas.js";

export const shelterPetsRouter = Router({ mergeParams: true });

shelterPetsRouter.post(
  "/",
  requirePermission(Permissions.PETS_WRITE),
  handleRegisterPet,
);

shelterPetsRouter.get("/:petId", handleGetPet);

shelterPetsRouter.patch(
  "/:petId",
  requirePermission(Permissions.PETS_WRITE),
  handleUpdatePet,
);

shelterPetsRouter.delete(
  "/:petId",
  requirePermission(Permissions.PETS_DELETE),
  handleDeletePet,
);

shelterPetsRouter.post(
  "/:petId/vaccinations",
  requirePermission(Permissions.VACCINATIONS_WRITE),
  handleRegisterVaccination,
);

shelterPetsRouter.post(
  "/:petId/events",
  requirePermission(Permissions.EVENTS_WRITE),
  handleRegisterEvent,
);

shelterPetsRouter.delete(
  "/:petId/events/:eventId",
  requirePermission(Permissions.EVENTS_WRITE),
  handleDeleteEvent,
);

export const shelterPetsPaths: ZodOpenApiPathsObject = {
  "/shelters/{shelterId}/pets": {
    post: {
      requestParams: {
        path: shelterIdParamsSchema,
      },
      requestBody: {
        content: {
          "application/json": {
            schema: registerPetBodySchema,
          },
        },
      },
      responses: {
        [StatusCodes.CREATED]: {
          content: {
            "application/json": {
              schema: petResponseSchema,
            },
          },
        },
      },
    },
  },
  "/shelters/{shelterId}/pets/{petId}": {
    get: {
      requestParams: {
        path: shelterPetParamsSchema,
      },
      responses: {
        [StatusCodes.OK]: {
          content: {
            "application/json": {
              schema: detailedPetResponseSchema,
            },
          },
        },
        [StatusCodes.NOT_FOUND]: {
          content: {
            "application/json": {
              schema: z.object({ error: z.string() }),
            },
          },
        },
      },
    },
    patch: {
      requestParams: { path: shelterPetParamsSchema },
      requestBody: {
        content: {
          "application/json": {
            schema: updatePetBodySchema,
          },
        },
      },
      responses: {
        [StatusCodes.OK]: {
          content: {
            "application/json": {
              schema: petResponseSchema,
            },
          },
        },
        [StatusCodes.NOT_FOUND]: {
          content: {
            "application/json": {
              schema: z.object({ error: z.string() }),
            },
          },
        },
      },
    },
    delete: {
      requestParams: { path: shelterPetParamsSchema },
      responses: {
        [StatusCodes.OK]: {
          description: "Pet deleted",
        },
        [StatusCodes.NOT_FOUND]: {
          content: {
            "application/json": {
              schema: z.object({ error: z.string() }),
            },
          },
        },
      },
    },
  },
  "/shelters/{shelterId}/pets/{petId}/vaccinations": {
    post: {
      requestParams: { path: shelterPetParamsSchema },
      requestBody: {
        content: {
          "application/json": {
            schema: registerVaccinationBodySchema,
          },
        },
      },
      responses: {
        [StatusCodes.CREATED]: {
          content: {
            "application/json": {
              schema: z.object({
                vaccineName: z.string(),
                vaccineCode: z.string(),
                administeredAt: z.iso.datetime(),
              }),
            },
          },
        },
        [StatusCodes.NOT_FOUND]: {
          content: {
            "application/json": {
              schema: z.object({ error: z.string() }),
            },
          },
        },
      },
    },
  },
  "/shelters/{shelterId}/pets/{petId}/events": {
    post: {
      requestParams: { path: shelterPetParamsSchema },
      requestBody: {
        content: {
          "application/json": {
            schema: registerEventBodySchema,
          },
        },
      },
      responses: {
        [StatusCodes.CREATED]: {
          content: {
            "application/json": {
              schema: z.object({
                id: z.number().int().positive(),
                name: z.string(),
                description: z.string().nullable(),
                createdAt: z.iso.datetime(),
              }),
            },
          },
        },
        [StatusCodes.NOT_FOUND]: {
          content: {
            "application/json": {
              schema: z.object({ error: z.string() }),
            },
          },
        },
      },
    },
  },
  "/shelters/{shelterId}/pets/{petId}/events/{eventId}": {
    delete: {
      requestParams: { path: petEventParamsSchema },
      responses: {
        [StatusCodes.OK]: {
          description: "Event deleted",
        },
        [StatusCodes.NOT_FOUND]: {
          content: {
            "application/json": {
              schema: z.object({ error: z.string() }),
            },
          },
        },
      },
    },
  },
};
