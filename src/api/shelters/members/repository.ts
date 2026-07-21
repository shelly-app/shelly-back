import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { roles, shelter, shelterMembers, users } from "@/db/schema";

export async function findByShelterId(shelterId: number) {
  return db.query.shelterMembers.findMany({
    where: eq(shelterMembers.shelterId, shelterId),
    with: {
      user: true,
      role: true,
    },
  });
}

export async function findRoleByName(roleName: string) {
  return db.query.roles.findFirst({
    where: eq(roles.name, roleName),
  });
}

export async function findShelterById(shelterId: number) {
  return db.query.shelter.findFirst({
    where: eq(shelter.id, shelterId),
  });
}

export async function findUserByEmail(email: string) {
  return db.query.users.findFirst({
    where: eq(users.email, email),
  });
}

export async function create(values: {
  email: string;
  name: string;
  cognitoSub: string;
}) {
  const [newUser] = await db.insert(users).values(values).returning();
  return newUser;
}

export async function createMembership(values: {
  shelterId: number;
  userId: number;
  roleId: number;
}) {
  await db.insert(shelterMembers).values(values);
}

export async function deleteMembership(userId: number, shelterId: number) {
  await db
    .delete(shelterMembers)
    .where(
      and(
        eq(shelterMembers.userId, userId),
        eq(shelterMembers.shelterId, shelterId),
      ),
    );
}

export async function findMembership(userId: number, shelterId: number) {
  return db.query.shelterMembers.findFirst({
    where: and(
      eq(shelterMembers.userId, userId),
      eq(shelterMembers.shelterId, shelterId),
    ),
  });
}
