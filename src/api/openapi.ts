import { apiReference } from "@scalar/express-api-reference";
import { Router } from "express";
import { createDocument } from "zod-openapi";
import { petsPaths } from "#/api/pets/routes.js";
import { sheltersPaths } from "#/api/shelters/routes.js";
import { usersPaths } from "#/api/users/routes.js";

const openApiDocument = createDocument({
  openapi: "3.1.0",
  info: {
    title: "Shelly API",
    version: "1.0.0",
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
  },
  security: [{ bearerAuth: [] }],
  paths: {
    ...usersPaths,
    ...sheltersPaths,
    ...petsPaths,
  },
});

export const openApiRouter = Router();

openApiRouter.get("/docs", apiReference({ content: openApiDocument }));
openApiRouter.get("/spec", (_, res) => res.json(openApiDocument));
