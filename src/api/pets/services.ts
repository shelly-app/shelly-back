import type { z } from "zod";
import * as repository from "@/api/pets/repository";
import type { petResponseSchema } from "@/api/pets/schemas";

export async function findAllPublicPets() {
  const pets = await repository.findAllPublic();

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
  const pet = await repository.findByIdPublic(id);

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
  const result = await repository.findAllColors();
  return result.map((c) => c.color);
}

export async function findAllSpecies() {
  return repository.findAllSpecies();
}

export async function findAllStatuses() {
  return repository.findAllStatuses();
}

export async function findAllVaccines() {
  const vaccines = await repository.findAllVaccines();

  return vaccines.map((v) => ({
    code: v.code,
    name: v.name,
    specie: v.specie.name,
  }));
}
