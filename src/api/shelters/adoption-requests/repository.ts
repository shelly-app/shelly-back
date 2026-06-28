import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { type AdoptionRequestStatusValue, adoptionRequests } from "@/db/schema";

export async function findByShelterId(
  shelterId: number,
  status?: AdoptionRequestStatusValue,
) {
  return db.query.adoptionRequests.findMany({
    where: (r, { and, eq, isNull }) =>
      and(
        isNull(r.deletedAt),
        eq(r.shelterId, shelterId),
        status ? eq(r.status, status) : undefined,
      ),
    orderBy: [desc(adoptionRequests.createdAt)],
    with: {
      pet: true,
    },
  });
}

export async function findById(requestId: number, shelterId: number) {
  return db.query.adoptionRequests.findFirst({
    where: (r, { and, eq, isNull }) =>
      and(isNull(r.deletedAt), eq(r.id, requestId), eq(r.shelterId, shelterId)),
    with: {
      pet: true,
    },
  });
}

export async function findPetInShelter(petId: number, shelterId: number) {
  return db.query.pet.findFirst({
    where: (p, { and, eq, isNull }) =>
      and(isNull(p.deletedAt), eq(p.id, petId), eq(p.shelterId, shelterId)),
  });
}

type CreateInput = {
  petId: number;
  shelterId: number;
  requesterName: string;
  requesterEmail: string;
  requesterPhone?: string | null;
  message?: string | null;
  location?: string | null;
  familyComposition?: string | null;
  hasYard?: boolean | null;
};

export async function create(values: CreateInput) {
  const [created] = await db
    .insert(adoptionRequests)
    .values(values)
    .returning();
  if (!created) throw new Error("Failed to create adoption request");
  return created;
}

type UpdateStatusInput = {
  status: AdoptionRequestStatusValue;
  rejectionReason?: string | null;
  approvedAt?: string | null;
  rejectedAt?: string | null;
  updatedAt: string;
};

export async function updateStatus(requestId: number, data: UpdateStatusInput) {
  const [updated] = await db
    .update(adoptionRequests)
    .set(data)
    .where(eq(adoptionRequests.id, requestId))
    .returning();
  return updated;
}
