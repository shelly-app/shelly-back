import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
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
} from "@/db/schema";

export async function findById(petId: number, shelterId: number) {
  return db.query.pet.findFirst({
    where: (p, { and, eq, isNull }) =>
      and(isNull(p.deletedAt), eq(p.id, petId), eq(p.shelterId, shelterId)),
    with: {
      specie: true,
      status: true,
      shelter: true,
      petColors: { with: { color: true } },
      vaccinations: { with: { vaccine: true } },
      statusHistory: { with: { status: true } },
      events: true,
    },
  });
}

export async function findStatusByName(status: string) {
  return db.query.petStatus.findFirst({
    where: eq(petStatus.status, status),
  });
}

export async function findSpecieByName(name: string) {
  return db.query.species.findFirst({
    where: eq(species.name, name),
  });
}

export async function findShelterById(id: number) {
  return db.query.shelter.findFirst({
    where: eq(shelter.id, id),
  });
}

export async function findColorsByNames(colorNames: string[]) {
  return db.query.colors.findMany({
    where: inArray(colors.color, colorNames),
  });
}

export async function createPet(values: {
  name: string;
  breed?: string | null;
  sex?: "male" | "female" | null;
  size?: "small" | "medium" | "large" | null;
  statusId: number;
  specieId: number;
  shelterId: number;
  birthDate?: string;
  description?: string | null;
}) {
  const [newPet] = await db.insert(pet).values(values).returning();
  if (!newPet) throw new Error("Failed to create pet");
  return newPet;
}

export async function createPetColors(
  values: { petId: number; colorId: number }[],
) {
  await db.insert(petColors).values(values);
}

export async function createStatusHistory(values: {
  petId: number;
  statusId: number;
}) {
  await db.insert(petStatusHistory).values(values);
}

export async function updatePet(
  petId: number,
  data: {
    name?: string;
    birthDate?: string | null;
    breed?: string | null;
    sex?: "male" | "female" | null;
    size?: "small" | "medium" | "large" | null;
    description?: string | null;
    statusId?: number;
    specieId?: number;
  },
) {
  const [updated] = await db
    .update(pet)
    .set(data)
    .where(eq(pet.id, petId))
    .returning();
  return updated;
}

export async function deletePetColors(petId: number) {
  await db.delete(petColors).where(eq(petColors.petId, petId));
}

export async function deletePetById(petId: number) {
  await db.delete(pet).where(eq(pet.id, petId));
}

export async function findVaccineByCodeAndSpecie(
  code: string,
  specieId: number,
) {
  return db.query.vaccines.findFirst({
    where: (v, { and, eq }) => and(eq(v.code, code), eq(v.specieId, specieId)),
  });
}

export async function createVaccinationRecord(values: {
  petId: number;
  vaccineId: number;
  administeredAt?: Date;
}) {
  const [result] = await db.insert(vaccinations).values(values).returning();
  if (!result) throw new Error("Failed to create vaccination");
  return result;
}

export async function createEventRecord(values: {
  petId: number;
  name: string;
  description?: string;
}) {
  const [result] = await db.insert(events).values(values).returning();
  if (!result) throw new Error("Failed to create event");
  return result;
}

export async function deleteEventRecord(eventId: number, petId: number) {
  await db
    .delete(events)
    .where(and(eq(events.id, eventId), eq(events.petId, petId)));
}
