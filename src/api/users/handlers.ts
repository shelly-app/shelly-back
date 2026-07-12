import type { Request, Response } from "express";
import { StatusCodes } from "@/api/constants";
import { hasPermission } from "@/api/middleware/require-permission";
import { buildPublicUrl, createPresignedUpload } from "@/api/storage/s3";
import { uploadUrlBodySchema } from "@/api/storage/schemas";
import { updateUserBodySchema, userIdParamsSchema } from "@/api/users/schemas";
import {
  canEditUser,
  findUserById,
  findUserWithSharedShelters,
  getAuthenticatedUser,
  updateUserAvatar,
  updateUserName,
  updateUserShelterRole,
} from "@/api/users/services";
import type { User } from "@/db/schema";

export async function getMe(req: Request, res: Response) {
  const user = req.user as User;

  const result = await getAuthenticatedUser(user.id);

  return res.status(StatusCodes.OK).json(result);
}

export async function createAvatarUploadUrl(req: Request, res: Response) {
  const { contentType } = uploadUrlBodySchema.parse(req.body);

  const result = await createPresignedUpload("media/avatars", contentType);

  return res.status(StatusCodes.OK).json(result);
}

export async function getUser(req: Request, res: Response) {
  const currentUser = req.user as User;

  const { id } = userIdParamsSchema.parse(req.params);
  const result = await findUserWithSharedShelters(currentUser.id, id);

  if (!result) {
    return res.status(StatusCodes.NOT_FOUND).json({ error: "User not found" });
  }

  return res.status(StatusCodes.OK).json(result);
}

export async function updateUser(req: Request, res: Response) {
  const currentUser = req.user as User;

  const { id } = userIdParamsSchema.parse(req.params);
  const body = updateUserBodySchema.parse(req.body);

  const isSelf = currentUser.id === id;

  if (body.name) {
    if (!isSelf) {
      const canEdit = await canEditUser(currentUser.id, id);
      if (!canEdit) {
        return res
          .status(StatusCodes.FORBIDDEN)
          .json({ error: "Forbidden: Insufficient permissions" });
      }
    }

    await updateUserName(id, body.name);
  }

  if (body.avatarKey !== undefined) {
    if (!isSelf) {
      const canEdit = await canEditUser(currentUser.id, id);
      if (!canEdit) {
        return res
          .status(StatusCodes.FORBIDDEN)
          .json({ error: "Forbidden: Insufficient permissions" });
      }
    }

    await updateUserAvatar(id, body.avatarKey);
  }

  if (body.shelterRoles) {
    for (const shelterRole of body.shelterRoles) {
      const allowed = await hasPermission(
        currentUser.id,
        shelterRole.shelterId,
        "members:write",
      );

      if (!allowed) {
        return res.status(StatusCodes.FORBIDDEN).json({
          error: `Forbidden: Cannot manage members at shelter ${shelterRole.shelterId}`,
        });
      }

      const result = await updateUserShelterRole(
        id,
        shelterRole.shelterId,
        shelterRole.role,
      );

      if (!result) {
        return res.status(StatusCodes.NOT_FOUND).json({
          error: `User is not a member of shelter ${shelterRole.shelterId}`,
        });
      }
    }
  }

  const updatedUser = await findUserById(id);

  if (!updatedUser) {
    return res.status(StatusCodes.NOT_FOUND).json({ error: "User not found" });
  }

  return res.status(StatusCodes.OK).json({
    id: updatedUser.id,
    name: updatedUser.name,
    email: updatedUser.email,
    avatarUrl: buildPublicUrl(updatedUser.avatarKey),
  });
}
