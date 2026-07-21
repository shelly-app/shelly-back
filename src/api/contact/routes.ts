import { Router } from "express";
import { rateLimit } from "express-rate-limit";
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

const contactRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    error: "Too many contact submissions. Please try again later.",
  },
});

contactRouter.post("/contact", contactRateLimit, handleCreateContactSubmission);

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
        [StatusCodes.TOO_MANY_REQUESTS]: {
          description: "Too many contact submissions",
        },
      },
    },
  },
};
