import type { db } from "#/db/index.js";
import { shelter } from "#/db/schema/index.js";
import shelters from "#/db/seeds/data/shelters.json" with { type: "json" };

export async function seedShelter(db: db) {
  await db.insert(shelter).values(shelters);
}
