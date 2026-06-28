import { Router } from "express";
import { z } from "zod";
import type { ZodOpenApiPathsObject } from "zod-openapi";
import { StatusCodes } from "@/api/constants";
import { authMiddleware } from "@/api/middleware/auth";
import { detailedPetResponseSchema } from "@/api/pets/schemas";
import {
  adoptionRequestsPaths,
  shelterAdoptionRequestsRouter,
} from "@/api/shelters/adoption-requests/routes";
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

/**
 * Public, unauthenticated routes used by the prospective-adopter flow
 * (available shelters -> a shelter's pets). Mounted at the API root before the
 * authenticated routers in `app.ts`.
 */
export const publicSheltersRouter = Router();

publicSheltersRouter.get("/shelters", getAllShelters);
publicSheltersRouter.get("/shelters/:id", getShelter);
publicSheltersRouter.get("/shelters/:id/pets", getShelterPets);

/**
 * Authenticated routes for shelter staff. The public GET routes above are
 * served first, so only the nested staff routers (pets CRUD, members,
 * adoption-request management) require a token here.
 */
export const sheltersRouter = Router();

sheltersRouter.use(authMiddleware);

sheltersRouter.use("/shelters/:shelterId/pets", shelterPetsRouter);
sheltersRouter.use("/shelters/:shelterId/members", shelterMembersRouter);
sheltersRouter.use(
  "/shelters/:shelterId/adoption-requests",
  shelterAdoptionRequestsRouter,
);

export const sheltersPaths: ZodOpenApiPathsObject = {
  "/shelters": {
    get: {
      security: [],
      responses: {
        [StatusCodes.OK]: {
          content: {
            "application/json": {
              schema: z.array(shelterSelectSchema),
            },
          },
        },
      },
    },
  },
  "/shelters/{id}": {
    get: {
      security: [],
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
      security: [],
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
  ...adoptionRequestsPaths,
};
