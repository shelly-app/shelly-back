import type { db } from "#/db/index.js";
import {
  colors,
  events,
  pet,
  petColors,
  petStatus,
  petStatusHistory,
  shelter,
  species,
  vaccinations,
  vaccines,
} from "#/db/schema/index.js";

const petsData = (
  await import("#/db/seeds/data/pets.json", { with: { type: "json" } })
).default as {
  name: string;
  birthDate: string | null;
  breed: string;
  specie: string;
  sex: string;
  size: string;
  status: string;
  description: string | null;
  shelter: string;
  colors?: string[];
  vaccinations?: { vaccineCode: string; administeredAt: string }[];
  statusHistory?: { status: string; changedAt: string }[];
  events?: { name: string; description: string | null; createdAt: string }[];
}[];

export async function seedPets(db: db) {
  const [allSpecies, allStatuses, allShelters, allColors, allVaccines] =
    await Promise.all([
      db.select().from(species),
      db.select().from(petStatus),
      db.select().from(shelter),
      db.select().from(colors),
      db.select().from(vaccines),
    ]);

  const speciesMap = new Map(allSpecies.map((s) => [s.name, s.id]));
  const statusMap = new Map(allStatuses.map((s) => [s.status, s.id]));
  const shelterMap = new Map(allShelters.map((s) => [s.name, s.id]));
  const colorsMap = new Map(allColors.map((c) => [c.color, c.id]));
  const vaccinesMap = new Map(allVaccines.map((v) => [v.code, v.id]));

  for (const p of petsData) {
    const specieId = speciesMap.get(p.specie);
    const statusId = statusMap.get(p.status);
    const shelterId = shelterMap.get(p.shelter);

    if (!specieId || !statusId || !shelterId) {
      throw new Error(`Failed to resolve relations for pet ${p.name}`);
    }

    const [insertedPet] = await db
      .insert(pet)
      .values({
        name: p.name,
        birthDate: p.birthDate ? new Date(p.birthDate).toISOString() : null,
        breed: p.breed,
        sex: p.sex as "male" | "female",
        size: p.size as "small" | "medium" | "large",
        description: p.description,
        specieId,
        statusId,
        shelterId,
      })
      .returning();

    if (!insertedPet) {
      throw new Error(`Failed to insert pet ${p.name}`);
    }

    if (p.colors && p.colors.length > 0) {
      const colorIds = p.colors
        .map((cName) => colorsMap.get(cName))
        .filter((id) => id !== undefined);

      if (colorIds.length > 0) {
        const petColorValues = colorIds.map((colorId) => ({
          petId: insertedPet.id,
          colorId,
        }));
        await db.insert(petColors).values(petColorValues);
      }
    }

    if (p.vaccinations && p.vaccinations.length > 0) {
      const vaxes = p.vaccinations.map((v) => {
        const vaccineId = vaccinesMap.get(v.vaccineCode);
        if (!vaccineId) {
          throw new Error(`Failed to resolve vaccineCode ${v.vaccineCode}`);
        }
        return {
          petId: insertedPet.id,
          vaccineId,
          administeredAt: new Date(v.administeredAt),
        };
      });
      await db.insert(vaccinations).values(vaxes);
    }

    if (p.statusHistory && p.statusHistory.length > 0) {
      const histories = p.statusHistory.map((h) => {
        const hStatusId = statusMap.get(h.status);
        if (!hStatusId) {
          throw new Error(`Failed to resolve status ${h.status}`);
        }
        return {
          petId: insertedPet.id,
          statusId: hStatusId,
          changedAt: new Date(h.changedAt),
        };
      });
      await db.insert(petStatusHistory).values(histories);
    }

    if (p.events && p.events.length > 0) {
      const eventsList = p.events.map((e) => ({
        petId: insertedPet.id,
        name: e.name,
        description: e.description,
        createdAt: new Date(e.createdAt),
      }));
      await db.insert(events).values(eventsList);
    }
  }
}
