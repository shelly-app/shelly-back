import type { db } from "#/db/index.js";
import { species } from "#/db/schema/index.js";
import speciesData from "#/db/seeds/data/species.json" with { type: "json" };

export async function seedSpecies(db: db) {
  await db.insert(species).values(speciesData);
}
