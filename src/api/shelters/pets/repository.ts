import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import type {
  ColorValue,
  SexValue,
  SizeValue,
  SpecieValue,
  StatusValue,
} from "@/db/schema";
import { events, pet, shelter, vaccinations } from "@/db/schema";

export async function findById(petId: number, shelterId: number) {
  return db.query.pet.findFirst({
    where: (p, { and, eq, isNull }) =>
      and(isNull(p.deletedAt), eq(p.id, petId), eq(p.shelterId, shelterId)),
    with: {
      shelter: true,
      vaccinations: { with: { vaccine: true } },
      events: true,
    },
  });
}

export async function findShelterById(id: number) {
  return db.query.shelter.findFirst({
    where: eq(shelter.id, id),
  });
}

type CreatePetInput = {
  name: string;
  breed?: string | null;
  sex: SexValue;
  size: SizeValue;
  colors?: ColorValue[] | null;
  status: StatusValue;
  specie: SpecieValue;
  description?: string | null;
  shelterId: number;
  birthDate?: string;
};

type UpdatePetInput = {
  name?: string;
  birthDate?: string | null;
  breed?: string | null;
  sex?: SexValue;
  size?: SizeValue;
  colors?: ColorValue[] | null;
  status?: StatusValue;
  specie?: SpecieValue;
  description?: string | null;
};

export async function createPet(values: CreatePetInput) {
  const [newPet] = await db.insert(pet).values(values).returning();
  if (!newPet) throw new Error("Failed to create pet");
  return newPet;
}

export async function updatePet(petId: number, data: UpdatePetInput) {
  const [updated] = await db
    .update(pet)
    .set(data)
    .where(eq(pet.id, petId))
    .returning();
  return updated;
}

export async function deletePetById(petId: number) {
  await db.delete(pet).where(eq(pet.id, petId));
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
