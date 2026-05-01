import type { z } from "zod";
import type { detailedPetResponseSchema } from "@/api/pets/schemas";
import * as repository from "@/api/shelters/repository";
import type {
  SexValue,
  SizeValue,
  SpecieValue,
  StatusValue,
} from "@/db/schema";

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
      specie: p.specie as SpecieValue,
      sex: p.sex as SexValue,
      size: p.size as SizeValue,
      status: p.status as StatusValue,
      description: p.description,
      colors: (p.colors ?? []) as string[],
      shelter: { name: p.shelter.name, city: p.shelter.city },
      vaccinations: p.vaccinations.map((v) => ({
        vaccine: v.vaccine.name,
        administeredAt: v.administeredAt.toISOString(),
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
