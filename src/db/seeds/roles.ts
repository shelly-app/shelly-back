import type { db } from "#/db/index.js";
import { roles } from "#/db/schema/index.js";
import rolesData from "#/db/seeds/data/roles.json" with { type: "json" };

export async function seedRoles(db: db) {
  await db.insert(roles).values(rolesData);
}
