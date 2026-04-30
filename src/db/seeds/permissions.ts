import type { db } from "@/db";
import { permissions } from "@/db/schema";
import permissionsData from "./data/permissions.json";

export async function seedPermissions(db: db) {
  await db.insert(permissions).values(permissionsData);
}
