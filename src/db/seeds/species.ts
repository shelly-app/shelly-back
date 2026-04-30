import type { db } from "@/db";
import { species } from "@/db/schema";
import speciesData from "./data/species.json";

export async function seedSpecies(db: db) {
  await db.insert(species).values(speciesData);
}
