import type { z } from "zod";
import * as repository from "@/api/shelters/adoption-requests/repository";
import type { adoptionRequestResponseSchema } from "@/api/shelters/adoption-requests/schemas";
import { db } from "@/db";
import type { AdoptionRequest } from "@/db/schema";

// Stored verbatim as the rejection reason of requests auto-rejected when a pet
// is adopted. It's an i18n key (not prose) so the frontend renders it in the
// viewer's language; see `app.requests.rejection_reasons` in the locale files.
const PET_ADOPTED_REJECTION_REASON =
  "app.requests.rejection_reasons.pet_adopted";

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

  if (status === "rejected") {
    const updated = await repository.updateStatus(requestId, {
      status: "rejected",
      rejectionReason: rejectionReason ?? null,
      approvedAt: null,
      rejectedAt: now,
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

  // Approving an adoption is a three-part change that must be atomic: mark this
  // request approved, flip the pet to "adopted", and auto-reject every other
  // pending request for the same pet (that pet is no longer available).
  const updated = await db.transaction(async (tx) => {
    const approved = await repository.updateStatus(
      requestId,
      {
        status: "approved",
        rejectionReason: null,
        approvedAt: now,
        rejectedAt: null,
        updatedAt: now,
      },
      tx,
    );

    await repository.updatePetStatus(existing.petId, "adopted", tx);

    await repository.rejectOtherPendingForPet(
      existing.petId,
      requestId,
      {
        rejectionReason: PET_ADOPTED_REJECTION_REASON,
        rejectedAt: now,
        updatedAt: now,
      },
      tx,
    );

    return approved;
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
