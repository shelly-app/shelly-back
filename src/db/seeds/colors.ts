import type { db } from "#/db/index.js";
import { colors } from "#/db/schema/index.js";
import colorsData from "#/db/seeds/data/colors.json" with { type: "json" };

export async function seedColors(db: db) {
  await db.insert(colors).values(colorsData);
}
