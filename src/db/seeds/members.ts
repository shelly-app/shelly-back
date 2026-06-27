import type { db } from "@/db";
import { shelter, shelterMembers, users } from "@/db/schema";
import { seedAdminEmails } from "@/env";

export async function seedMembers(db: db) {
  if (!seedAdminEmails) return;

  if (seedAdminEmails.length === 0) return;

  const [allShelters, adminRole] = await Promise.all([
    db.select().from(shelter),
    db.query.roles.findFirst({ where: (r, { eq }) => eq(r.name, "admin") }),
  ]);

  if (!adminRole) throw new Error("Admin role not found");

  for (const email of seedAdminEmails) {
    const [inserted] = await db
      .insert(users)
      .values({
        email,
        name: email.split("@")[0] ?? "",
        cognitoSub: `pending:${email}`,
      })
      .onConflictDoNothing()
      .returning();

    const user =
      inserted ??
      (await db.query.users.findFirst({
        where: (r, { eq }) => eq(r.email, email),
      }));

    if (!user) continue;

    const memberships = allShelters.map((s) => ({
      userId: user.id,
      shelterId: s.id,
      roleId: adminRole.id,
    }));

    await db.insert(shelterMembers).values(memberships).onConflictDoNothing();
  }
}
