import type { db } from "@/db";
import { vaccines } from "@/db/schema";
import type { SpecieValue } from "@/db/schema/enums";
import vaccinesData from "./data/vaccines.json" with { type: "json" };

export async function seedVaccines(db: db) {
  const values = vaccinesData.map(
    (v: { code: string; name: string; specie: string }) => ({
      code: v.code,
      name: v.name,
      specie: v.specie as SpecieValue,
    }),
  );

  await db.insert(vaccines).values(values);
}
