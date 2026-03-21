import { Router } from "express";
import type { ZodOpenApiPathsObject } from "zod-openapi";
import { StatusCodes } from "#/api/constants.js";
import { authMiddleware } from "#/api/middleware/auth.js";
import { getMe, getUser, updateUser } from "#/api/users/handlers.js";
import {
  meResponseSchema,
  updateUserBodySchema,
  updateUserResponseSchema,
  userIdParamsSchema,
  userResponseSchema,
} from "#/api/users/schemas.js";

export const usersRouter = Router();

usersRouter.use(authMiddleware);

usersRouter.get("/users/me", getMe);
usersRouter.get("/users/:id", getUser);
usersRouter.patch("/users/:id", updateUser);

export const usersPaths: ZodOpenApiPathsObject = {
  "/users/me": {
    get: {
      responses: {
        [StatusCodes.OK]: {
          description: "Authenticated user profile",
          content: {
            "application/json": {
              schema: meResponseSchema,
            },
          },
        },
        [StatusCodes.UNAUTHORIZED]: {
          description: "Unauthorized",
        },
      },
    },
  },
  "/users/{id}": {
    get: {
      requestParams: {
        path: userIdParamsSchema,
      },
      responses: {
        [StatusCodes.OK]: {
          description: "User profile with shared shelter memberships",
          content: {
            "application/json": {
              schema: userResponseSchema,
            },
          },
        },
        [StatusCodes.NOT_FOUND]: {
          description: "User not found or no shared shelters",
        },
      },
    },
    patch: {
      requestParams: {
        path: userIdParamsSchema,
      },
      requestBody: {
        content: {
          "application/json": {
            schema: updateUserBodySchema,
          },
        },
      },
      responses: {
        [StatusCodes.OK]: {
          description: "Updated user",
          content: {
            "application/json": {
              schema: updateUserResponseSchema,
            },
          },
        },
        [StatusCodes.FORBIDDEN]: {
          description: "Insufficient permissions",
        },
        [StatusCodes.NOT_FOUND]: {
          description: "User not found",
        },
      },
    },
  },
};
