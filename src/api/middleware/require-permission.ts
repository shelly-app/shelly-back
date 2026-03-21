import { and, eq } from "drizzle-orm";
import type { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { type Permissions, StatusCodes } from "#/api/constants.js";
import { db } from "#/db/index.js";
import {
  permissions,
  rolePermissions,
  shelterMembers,
} from "#/db/schema/index.js";

export type PermissionSlug = (typeof Permissions)[keyof typeof Permissions];

const paramsSchema = z.object({
  shelterId: z.coerce.number().int().positive(),
});

export async function hasPermission(
  userId: number,
  shelterId: number,
  permissionSlug: PermissionSlug,
): Promise<boolean> {
  const result = await db
    .select({ id: permissions.id })
    .from(shelterMembers)
    .innerJoin(
      rolePermissions,
      eq(shelterMembers.roleId, rolePermissions.roleId),
    )
    .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
    .where(
      and(
        eq(shelterMembers.userId, userId),
        eq(shelterMembers.shelterId, shelterId),
        eq(permissions.slug, permissionSlug),
      ),
    )
    .limit(1);

  return result.length > 0;
}

export function requirePermission(permissionSlug: PermissionSlug) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    if (!user) {
      res.status(StatusCodes.UNAUTHORIZED).json({ error: "Unauthorized" });
      return;
    }

    const result = paramsSchema.safeParse(req.params);
    if (!result.success) {
      res.status(StatusCodes.BAD_REQUEST).json({ error: "Invalid shelter ID" });
      return;
    }

    try {
      if (await hasPermission(user.id, result.data.shelterId, permissionSlug)) {
        return next();
      }

      res
        .status(StatusCodes.FORBIDDEN)
        .json({ error: "Forbidden: Insufficient permissions" });
    } catch (err) {
      console.error("Permission check error:", err);
      res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({ error: "Internal server error" });
    }
  };
}
