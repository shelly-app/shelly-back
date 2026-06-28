import { Router } from "express";
import { z } from "zod";
import type { ZodOpenApiPathsObject } from "zod-openapi";
import { Permissions, StatusCodes } from "@/api/constants";
import { requirePermission } from "@/api/middleware/require-permission";
import {
  handleCreateAdoptionRequest,
  handleListAdoptionRequests,
  handleUpdateAdoptionRequest,
} from "@/api/shelters/adoption-requests/handlers";
import {
  adoptionRequestListResponseSchema,
  adoptionRequestParamsSchema,
  adoptionRequestResponseSchema,
  createAdoptionRequestBodySchema,
  listAdoptionRequestsQuerySchema,
  shelterIdParamsSchema,
  shelterPetParamsSchema,
  updateAdoptionRequestBodySchema,
} from "@/api/shelters/adoption-requests/schemas";

/**
 * Authenticated, permission-gated management routes.
 * Mounted under `/shelters/:shelterId/adoption-requests`.
 */
export const shelterAdoptionRequestsRouter = Router({ mergeParams: true });

shelterAdoptionRequestsRouter.get(
  "/",
  requirePermission(Permissions.REQUESTS_READ),
  handleListAdoptionRequests,
);

shelterAdoptionRequestsRouter.patch(
  "/:requestId",
  requirePermission(Permissions.REQUESTS_WRITE),
  handleUpdateAdoptionRequest,
);

/**
 * Public route used by prospective adopters on the public shelter pages.
 * Mounted at the API root (no authentication) in `app.ts`.
 */
export const publicAdoptionRequestsRouter = Router();

publicAdoptionRequestsRouter.post(
  "/shelters/:shelterId/pets/:petId/adoption-requests",
  handleCreateAdoptionRequest,
);

const errorSchema = z.object({ error: z.string() });

export const adoptionRequestsPaths: ZodOpenApiPathsObject = {
  "/shelters/{shelterId}/adoption-requests": {
    get: {
      requestParams: {
        path: shelterIdParamsSchema,
        query: listAdoptionRequestsQuerySchema,
      },
      responses: {
        [StatusCodes.OK]: {
          description: "List of adoption requests for the shelter",
          content: {
            "application/json": {
              schema: adoptionRequestListResponseSchema,
            },
          },
        },
      },
    },
  },
  "/shelters/{shelterId}/adoption-requests/{requestId}": {
    patch: {
      requestParams: { path: adoptionRequestParamsSchema },
      requestBody: {
        content: {
          "application/json": {
            schema: updateAdoptionRequestBodySchema,
          },
        },
      },
      responses: {
        [StatusCodes.OK]: {
          description: "Updated adoption request",
          content: {
            "application/json": {
              schema: adoptionRequestResponseSchema,
            },
          },
        },
        [StatusCodes.NOT_FOUND]: {
          description: "Adoption request not found",
          content: { "application/json": { schema: errorSchema } },
        },
      },
    },
  },
  "/shelters/{shelterId}/pets/{petId}/adoption-requests": {
    post: {
      security: [],
      requestParams: { path: shelterPetParamsSchema },
      requestBody: {
        content: {
          "application/json": {
            schema: createAdoptionRequestBodySchema,
          },
        },
      },
      responses: {
        [StatusCodes.CREATED]: {
          description: "Adoption request submitted",
          content: {
            "application/json": {
              schema: adoptionRequestResponseSchema,
            },
          },
        },
        [StatusCodes.NOT_FOUND]: {
          description: "Pet not found in shelter",
          content: { "application/json": { schema: errorSchema } },
        },
      },
    },
  },
};
