import { eq } from "drizzle-orm";
import type { db } from "#/db/index.js";
import { permissions, rolePermissions, roles } from "#/db/schema/index.js";
import data from "#/db/seeds/data/role-permissions.json" with { type: "json" };

export async function seedRolePermissions(db: db) {
  for (const entry of data) {
    const role = await db.query.roles.findFirst({
      where: eq(roles.name, entry.roleName),
    });
    const permission = await db.query.permissions.findFirst({
      where: eq(permissions.slug, entry.permissionSlug),
    });

    if (role && permission) {
      await db
        .insert(rolePermissions)
        .values({ roleId: role.id, permissionId: permission.id });
    }
  }
}
