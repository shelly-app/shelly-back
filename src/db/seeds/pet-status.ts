import type { db } from "@/db";
import { petStatus } from "@/db/schema";
import petStatusData from "./data/pet-status.json";

export async function seedPetStatus(db: db) {
  await db.insert(petStatus).values(petStatusData);
}
