import { ZodError } from "zod";
import * as repository from "@/api/shelters/members/repository";
import { buildPublicUrl } from "@/api/storage/s3";

export async function findShelterMembers(shelterId: number) {
  const members = await repository.findByShelterId(shelterId);

  return members.map((m) => ({
    userId: m.userId,
    name: m.user.name,
    email: m.user.email,
    avatarUrl: buildPublicUrl(m.user.avatarKey),
    role: m.role.name,
    joinedAt: m.joinedAt,
  }));
}

export async function registerMember(
  shelterId: number,
  email: string,
  roleName: string,
) {
  const role = await repository.findRoleByName(roleName);

  if (!role) {
    throw new ZodError([
      {
        code: "custom",
        path: ["role"],
        message: `Invalid role: ${roleName}`,
      },
    ]);
  }

  let user = await repository.findUserByEmail(email);

  if (!user) {
    user = await repository.create({
      email: email,
      name: email.split("@")[0] ?? email,
      cognitoSub: `pending:${email}`,
    });
  }

  if (!user) {
    return { error: "Failed to create user" as const, status: 500 as const };
  }

  const existingMembership = await repository.findMembership(
    user.id,
    shelterId,
  );

  if (existingMembership) {
    return {
      error: "User is already a member of this shelter" as const,
      status: 400 as const,
    };
  }

  await repository.createMembership({
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
