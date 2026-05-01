import type { db } from "@/db";
import {
  type ColorValue,
  events,
  pet,
  type SpecieValue,
  type StatusValue,
  shelter,
  vaccinations,
  vaccines,
} from "@/db/schema";
import petsData from "./data/pets.json";

export async function seedPets(db: db) {
  const [allShelters, allVaccines] = await Promise.all([
    db.select().from(shelter),
    db.select().from(vaccines),
  ]);

  const shelterMap = new Map(allShelters.map((s) => [s.name, s.id]));
  const vaccinesMap = new Map(allVaccines.map((v) => [v.code, v.id]));

  for (const p of petsData) {
    const shelterId = shelterMap.get(p.shelter);

    if (!shelterId) {
      throw new Error(`Failed to resolve shelter for pet ${p.name}`);
    }

    const [insertedPet] = await db
      .insert(pet)
      .values({
        name: p.name,
        birthDate: p.birthDate ? new Date(p.birthDate).toISOString() : null,
        breed: p.breed,
        sex: p.sex as "male" | "female",
        size: p.size as "small" | "medium" | "large",
        specie: p.specie as SpecieValue,
        colors: p.colors as ColorValue[] | undefined,
        status: p.status as StatusValue,
        description: p.description,
        shelterId,
      })
      .returning();

    if (!insertedPet) {
      throw new Error(`Failed to insert pet ${p.name}`);
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
