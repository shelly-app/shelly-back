import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { hasPermission } from "#/api/middleware/require-permission.js";
import { db } from "#/db/index.js";
import { roles, shelterMembers, users } from "#/db/schema/index.js";

export async function findUserWithSharedShelters(
  currentUserId: number,
  targetUserId: number,
) {
  const currentUserShelterIds = await db
    .select({ shelterId: shelterMembers.shelterId })
    .from(shelterMembers)
    .where(eq(shelterMembers.userId, currentUserId));

  const shelterIds = currentUserShelterIds.map((s) => s.shelterId);

  if (shelterIds.length === 0) return null;

  const targetMemberships = await db.query.shelterMembers.findMany({
    where: and(
      eq(shelterMembers.userId, targetUserId),
      inArray(shelterMembers.shelterId, shelterIds),
    ),
    with: {
      shelter: true,
      role: true,
    },
  });

  if (targetMemberships.length === 0) return null;

  const targetUser = await db.query.users.findFirst({
    where: eq(users.id, targetUserId),
  });

  if (!targetUser) return null;

  return {
    id: targetUser.id,
    name: targetUser.name,
    email: targetUser.email,
    shelters: targetMemberships.map((m) => ({
      id: m.shelterId,
      name: m.shelter.name,
      role: m.role.name,
    })),
  };
}

export async function updateUserName(userId: number, name: string) {
  await db.update(users).set({ name }).where(eq(users.id, userId));
}

export async function canEditUser(
  currentUserId: number,
  targetUserId: number,
): Promise<boolean> {
  const currentUserShelterIds = await db
    .select({ shelterId: shelterMembers.shelterId })
    .from(shelterMembers)
    .where(eq(shelterMembers.userId, currentUserId));

  const shelterIds = currentUserShelterIds.map((s) => s.shelterId);

  const targetMemberships = await db.query.shelterMembers.findMany({
    where: and(
      eq(shelterMembers.userId, targetUserId),
      inArray(shelterMembers.shelterId, shelterIds),
    ),
  });

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
  const role = await db.query.roles.findFirst({
    where: eq(roles.name, roleName),
  });

  if (!role) {
    throw new z.ZodError([
      {
        code: "custom",
        path: ["shelterRoles", "role"],
        message: `Invalid role: ${roleName}`,
      },
    ]);
  }

  const membership = await db.query.shelterMembers.findFirst({
    where: and(
      eq(shelterMembers.userId, userId),
      eq(shelterMembers.shelterId, shelterId),
    ),
  });

  if (!membership) return null;

  await db
    .update(shelterMembers)
    .set({ roleId: role.id })
    .where(
      and(
        eq(shelterMembers.userId, userId),
        eq(shelterMembers.shelterId, shelterId),
      ),
    );

  return true;
}

export async function findUserById(userId: number) {
  return db.query.users.findFirst({
    where: eq(users.id, userId),
  });
}

export async function getAuthenticatedUser(userId: number) {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    with: {
      shelterMemberships: {
        with: {
          shelter: true,
          role: true,
        },
      },
    },
  });

  if (!user) return null;

  return {
    name: user.name,
    email: user.email,
    shelters: user.shelterMemberships.map((membership) => ({
      id: membership.shelterId,
      name: membership.shelter.name,
      role: membership.role.name,
    })),
  };
}
