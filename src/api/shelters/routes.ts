import { Router } from "express";
import { z } from "zod";
import type { ZodOpenApiPathsObject } from "zod-openapi";
import { StatusCodes } from "#/api/constants.js";
import { authMiddleware } from "#/api/middleware/auth.js";
import { detailedPetResponseSchema } from "#/api/pets/schemas.js";
import {
  getAllShelters,
  getShelter,
  getShelterPets,
} from "#/api/shelters/handlers.js";
import {
  shelterMembersPaths,
  shelterMembersRouter,
} from "#/api/shelters/members/routes.js";
import {
  shelterPetsPaths,
  shelterPetsRouter,
} from "#/api/shelters/pets/routes.js";
import {
  shelterIdParamsSchema,
  shelterSelectSchema,
} from "#/api/shelters/schemas.js";

export const sheltersRouter = Router();

sheltersRouter.use(authMiddleware);

sheltersRouter.get("/shelters", getAllShelters);
sheltersRouter.get("/shelters/:id", getShelter);
sheltersRouter.get("/shelters/:id/pets", getShelterPets);

sheltersRouter.use("/shelters/:shelterId/pets", shelterPetsRouter);
sheltersRouter.use("/shelters/:shelterId/members", shelterMembersRouter);

export const sheltersPaths: ZodOpenApiPathsObject = {
  "/shelters": {
    get: {
      responses: {
        [StatusCodes.OK]: {
          content: {
            "application/json": {
              schema: z.array(shelterSelectSchema.omit({ id: true })),
            },
          },
        },
      },
    },
  },
  "/shelters/{id}": {
    get: {
      requestParams: {
        path: shelterIdParamsSchema,
      },
      responses: {
        [StatusCodes.OK]: {
          content: {
            "application/json": {
              schema: shelterSelectSchema,
            },
          },
        },
      },
    },
  },
  "/shelters/{id}/pets": {
    get: {
      requestParams: {
        path: shelterIdParamsSchema,
      },
      responses: {
        [StatusCodes.OK]: {
          content: {
            "application/json": {
              schema: z.array(detailedPetResponseSchema),
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
  ...shelterPetsPaths,
  ...shelterMembersPaths,
};
