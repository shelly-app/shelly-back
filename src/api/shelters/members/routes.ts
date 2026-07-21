import { Router } from "express";
import type { ZodOpenApiPathsObject } from "zod-openapi";
import { Permissions, StatusCodes } from "@/api/constants";
import { requirePermission } from "@/api/middleware/require-permission";
import {
  handleGetMembers,
  handleRegisterMember,
  handleRemoveMember,
} from "@/api/shelters/members/handlers";
import {
  memberParamsSchema,
  memberResponseSchema,
  memberUserParamsSchema,
  registerMemberBodySchema,
  registerMemberResponseSchema,
} from "@/api/shelters/members/schemas";

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

shelterMembersRouter.delete(
  "/:userId",
  requirePermission(Permissions.MEMBERS_WRITE),
  handleRemoveMember,
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
  "/shelters/{shelterId}/members/{userId}": {
    delete: {
      requestParams: {
        path: memberUserParamsSchema,
      },
      responses: {
        [StatusCodes.OK]: {
          description: "Member removed",
        },
        [StatusCodes.FORBIDDEN]: {
          description: "Only shelter admins can remove other members",
        },
        [StatusCodes.NOT_FOUND]: {
          description: "Member not found",
        },
      },
    },
  },
};
