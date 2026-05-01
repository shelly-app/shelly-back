import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { StatusCodes } from "@/api/constants";
import { debug } from "@/env";

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
  const response: Record<string, unknown> = { error: "Internal Server Error" };
  if (debug && err.stack) {
    response.stack = err.stack;
  }
  return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(response);
}
