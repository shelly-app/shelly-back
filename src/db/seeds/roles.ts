import type { db } from "@/db";
import { roles } from "@/db/schema";
import rolesData from "./data/roles.json";

export async function seedRoles(db: db) {
  await db.insert(roles).values(rolesData);
}
