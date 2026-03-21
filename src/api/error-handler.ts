import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { StatusCodes } from "#/api/constants.js";

export function handleError(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  console.error(err);
  if (err instanceof ZodError) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ error: "Validation Error", details: err.issues });
  }
  return res
    .status(StatusCodes.INTERNAL_SERVER_ERROR)
    .json({ error: "Internal Server Error" });
}
