import type { z } from "zod";
import * as repository from "@/api/pets/repository";
import type { petResponseSchema } from "@/api/pets/schemas";
import { toDateOnly } from "@/api/utils";
import type {
  SexValue,
  SizeValue,
  SpecieValue,
  StatusValue,
} from "@/db/schema";

export async function findAllPublicPets() {
  const pets = await repository.findAllPublic();

  return pets.map(
    (p): z.infer<typeof petResponseSchema> => ({
      id: p.id,
      name: p.name,
      birthDate: toDateOnly(p.birthDate),
      breed: p.breed,
      specie: p.specie as SpecieValue,
      sex: p.sex as SexValue,
      size: p.size as SizeValue | null,
      status: p.status as StatusValue,
      description: p.description,
      colors: (p.colors ?? []) as string[],
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
    birthDate: toDateOnly(pet.birthDate),
    breed: pet.breed,
    specie: pet.specie as SpecieValue,
    sex: pet.sex as SexValue,
    size: pet.size as SizeValue | null,
    status: pet.status as StatusValue,
    description: pet.description,
    colors: (pet.colors ?? []) as string[],
    shelter: { name: pet.shelter.name, city: pet.shelter.city },
  };

  return response;
}

export async function findAllColors() {
  const result = await repository.findAllColors();
  return result.map((c: { color: string }) => c.color);
}

export async function findAllSpecies() {
  const result = await repository.findAllSpecies();
  return result.map((s: { specie: string }) => s.specie);
}

export async function findAllStatuses() {
  const result = await repository.findAllStatuses();
  return result.map((s: { status: string }) => s.status);
}

export async function findAllVaccines() {
  const vaccines = await repository.findAllVaccines();

  return vaccines.map((v) => ({
    code: v.code,
    name: v.name,
    specie: v.specie,
  }));
}
