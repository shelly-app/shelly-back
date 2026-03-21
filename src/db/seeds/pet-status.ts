import type { db } from "#/db/index.js";
import { petStatus } from "#/db/schema/index.js";
import petStatusData from "#/db/seeds/data/pet-status.json" with {
  type: "json",
};

export async function seedPetStatus(db: db) {
  await db.insert(petStatus).values(petStatusData);
}
