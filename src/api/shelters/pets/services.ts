import type { z } from "zod";
import { ZodError } from "zod";
import type {
  detailedPetResponseSchema,
  petResponseSchema,
} from "@/api/pets/schemas";
import * as repository from "@/api/shelters/pets/repository";
import { buildPublicUrl, deleteObject } from "@/api/storage/s3";
import { toDateOnly } from "@/api/utils";
import { db } from "@/db";
import {
  type ColorValue,
  colorEnum,
  type SexValue,
  type SizeValue,
  type SpecieValue,
  type StatusValue,
  specieEnum,
  statusEnum,
} from "@/db/schema";

const validColors = colorEnum.enumValues as readonly ColorValue[];
const validSpecies = specieEnum.enumValues as readonly SpecieValue[];
const validStatuses = statusEnum.enumValues as readonly StatusValue[];

/**
 * Resolves vaccine codes to their database ids, throwing a validation error
 * when any code is unknown. Returns a map of code -> vaccineId.
 */
async function resolveVaccineIds(
  codes: string[],
): Promise<Map<string, number>> {
  const unique = [...new Set(codes)];
  const resolved = await Promise.all(
    unique.map((code) => repository.findVaccineByCode(code)),
  );

  const ids = new Map<string, number>();
  const invalid: string[] = [];

  unique.forEach((code, i) => {
    const vaccine = resolved[i];
    if (vaccine) {
      ids.set(code, vaccine.id);
    } else {
      invalid.push(code);
    }
  });

  if (invalid.length > 0) {
    throw new ZodError([
      {
        code: "custom",
        path: ["vaccines"],
        message: `Invalid vaccine codes: ${invalid.join(", ")}`,
      },
    ]);
  }

  return ids;
}

export async function findShelterManagedPets(shelterId: number) {
  const pets = await repository.findAllByShelter(shelterId);

  return pets.map(
    (p): z.infer<typeof detailedPetResponseSchema> => ({
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
      photoUrl: buildPublicUrl(p.photoKey),
      shelter: { name: p.shelter.name, city: p.shelter.city },
      vaccinations: p.vaccinations.map((v) => ({
        vaccine: v.vaccine.name,
        vaccineCode: v.vaccine.code,
        administeredAt: v.administeredAt.toISOString(),
      })),
      events: p.events.map((e) => ({
        id: e.id,
        type: e.type,
        name: e.name,
        description: e.description,
        metadata: e.metadata ?? null,
        scheduledFor: e.scheduledFor ? e.scheduledFor.toISOString() : null,
        createdAt: e.createdAt.toISOString(),
      })),
    }),
  );
}

export async function findShelterPetDetailed(shelterId: number, petId: number) {
  const result = await repository.findById(petId, shelterId);

  if (!result) return null;

  const response: z.infer<typeof detailedPetResponseSchema> = {
    id: result.id,
    name: result.name,
    birthDate: toDateOnly(result.birthDate),
    breed: result.breed,
    specie: result.specie as SpecieValue,
    sex: result.sex as SexValue,
    size: result.size as SizeValue | null,
    status: result.status as StatusValue,
    description: result.description,
    colors: (result.colors ?? []) as string[],
    photoUrl: buildPublicUrl(result.photoKey),
    shelter: { name: result.shelter.name, city: result.shelter.city },
    vaccinations: result.vaccinations.map((v) => ({
      vaccine: v.vaccine.name,
      vaccineCode: v.vaccine.code,
      administeredAt: v.administeredAt.toISOString(),
    })),
    events: result.events.map((e) => ({
      id: e.id,
      type: e.type,
      name: e.name,
      description: e.description,
      metadata: e.metadata ?? null,
      scheduledFor: e.scheduledFor ? e.scheduledFor.toISOString() : null,
      createdAt: e.createdAt.toISOString(),
    })),
  };

  return response;
}

export async function registerPet(
  shelterId: number,
  body: {
    name: string;
    breed?: string | null;
    sex: "male" | "female";
    size?: "small" | "medium" | "large";
    status?: string;
    specie?: string;
    birthDate?: string;
    description?: string | null;
    colors?: string[];
    photoKey?: string | null;
    vaccines?: string[];
  },
) {
  const shelterRecord = await repository.findShelterById(shelterId);

  if (!shelterRecord) {
    return { error: "Shelter not found" as const };
  }

  if (!body.specie || !validSpecies.includes(body.specie as SpecieValue)) {
    throw new ZodError([
      {
        code: "custom",
        path: ["specie"],
        message: `Invalid specie. Must be one of: ${validSpecies.join(", ")}`,
      },
    ]);
  }

  if (!body.status || !validStatuses.includes(body.status as StatusValue)) {
    throw new ZodError([
      {
        code: "custom",
        path: ["status"],
        message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
      },
    ]);
  }

  let petColors: ColorValue[] = [];
  if (body.colors && body.colors.length > 0) {
    const invalidColors = body.colors.filter(
      (c) => !validColors.includes(c as ColorValue),
    );
    if (invalidColors.length > 0) {
      throw new ZodError([
        {
          code: "custom",
          path: ["colors"],
          message: `Invalid colors provided: ${invalidColors.join(", ")}`,
        },
      ]);
    }
    petColors = body.colors as ColorValue[];
  }

  // Resolve vaccine codes up-front so an invalid code fails before the pet is
  // created (the repository helpers share the global connection, so this is not
  // a true transaction).
  const vaccineIds =
    body.vaccines && body.vaccines.length > 0
      ? [...(await resolveVaccineIds(body.vaccines)).values()]
      : [];

  const newPet = await repository.createPet({
    name: body.name,
    breed: body.breed,
    sex: body.sex as SexValue,
    size: body.size as SizeValue | undefined,
    specie: body.specie as SpecieValue,
    colors: petColors,
    status: body.status as StatusValue,
    description: body.description,
    photoKey: body.photoKey ?? null,
    shelterId,
    birthDate: body.birthDate,
  });

  for (const vaccineId of vaccineIds) {
    await repository.createVaccinationRecord({ petId: newPet.id, vaccineId });
  }

  const response: z.infer<typeof petResponseSchema> = {
    id: newPet.id,
    name: newPet.name,
    birthDate: toDateOnly(newPet.birthDate),
    breed: newPet.breed,
    sex: newPet.sex as SexValue,
    size: newPet.size as SizeValue | null,
    description: newPet.description,
    specie: newPet.specie as SpecieValue,
    status: newPet.status as StatusValue,
    colors: (newPet.colors ?? []) as string[],
    photoUrl: buildPublicUrl(newPet.photoKey),
    shelter: { name: shelterRecord.name, city: shelterRecord.city },
    createdAt: newPet.createdAt,
  };

  return { data: response };
}

export async function updatePet(
  shelterId: number,
  petId: number,
  userId: number,
  body: {
    name?: string;
    birthDate?: string | null;
    breed?: string | null;
    sex?: "male" | "female" | null;
    size?: "small" | "medium" | "large" | null;
    description?: string | null;
    status?: string;
    specie?: string;
    colors?: string[];
    photoKey?: string | null;
    vaccines?: string[];
  },
) {
  const existing = await repository.findById(petId, shelterId);

  if (!existing) return { error: "Pet not found" as const };

  const updateData: {
    name?: string;
    birthDate?: string;
    breed?: string;
    sex?: "male" | "female";
    size?: "small" | "medium" | "large";
    colors?: ColorValue[];
    status?: StatusValue;
    specie?: SpecieValue;
    description?: string;
    photoKey?: string | null;
  } = {};

  if (body.status !== undefined) {
    if (!validStatuses.includes(body.status as StatusValue)) {
      throw new ZodError([
        {
          code: "custom",
          path: ["status"],
          message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
        },
      ]);
    }
    updateData.status = body.status as StatusValue;
  }

  if (body.specie !== undefined) {
    if (!validSpecies.includes(body.specie as SpecieValue)) {
      throw new ZodError([
        {
          code: "custom",
          path: ["specie"],
          message: `Invalid specie. Must be one of: ${validSpecies.join(", ")}`,
        },
      ]);
    }
    updateData.specie = body.specie as SpecieValue;
  }

  let newColors: ColorValue[] = [];
  if (body.colors !== undefined) {
    if (body.colors.length > 0) {
      const invalidColors = body.colors.filter(
        (c) => !validColors.includes(c as ColorValue),
      );
      if (invalidColors.length > 0) {
        throw new ZodError([
          {
            code: "custom",
            path: ["colors"],
            message: `Invalid colors provided: ${invalidColors.join(", ")}`,
          },
        ]);
      }
    }
    newColors = body.colors as ColorValue[];
    updateData.colors = newColors;
  }

  if (body.name !== undefined && body.name !== existing.name) {
    updateData.name = body.name ?? undefined;
  }
  if (body.birthDate !== undefined && body.birthDate !== existing.birthDate) {
    updateData.birthDate = body.birthDate ?? undefined;
  }
  if (body.breed !== undefined && body.breed !== existing.breed) {
    updateData.breed = body.breed ?? undefined;
  }
  if (body.sex !== undefined && body.sex !== existing.sex) {
    updateData.sex = body.sex ?? undefined;
  }
  if (body.size !== undefined && body.size !== existing.size) {
    updateData.size = body.size ?? undefined;
  }
  if (
    body.description !== undefined &&
    body.description !== existing.description
  ) {
    updateData.description = body.description ?? undefined;
  }

  // Normalize the incoming photo key (empty string clears it) and only touch it
  // when it actually changes, so we know whether to delete the replaced image.
  const previousPhotoKey = existing.photoKey ?? null;
  if (body.photoKey !== undefined) {
    const nextPhotoKey =
      body.photoKey && body.photoKey.length > 0 ? body.photoKey : null;
    if (nextPhotoKey !== previousPhotoKey) {
      updateData.photoKey = nextPhotoKey;
    }
  }

  // Resolve desired vaccines before mutating so invalid codes fail early.
  const desiredVaccineIds =
    body.vaccines !== undefined
      ? [...(await resolveVaccineIds(body.vaccines)).values()]
      : undefined;

  const updatedPet = await db.transaction(async (_tx) => {
    let petRow = existing;

    if (desiredVaccineIds !== undefined) {
      const existingVaccineIds = existing.vaccinations.map((v) => v.vaccineId);
      const toAdd = desiredVaccineIds.filter(
        (id) => !existingVaccineIds.includes(id),
      );
      const toRemove = existingVaccineIds.filter(
        (id) => !desiredVaccineIds.includes(id),
      );

      for (const vaccineId of toAdd) {
        await repository.createVaccinationRecord({ petId, vaccineId });
      }
      for (const vaccineId of toRemove) {
        await repository.deleteVaccinationRecord(petId, vaccineId);
      }
    }

    if (Object.keys(updateData).length > 0) {
      const res = await repository.updatePet(petId, updateData);
      if (res) {
        petRow = { ...petRow, ...res };
      }

      if (body.status !== undefined && body.status !== existing.status) {
        await repository.createEventRecord({
          petId,
          userId,
          type: "status_change",
          name: "Status change",
          metadata: { from: existing.status, to: body.status },
        });
      }
      if (body.name !== undefined && body.name !== existing.name) {
        await repository.createEventRecord({
          petId,
          userId,
          type: "name_change",
          name: "Name change",
          metadata: { from: existing.name, to: body.name },
        });
      }
      if (body.size !== undefined && body.size !== existing.size) {
        await repository.createEventRecord({
          petId,
          userId,
          type: "size_change",
          name: "Size change",
          metadata: { from: existing.size, to: body.size },
        });
      }
    }

    return petRow;
  });

  // Remove the replaced image only after the new key is safely persisted.
  if (updateData.photoKey !== undefined && previousPhotoKey) {
    await deleteObject(previousPhotoKey);
  }

  const response: z.infer<typeof petResponseSchema> = {
    id: updatedPet.id,
    name: updatedPet.name,
    birthDate: toDateOnly(updatedPet.birthDate),
    breed: updatedPet.breed,
    sex: updatedPet.sex,
    size: updatedPet.size as SizeValue | null,
    description: updatedPet.description,
    specie: updatedPet.specie as SpecieValue,
    status: updatedPet.status as StatusValue,
    colors: (updatedPet.colors ?? []) as string[],
    photoUrl: buildPublicUrl(updatedPet.photoKey),
    shelter: { name: existing.shelter.name, city: existing.shelter.city },
    updatedAt: updatedPet.updatedAt ?? existing.updatedAt,
  };

  return { data: response };
}

export async function deletePet(shelterId: number, petId: number) {
  const existing = await repository.findById(petId, shelterId);

  if (!existing) return false;

  await repository.deletePetById(petId);

  return true;
}

export async function registerVaccination(
  shelterId: number,
  petId: number,
  userId: number,
  vaccineCode: string,
  administeredAt?: Date,
) {
  const data = await repository.findById(petId, shelterId);

  if (!data) return { error: "Pet not found" as const };

  const vaccine = await repository.findVaccineByCode(vaccineCode);

  if (!vaccine) {
    return { error: "Vaccine not found" as const };
  }

  const vaccination = await repository.createVaccinationRecord({
    petId,
    vaccineId: vaccine.id,
    administeredAt,
  });

  if (!vaccination) {
    throw new Error("Failed to register vaccination");
  }

  await repository.createEventRecord({
    petId,
    userId,
    type: "vaccination",
    name: "Vaccination",
    description: `Vaccination: ${vaccine.name} (${vaccine.code})`,
  });

  return {
    data: {
      vaccineName: vaccine.name,
      vaccineCode: vaccine.code,
      administeredAt: vaccination.administeredAt.toISOString(),
    },
  };
}

export async function registerEvent(
  shelterId: number,
  petId: number,
  userId: number,
  name: string,
  description?: string,
  scheduledFor?: Date,
) {
  const petInShelter = await repository.findById(petId, shelterId);

  if (!petInShelter) return { error: "Pet not found in shelter" as const };

  const newEvent = await repository.createEventRecord({
    petId,
    userId,
    type: "user_event",
    name,
    description,
    scheduledFor,
  });

  if (!newEvent) {
    throw new Error("Failed to register event");
  }

  return {
    data: {
      id: newEvent.id,
      name: newEvent.name,
      description: newEvent.description,
      scheduledFor: newEvent.scheduledFor
        ? newEvent.scheduledFor.toISOString()
        : null,
      createdAt: newEvent.createdAt.toISOString(),
    },
  };
}

export async function deleteEvent(
  shelterId: number,
  petId: number,
  eventId: number,
) {
  const petInShelter = await repository.findById(petId, shelterId);

  if (!petInShelter) return { error: "Pet not found in shelter" as const };

  await repository.deleteEventRecord(eventId, petId);

  return { data: true };
}
