import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { roles, shelterMembers, users } from "@/db/schema";

export async function findById(userId: number) {
  return db.query.users.findFirst({
    where: eq(users.id, userId),
  });
}

export async function findByEmail(email: string) {
  return db.query.users.findFirst({
    where: eq(users.email, email),
  });
}

export async function updateName(userId: number, name: string) {
  await db.update(users).set({ name }).where(eq(users.id, userId));
}

export async function updateAvatarKey(
  userId: number,
  avatarKey: string | null,
) {
  await db.update(users).set({ avatarKey }).where(eq(users.id, userId));
}

export async function findShelterMemberships(userId: number) {
  return db.query.users.findFirst({
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
}

export async function findRoleByName(roleName: string) {
  return db.query.roles.findFirst({
    where: eq(roles.name, roleName),
  });
}

export async function findShelterMember(userId: number, shelterId: number) {
  return db.query.shelterMembers.findFirst({
    where: and(
      eq(shelterMembers.userId, userId),
      eq(shelterMembers.shelterId, shelterId),
    ),
    with: { role: true },
  });
}

export async function updateShelterRole(
  userId: number,
  shelterId: number,
  roleId: number,
) {
  await db
    .update(shelterMembers)
    .set({ roleId })
    .where(
      and(
        eq(shelterMembers.userId, userId),
        eq(shelterMembers.shelterId, shelterId),
      ),
    );
}

export async function findShelterIdsByUserId(userId: number) {
  const result = await db
    .select({ shelterId: shelterMembers.shelterId })
    .from(shelterMembers)
    .where(eq(shelterMembers.userId, userId));
  return result.map((s) => s.shelterId);
}

export async function findMembershipsByUserAndShelterIds(
  userId: number,
  shelterIds: number[],
) {
  return db.query.shelterMembers.findMany({
    where: and(
      eq(shelterMembers.userId, userId),
      inArray(shelterMembers.shelterId, shelterIds),
    ),
    with: {
      shelter: true,
      role: true,
    },
  });
}
