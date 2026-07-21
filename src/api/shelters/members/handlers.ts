import type { Request, Response } from "express";
import { StatusCodes } from "@/api/constants";
import {
  memberParamsSchema,
  memberUserParamsSchema,
  registerMemberBodySchema,
} from "@/api/shelters/members/schemas";
import {
  findShelterMembers,
  registerMember,
  removeMember,
} from "@/api/shelters/members/services";
import { isShelterAdmin } from "@/api/users/services";
import type { User } from "@/db/schema";

export async function handleGetMembers(req: Request, res: Response) {
  const { shelterId } = memberParamsSchema.parse(req.params);
  const members = await findShelterMembers(shelterId);
  return res.status(StatusCodes.OK).json(members);
}

export async function handleRegisterMember(req: Request, res: Response) {
  const { shelterId } = memberParamsSchema.parse(req.params);
  const body = registerMemberBodySchema.parse(req.body);
  const currentUser = req.user as User;

  if (!(await isShelterAdmin(currentUser.id, shelterId))) {
    return res
      .status(StatusCodes.FORBIDDEN)
      .json({ error: "Forbidden: Only shelter admins can invite members" });
  }

  const result = await registerMember(shelterId, body.email, body.role);

  if ("data" in result) {
    return res.status(StatusCodes.CREATED).json(result.data);
  }

  return res.status(result.status).json({ error: result.error });
}

export async function handleRemoveMember(req: Request, res: Response) {
  const { shelterId, userId } = memberUserParamsSchema.parse(req.params);
  const currentUser = req.user as User;

  if (currentUser.id === userId) {
    return res
      .status(StatusCodes.FORBIDDEN)
      .json({ error: "Forbidden: You cannot remove yourself from a shelter" });
  }

  if (!(await isShelterAdmin(currentUser.id, shelterId))) {
    return res
      .status(StatusCodes.FORBIDDEN)
      .json({ error: "Forbidden: Only shelter admins can remove members" });
  }

  const result = await removeMember(shelterId, userId);

  if ("error" in result) {
    return res.status(result.status).json({ error: result.error });
  }

  return res.status(StatusCodes.OK).send();
}
