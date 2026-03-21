import type { db } from "#/db/index.js";
import { species, vaccines } from "#/db/schema/index.js";
import vaccinesData from "#/db/seeds/data/vaccines.json" with { type: "json" };

export async function seedVaccines(db: db) {
  const allSpecies = await db.select().from(species);
  const speciesMap = new Map(allSpecies.map((s) => [s.name, s.id]));

  const values = vaccinesData.map((v) => {
    const specieId = speciesMap.get(v.specie);
    if (!specieId) {
      throw new Error(
        `Failed to resolve specie ${v.specie} for vaccine ${v.code}`,
      );
    }

    return {
      code: v.code,
      name: v.name,
      specieId,
    };
  });

  await db.insert(vaccines).values(values);
}
