import { Router } from "express";
import type { ZodOpenApiPathsObject } from "zod-openapi";
import { StatusCodes } from "@/api/constants";
import { handleCreateContactSubmission } from "@/api/contact/handlers";
import {
  contactSubmissionResponseSchema,
  createContactSubmissionBodySchema,
} from "@/api/contact/schemas";

/**
 * Public contact / lead-capture route for the marketing landing page.
 * Mounted at the API root (no authentication) in `app.ts`.
 */
export const contactRouter = Router();

contactRouter.post("/contact", handleCreateContactSubmission);

export const contactPaths: ZodOpenApiPathsObject = {
  "/contact": {
    post: {
      security: [],
      requestBody: {
        content: {
          "application/json": {
            schema: createContactSubmissionBodySchema,
          },
        },
      },
      responses: {
        [StatusCodes.CREATED]: {
          description: "Contact submission received",
          content: {
            "application/json": {
              schema: contactSubmissionResponseSchema,
            },
          },
        },
      },
    },
  },
};
