import type { db } from "@/db";
import { shelter } from "@/db/schema";
import shelters from "./data/shelters.json";

export async function seedShelter(db: db) {
  await db.insert(shelter).values(shelters);
}
