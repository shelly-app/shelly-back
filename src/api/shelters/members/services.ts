import { and, eq } from "drizzle-orm";
import { ZodError } from "zod";
import { db } from "#/db/index.js";
import { roles, shelter, shelterMembers, users } from "#/db/schema/index.js";

export async function findShelterMembers(shelterId: number) {
  const members = await db.query.shelterMembers.findMany({
    where: eq(shelterMembers.shelterId, shelterId),
    with: {
      user: true,
      role: true,
    },
  });

  return members.map((m) => ({
    userId: m.userId,
    name: m.user.name,
    email: m.user.email,
    role: m.role.name,
    joinedAt: m.joinedAt,
  }));
}

export async function registerMember(
  shelterId: number,
  email: string,
  roleName: string,
) {
  const shelterRecord = await db.query.shelter.findFirst({
    where: eq(shelter.id, shelterId),
  });

  if (!shelterRecord) {
    return { error: "Shelter not found" as const, status: 404 as const };
  }

  const role = await db.query.roles.findFirst({
    where: eq(roles.name, roleName),
  });

  if (!role) {
    throw new ZodError([
      {
        code: "custom",
        path: ["role"],
        message: `Invalid role: ${roleName}`,
      },
    ]);
  }

  let user = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (!user) {
    const [newUser] = await db
      .insert(users)
      .values({
        email: email,
        name: email.split("@")[0] ?? email,
        cognitoSub: `pending:${email}`,
      })
      .returning();
    user = newUser;
  }

  if (!user) {
    return { error: "Failed to create user" as const, status: 500 as const };
  }

  const existingMembership = await db.query.shelterMembers.findFirst({
    where: and(
      eq(shelterMembers.userId, user.id),
      eq(shelterMembers.shelterId, shelterId),
    ),
  });

  if (existingMembership) {
    return {
      error: "User is already a member of this shelter" as const,
      status: 400 as const,
    };
  }

  await db.insert(shelterMembers).values({
    shelterId,
    userId: user.id,
    roleId: role.id,
  });

  return {
    data: {
      userId: user.id,
      name: user.name,
      email: user.email,
      role: role.name,
      shelterId,
    },
  };
}
