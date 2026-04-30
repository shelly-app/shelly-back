import type { db } from "@/db";
import { colors } from "@/db/schema";
import colorsData from "./data/colors.json";

export async function seedColors(db: db) {
  await db.insert(colors).values(colorsData);
}
