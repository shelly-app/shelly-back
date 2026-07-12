import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import type {
  ColorValue,
  EventMetadata,
  SexValue,
  SizeValue,
  SpecieValue,
  StatusValue,
} from "@/db/schema";
import { events, pet, shelter, vaccinations, vaccines } from "@/db/schema";

export async function findAllByShelter(shelterId: number) {
  // Staff management list: every pet belonging to the shelter regardless of
  // status (unlike the public adoption list, which is filtered by status).
  return db.query.pet.findMany({
    where: (p, { and, eq, isNull }) =>
      and(isNull(p.deletedAt), eq(p.shelterId, shelterId)),
    with: {
      shelter: true,
      vaccinations: { with: { vaccine: true } },
      events: {
        orderBy: (e, { desc }) => [desc(e.createdAt)],
      },
    },
  });
}

export async function findById(petId: number, shelterId: number) {
  return db.query.pet.findFirst({
    where: (p, { and, eq, isNull }) =>
      and(isNull(p.deletedAt), eq(p.id, petId), eq(p.shelterId, shelterId)),
    with: {
      shelter: true,
      vaccinations: { with: { vaccine: true } },
      events: {
        orderBy: (e, { desc }) => [desc(e.createdAt)],
      },
    },
  });
}

export async function findShelterById(id: number) {
  return db.query.shelter.findFirst({
    where: eq(shelter.id, id),
  });
}

export async function findVaccineByCode(code: string) {
  return db.query.vaccines.findFirst({
    where: eq(vaccines.code, code),
  });
}

type CreatePetInput = {
  name: string;
  breed?: string | null;
  sex: SexValue;
  size?: SizeValue;
  colors?: ColorValue[] | null;
  status: StatusValue;
  specie: SpecieValue;
  description?: string | null;
  photoKey?: string | null;
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
  photoKey?: string | null;
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

export async function deleteVaccinationRecord(
  petId: number,
  vaccineId: number,
) {
  await db
    .delete(vaccinations)
    .where(
      and(eq(vaccinations.petId, petId), eq(vaccinations.vaccineId, vaccineId)),
    );
}

export async function createEventRecord(values: {
  petId: number;
  userId: number;
  type?:
    | "status_change"
    | "vaccination"
    | "user_event"
    | "name_change"
    | "size_change";
  name: string;
  description?: string;
  metadata?: EventMetadata;
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
