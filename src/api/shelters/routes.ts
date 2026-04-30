import { Router } from "express";
import { z } from "zod";
import type { ZodOpenApiPathsObject } from "zod-openapi";
import { StatusCodes } from "@/api/constants";
import { authMiddleware } from "@/api/middleware/auth";
import { detailedPetResponseSchema } from "@/api/pets/schemas";
import {
  getAllShelters,
  getShelter,
  getShelterPets,
} from "@/api/shelters/handlers";
import {
  shelterMembersPaths,
  shelterMembersRouter,
} from "@/api/shelters/members/routes";
import {
  shelterPetsPaths,
  shelterPetsRouter,
} from "@/api/shelters/pets/routes";
import {
  shelterIdParamsSchema,
  shelterSelectSchema,
} from "@/api/shelters/schemas";

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
