import { z } from "zod";
import { hasPermission } from "@/api/middleware/require-permission";
import { buildPublicUrl, deleteObject } from "@/api/storage/s3";
import * as repository from "@/api/users/repository";

export async function findUserWithSharedShelters(
  currentUserId: number,
  targetUserId: number,
) {
  const shelterIds = await repository.findShelterIdsByUserId(currentUserId);

  if (shelterIds.length === 0) return null;

  const targetMemberships = await repository.findMembershipsByUserAndShelterIds(
    targetUserId,
    shelterIds,
  );

  if (targetMemberships.length === 0) return null;

  const targetUser = await repository.findById(targetUserId);

  if (!targetUser) return null;

  return {
    id: targetUser.id,
    name: targetUser.name,
    email: targetUser.email,
    avatarUrl: buildPublicUrl(targetUser.avatarKey),
    shelters: targetMemberships.map((m) => ({
      id: m.shelterId,
      name: m.shelter.name,
      role: m.role.name,
    })),
  };
}

export async function updateUserName(userId: number, name: string) {
  await repository.updateName(userId, name);
}

/**
 * Sets (or clears, with an empty string) the user's avatar. Deletes the
 * previously stored image from S3 after the new key is committed.
 */
export async function updateUserAvatar(userId: number, avatarKey: string) {
  const existing = await repository.findById(userId);
  const previousKey = existing?.avatarKey ?? null;
  const nextKey = avatarKey.length > 0 ? avatarKey : null;

  if (previousKey === nextKey) return;

  await repository.updateAvatarKey(userId, nextKey);

  if (previousKey) {
    await deleteObject(previousKey);
  }
}

export async function canEditUser(
  currentUserId: number,
  targetUserId: number,
): Promise<boolean> {
  const shelterIds = await repository.findShelterIdsByUserId(currentUserId);

  const targetMemberships = await repository.findMembershipsByUserAndShelterIds(
    targetUserId,
    shelterIds,
  );

  if (targetMemberships.length === 0) return false;

  for (const membership of targetMemberships) {
    if (
      await hasPermission(currentUserId, membership.shelterId, "members:write")
    ) {
      return true;
    }
  }

  return false;
}

export async function updateUserShelterRole(
  userId: number,
  shelterId: number,
  roleName: string,
) {
  const role = await repository.findRoleByName(roleName);

  if (!role) {
    throw new z.ZodError([
      {
        code: "custom",
        path: ["shelterRoles", "role"],
        message: `Invalid role: ${roleName}`,
      },
    ]);
  }

  const membership = await repository.findShelterMember(userId, shelterId);

  if (!membership) return null;

  await repository.updateShelterRole(userId, shelterId, role.id);

  return true;
}

export async function findUserById(userId: number) {
  return repository.findById(userId);
}

export async function getAuthenticatedUser(userId: number) {
  const user = await repository.findShelterMemberships(userId);

  if (!user) return null;

  return {
    name: user.name,
    email: user.email,
    avatarUrl: buildPublicUrl(user.avatarKey),
    shelters: user.shelterMemberships.map((membership) => ({
      id: membership.shelterId,
      name: membership.shelter.name,
      role: membership.role.name,
    })),
  };
}
