import type { db } from "@/db";
import { vaccines } from "@/db/schema";
import vaccinesData from "./data/vaccines.json";

export async function seedVaccines(db: db) {
  const values = vaccinesData.map((v: { code: string; name: string }) => ({
    code: v.code,
    name: v.name,
  }));

  await db.insert(vaccines).values(values);
}
