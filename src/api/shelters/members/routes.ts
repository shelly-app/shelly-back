import { Router } from "express";
import type { ZodOpenApiPathsObject } from "zod-openapi";
import { Permissions, StatusCodes } from "#/api/constants.js";
import { requirePermission } from "#/api/middleware/require-permission.js";
import {
  handleGetMembers,
  handleRegisterMember,
} from "#/api/shelters/members/handlers.js";
import {
  memberParamsSchema,
  memberResponseSchema,
  registerMemberBodySchema,
  registerMemberResponseSchema,
} from "#/api/shelters/members/schemas.js";

export const shelterMembersRouter = Router({ mergeParams: true });

shelterMembersRouter.get(
  "/",
  requirePermission(Permissions.MEMBERS_READ),
  handleGetMembers,
);

shelterMembersRouter.post(
  "/",
  requirePermission(Permissions.MEMBERS_WRITE),
  handleRegisterMember,
);

export const shelterMembersPaths: ZodOpenApiPathsObject = {
  "/shelters/{shelterId}/members": {
    get: {
      requestParams: {
        path: memberParamsSchema,
      },
      responses: {
        [StatusCodes.OK]: {
          description: "List of shelter members",
          content: {
            "application/json": {
              schema: memberResponseSchema,
            },
          },
        },
      },
    },
    post: {
      requestParams: {
        path: memberParamsSchema,
      },
      requestBody: {
        content: {
          "application/json": {
            schema: registerMemberBodySchema,
          },
        },
      },
      responses: {
        [StatusCodes.CREATED]: {
          description: "Member registered",
          content: {
            "application/json": {
              schema: registerMemberResponseSchema,
            },
          },
        },
        [StatusCodes.BAD_REQUEST]: {
          description: "User already a member",
        },
        [StatusCodes.NOT_FOUND]: {
          description: "Shelter not found",
        },
      },
    },
  },
};
