import { eq } from "drizzle-orm";
import type { z } from "zod";
import type { detailedPetResponseSchema } from "@/api/pets/schemas";
import { db } from "@/db";
import { shelter } from "@/db/schema";

export async function findAllShelters() {
  return db.query.shelter.findMany({
    columns: {
      id: false,
    },
  });
}

export async function findShelterById(id: number) {
  const shelters = await db.select().from(shelter).where(eq(shelter.id, id));
  return shelters[0] ?? null;
}

export async function findShelterPets(shelterId: number) {
  const pets = await db.query.pet.findMany({
    where: (pet, { and, eq, isNull }) =>
      and(isNull(pet.deletedAt), eq(pet.shelterId, shelterId)),
    with: {
      specie: true,
      status: true,
      shelter: true,
      petColors: {
        with: {
          color: true,
        },
      },
      vaccinations: {
        with: {
          vaccine: true,
        },
      },
      statusHistory: {
        with: {
          status: true,
        },
      },
      events: true,
    },
  });

  return pets.map(
    (p): z.infer<typeof detailedPetResponseSchema> => ({
      id: p.id,
      name: p.name,
      birthDate: p.birthDate,
      breed: p.breed,
      specie: p.specie.name,
      sex: p.sex,
      size: p.size,
      status: p.status.status,
      description: p.description,
      colors: p.petColors.map((pc) => pc.color.color),
      shelter: { name: p.shelter.name, city: p.shelter.city },
      vaccinations: p.vaccinations.map((v) => ({
        vaccine: v.vaccine.name,
        administeredAt: v.administeredAt.toISOString(),
      })),
      statusHistory: p.statusHistory.map((h) => ({
        status: h.status.status,
        changedAt: h.changedAt.toISOString(),
      })),
      events: p.events.map(({ id, name, description, createdAt }) => ({
        id,
        name,
        description,
        createdAt: createdAt.toISOString(),
      })),
    }),
  );
}
