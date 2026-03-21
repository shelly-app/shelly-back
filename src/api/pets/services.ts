import type { z } from "zod";
import type { petResponseSchema } from "#/api/pets/schemas.js";
import { db } from "#/db/index.js";
import { petStatus } from "#/db/schema/index.js";

export async function findAllPublicPets() {
  const pets = await db.query.pet.findMany({
    where: (pet, { and, eq, inArray, isNull }) =>
      and(
        isNull(pet.deletedAt),
        inArray(
          pet.statusId,
          db
            .select({ id: petStatus.id })
            .from(petStatus)
            .where(eq(petStatus.status, "in_shelter")),
        ),
      ),
    with: {
      specie: true,
      status: true,
      shelter: true,
      petColors: {
        with: {
          color: true,
        },
      },
    },
  });

  return pets.map(
    (p): z.infer<typeof petResponseSchema> => ({
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
    }),
  );
}

export async function findPublicPetById(id: number) {
  const pet = await db.query.pet.findFirst({
    where: (p, { and, eq, inArray, isNull }) =>
      and(
        isNull(p.deletedAt),
        eq(p.id, id),
        inArray(
          p.statusId,
          db
            .select({ id: petStatus.id })
            .from(petStatus)
            .where(eq(petStatus.status, "in_shelter")),
        ),
      ),
    with: {
      specie: true,
      status: true,
      shelter: true,
      petColors: {
        with: {
          color: true,
        },
      },
    },
  });

  if (!pet) return null;

  const response: z.infer<typeof petResponseSchema> = {
    id: pet.id,
    name: pet.name,
    birthDate: pet.birthDate,
    breed: pet.breed,
    specie: pet.specie.name,
    sex: pet.sex,
    size: pet.size,
    status: pet.status.status,
    description: pet.description,
    colors: pet.petColors.map(({ color }) => color.color),
    shelter: { name: pet.shelter.name, city: pet.shelter.city },
  };

  return response;
}

export async function findAllColors() {
  const result = await db.query.colors.findMany();
  return result.map((c) => c.color);
}

export async function findAllSpecies() {
  return db.query.species.findMany();
}

export async function findAllStatuses() {
  return db.query.petStatus.findMany();
}

export async function findAllVaccines() {
  const vaccines = await db.query.vaccines.findMany({
    with: {
      specie: true,
    },
  });

  return vaccines.map((v) => ({
    code: v.code,
    name: v.name,
    specie: v.specie.name,
  }));
}
