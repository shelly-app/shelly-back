import { Router } from "express";
import { z } from "zod";
import type { ZodOpenApiPathsObject } from "zod-openapi";
import { StatusCodes } from "#/api/constants.js";
import { authMiddleware } from "#/api/middleware/auth.js";
import {
  getAllPets,
  getColors,
  getPet,
  getSpecies,
  getStatus,
  getVaccines,
} from "#/api/pets/handlers.js";
import { petIdParamsSchema, petResponseSchema } from "#/api/pets/schemas.js";

export const petsRouter = Router();

petsRouter.use(authMiddleware);

petsRouter.get("/pets", getAllPets);
petsRouter.get("/pets/status", getStatus);
petsRouter.get("/pets/species", getSpecies);
petsRouter.get("/pets/colors", getColors);
petsRouter.get("/pets/vaccines", getVaccines);
petsRouter.get("/pets/:id", getPet);

export const petsPaths: ZodOpenApiPathsObject = {
  "/pets": {
    get: {
      responses: {
        [StatusCodes.OK]: {
          content: {
            "application/json": {
              schema: z.array(petResponseSchema),
            },
          },
        },
      },
    },
  },
  "/pets/status": {
    get: {
      responses: {
        [StatusCodes.OK]: {
          content: {
            "application/json": {
              schema: z.array(
                z.object({
                  id: z.number(),
                  status: z.string(),
                }),
              ),
            },
          },
        },
      },
    },
  },
  "/pets/species": {
    get: {
      responses: {
        [StatusCodes.OK]: {
          content: {
            "application/json": {
              schema: z.array(z.string()),
            },
          },
        },
      },
    },
  },
  "/pets/colors": {
    get: {
      responses: {
        [StatusCodes.OK]: {
          content: {
            "application/json": {
              schema: z.array(z.string()),
            },
          },
        },
      },
    },
  },
  "/pets/vaccines": {
    get: {
      responses: {
        [StatusCodes.OK]: {
          content: {
            "application/json": {
              schema: z.array(
                z.object({
                  code: z.string(),
                  name: z.string(),
                  specie: z.string(),
                }),
              ),
            },
          },
        },
      },
    },
  },
  "/pets/{id}": {
    get: {
      requestParams: {
        path: petIdParamsSchema,
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
  },
};
