import type { z } from "zod";
import * as repository from "@/api/shelters/adoption-requests/repository";
import type { adoptionRequestResponseSchema } from "@/api/shelters/adoption-requests/schemas";
import type { AdoptionRequest } from "@/db/schema";

type AdoptionRequestWithPet = AdoptionRequest & {
  pet: { id: number; name: string } | null;
};

type AdoptionRequestResponse = z.infer<typeof adoptionRequestResponseSchema>;

function toResponse(row: AdoptionRequestWithPet): AdoptionRequestResponse {
  return {
    id: row.id,
    petId: row.petId,
    petName: row.pet?.name ?? "",
    requesterName: row.requesterName,
    requesterEmail: row.requesterEmail,
    requesterPhone: row.requesterPhone,
    status: row.status,
    message: row.message,
    rejectionReason: row.rejectionReason,
    approvedAt: row.approvedAt,
    rejectedAt: row.rejectedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    questionnaire: {
      location: row.location ?? "",
      familyComposition: row.familyComposition ?? "",
      hasYard: row.hasYard ?? false,
    },
  };
}

export async function listShelterAdoptionRequests(
  shelterId: number,
  status?: "pending" | "approved" | "rejected",
) {
  const rows = await repository.findByShelterId(shelterId, status);
  return rows.map(toResponse);
}

export async function createAdoptionRequest(
  shelterId: number,
  petId: number,
  body: {
    requesterName: string;
    requesterEmail: string;
    requesterPhone?: string;
    message?: string;
    location: string;
    familyComposition?: string;
    hasYard?: boolean;
  },
) {
  const petInShelter = await repository.findPetInShelter(petId, shelterId);

  if (!petInShelter) {
    return { error: "Pet not found in shelter" as const, status: 404 as const };
  }

  const created = await repository.create({
    petId,
    shelterId,
    requesterName: body.requesterName,
    requesterEmail: body.requesterEmail,
    requesterPhone: body.requesterPhone ?? null,
    message: body.message ?? null,
    location: body.location,
    familyComposition: body.familyComposition ?? null,
    hasYard: body.hasYard ?? null,
  });

  return {
    data: toResponse({ ...created, pet: petInShelter }),
  };
}

export async function updateAdoptionRequestStatus(
  shelterId: number,
  requestId: number,
  status: "approved" | "rejected",
  rejectionReason?: string,
) {
  const existing = await repository.findById(requestId, shelterId);

  if (!existing) {
    return {
      error: "Adoption request not found" as const,
      status: 404 as const,
    };
  }

  const now = new Date().toISOString();

  const updated = await repository.updateStatus(requestId, {
    status,
    rejectionReason: status === "rejected" ? (rejectionReason ?? null) : null,
    approvedAt: status === "approved" ? now : null,
    rejectedAt: status === "rejected" ? now : null,
    updatedAt: now,
  });

  if (!updated) {
    return {
      error: "Adoption request not found" as const,
      status: 404 as const,
    };
  }

  return {
    data: toResponse({ ...updated, pet: existing.pet }),
  };
}
