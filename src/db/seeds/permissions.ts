import type { db } from "#/db/index.js";
import { permissions } from "#/db/schema/index.js";
import permissionsData from "#/db/seeds/data/permissions.json" with {
  type: "json",
};

export async function seedPermissions(db: db) {
  await db.insert(permissions).values(permissionsData);
}
