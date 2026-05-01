import type { z } from "zod";
import type { detailedPetResponseSchema } from "@/api/pets/schemas";
import * as repository from "@/api/shelters/repository";

export async function findAllShelters() {
  return repository.findAll();
}

export async function findShelterById(id: number) {
  return repository.findById(id);
}

export async function findShelterPets(shelterId: number) {
  const pets = await repository.findPets(shelterId);

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
