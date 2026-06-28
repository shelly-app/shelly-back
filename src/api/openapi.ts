import { apiReference } from "@scalar/express-api-reference";
import { Router } from "express";
import { createDocument } from "zod-openapi";
import { contactPaths } from "@/api/contact/routes";
import { petsPaths } from "@/api/pets/routes";
import { sheltersPaths } from "@/api/shelters/routes";
import { usersPaths } from "@/api/users/routes";

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
    ...contactPaths,
  },
});

export const openApiRouter = Router();

openApiRouter.get("/docs", apiReference({ content: openApiDocument }));
openApiRouter.get("/spec", (_, res) => res.json(openApiDocument));
