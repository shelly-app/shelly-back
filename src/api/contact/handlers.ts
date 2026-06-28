import type { Request, Response } from "express";
import { StatusCodes } from "@/api/constants";
import { createContactSubmissionBodySchema } from "@/api/contact/schemas";
import { createContactSubmission } from "@/api/contact/services";

export async function handleCreateContactSubmission(
  req: Request,
  res: Response,
) {
  const body = createContactSubmissionBodySchema.parse(req.body);
  const result = await createContactSubmission(body);
  return res.status(StatusCodes.CREATED).json(result);
}
