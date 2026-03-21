import type { Request, Response } from "express";
import { StatusCodes } from "#/api/constants.js";
import {
  memberParamsSchema,
  registerMemberBodySchema,
} from "#/api/shelters/members/schemas.js";
import {
  findShelterMembers,
  registerMember,
} from "#/api/shelters/members/services.js";

export async function handleGetMembers(req: Request, res: Response) {
  const { shelterId } = memberParamsSchema.parse(req.params);
  const members = await findShelterMembers(shelterId);
  return res.status(StatusCodes.OK).json(members);
}

export async function handleRegisterMember(req: Request, res: Response) {
  const { shelterId } = memberParamsSchema.parse(req.params);
  const body = registerMemberBodySchema.parse(req.body);
  const result = await registerMember(shelterId, body.email, body.role);

  if ("data" in result) {
    return res.status(StatusCodes.CREATED).json(result.data);
  }

  return res.status(result.status).json({ error: result.error });
}
