import type { z } from "zod";
import { ZodError } from "zod";
import type {
  detailedPetResponseSchema,
  petResponseSchema,
} from "@/api/pets/schemas";
import * as repository from "@/api/shelters/pets/repository";
import { db } from "@/db";
import type { Color } from "@/db/schema/colors";

export async function findShelterPetDetailed(shelterId: number, petId: number) {
  const result = await repository.findById(petId, shelterId);

  if (!result) return null;

  const response: z.infer<typeof detailedPetResponseSchema> = {
    id: result.id,
    name: result.name,
    birthDate: result.birthDate,
    breed: result.breed,
    specie: result.specie.name,
    sex: result.sex,
    size: result.size,
    status: result.status.status,
    description: result.description,
    colors: result.petColors.map((pc) => pc.color.color),
    shelter: { name: result.shelter.name, city: result.shelter.city },
    vaccinations: result.vaccinations.map((v) => ({
      vaccine: v.vaccine.name,
      administeredAt: v.administeredAt.toISOString(),
    })),
    statusHistory: result.statusHistory.map((h) => ({
      status: h.status.status,
      changedAt: h.changedAt.toISOString(),
    })),
    events: result.events.map((e) => ({
      id: e.id,
      name: e.name,
      description: e.description,
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
    sex?: "male" | "female" | null;
    size?: "small" | "medium" | "large" | null;
    status: string;
    specie: string;
    birthDate?: string;
    description?: string | null;
    colors?: string[];
  },
) {
  const [statusRecord, specieRecord, shelterRecord] = await Promise.all([
    repository.findStatusByName(body.status),
    repository.findSpecieByName(body.specie),
    repository.findShelterById(shelterId),
  ]);

  if (!statusRecord) {
    throw new ZodError([
      {
        code: "custom",
        path: ["status"],
        message: `Invalid status provided: ${body.status}`,
      },
    ]);
  }

  if (!specieRecord) {
    throw new ZodError([
      {
        code: "custom",
        path: ["specie"],
        message: `Invalid specie provided: ${body.specie}`,
      },
    ]);
  }

  if (!shelterRecord) {
    return { error: "Shelter not found" as const };
  }

  let matchingColors: Color[] = [];
  if (body.colors && body.colors.length > 0) {
    matchingColors = await repository.findColorsByNames(body.colors);

    if (matchingColors.length !== body.colors.length) {
      const invalidColors = body.colors.filter(
        (c) => !matchingColors.some((mc) => mc.color === c),
      );
      throw new ZodError([
        {
          code: "custom",
          path: ["colors"],
          message: `Invalid colors provided: ${invalidColors.join(", ")}`,
        },
      ]);
    }
  }

  const registeredPet = await db.transaction(async (_tx) => {
    const { status: _status, specie: _specie, colors: _colors, ...data } = body;
    const newPet = await repository.createPet({
      ...data,
      statusId: statusRecord.id,
      specieId: specieRecord.id,
      shelterId: shelterId,
    });

    if (matchingColors.length > 0) {
      const petColorValues = matchingColors.map((c) => ({
        petId: newPet.id,
        colorId: c.id,
      }));
      await repository.createPetColors(petColorValues);
    }

    await repository.createStatusHistory({
      petId: newPet.id,
      statusId: statusRecord.id,
    });

    return newPet;
  });

  const response: z.infer<typeof petResponseSchema> = {
    id: registeredPet.id,
    name: registeredPet.name,
    birthDate: registeredPet.birthDate,
    breed: registeredPet.breed,
    sex: registeredPet.sex,
    size: registeredPet.size,
    description: registeredPet.description,
    specie: specieRecord.name,
    status: statusRecord.status,
    colors: matchingColors.map((c) => c.color),
    shelter: { name: shelterRecord.name, city: shelterRecord.city },
    createdAt: registeredPet.createdAt,
  };

  return { data: response };
}

export async function updatePet(
  shelterId: number,
  petId: number,
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
    description?: string;
    statusId?: number;
    specieId?: number;
  } = {};

  const statusValue = body.status;
  const specieValue = body.specie;

  const [statusRecord, specieRecord] = await Promise.all([
    statusValue
      ? repository.findStatusByName(statusValue)
      : Promise.resolve(null),
    specieValue
      ? repository.findSpecieByName(specieValue)
      : Promise.resolve(null),
  ]);

  if (body.status !== undefined) {
    if (!statusRecord) {
      throw new ZodError([
        {
          code: "custom",
          path: ["status"],
          message: `Invalid status provided: ${body.status}`,
        },
      ]);
    }
    if (statusRecord.id !== existing.statusId) {
      updateData.statusId = statusRecord.id;
    }
  }

  if (body.specie !== undefined) {
    if (!specieRecord) {
      throw new ZodError([
        {
          code: "custom",
          path: ["specie"],
          message: `Invalid specie provided: ${body.specie}`,
        },
      ]);
    }
    if (specieRecord.id !== existing.specieId) {
      updateData.specieId = specieRecord.id;
    }
  }

  let matchingColors: Color[] = [];
  if (body.colors !== undefined) {
    if (body.colors.length > 0) {
      matchingColors = await repository.findColorsByNames(body.colors);

      if (matchingColors.length !== body.colors.length) {
        const invalidColors = body.colors.filter(
          (c) => !matchingColors.some((mc) => mc.color === c),
        );
        throw new ZodError([
          {
            code: "custom",
            path: ["colors"],
            message: `Invalid colors provided: ${invalidColors.join(", ")}`,
          },
        ]);
      }
    }
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

  const updatedPet = await db.transaction(async (_tx) => {
    let petRow = existing;

    if (Object.keys(updateData).length > 0) {
      const res = await repository.updatePet(petId, updateData);
      if (res) {
        petRow = { ...petRow, ...res };
      }
    }

    if (updateData.statusId !== undefined) {
      await repository.createStatusHistory({
        petId: petId,
        statusId: updateData.statusId,
      });
    }

    if (body.colors !== undefined) {
      await repository.deletePetColors(petId);
      if (matchingColors.length > 0) {
        await repository.createPetColors(
          matchingColors.map((c) => ({ petId, colorId: c.id })),
        );
      }
    }

    return petRow;
  });

  const response: z.infer<typeof petResponseSchema> = {
    id: updatedPet.id,
    name: updatedPet.name,
    birthDate: updatedPet.birthDate,
    breed: updatedPet.breed,
    sex: updatedPet.sex,
    size: updatedPet.size,
    description: updatedPet.description,
    specie: specieRecord?.name ?? existing.specie.name,
    status: statusRecord?.status ?? existing.status.status,
    colors:
      body.colors !== undefined
        ? matchingColors.map((c) => c.color)
        : existing.petColors.map((pc) => pc.color.color),
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
  vaccineCode: string,
  administeredAt?: Date,
) {
  const data = await repository.findById(petId, shelterId);

  if (!data) return { error: "Pet not found" as const };

  const vaccine = await repository.findVaccineByCodeAndSpecie(
    vaccineCode,
    data.specieId,
  );

  if (!vaccine) {
    return {
      error:
        "Vaccine not found or not compatible with this pet species" as const,
    };
  }

  const vaccination = await repository.createVaccinationRecord({
    petId,
    vaccineId: vaccine.id,
    administeredAt,
  });

  if (!vaccination) {
    throw new Error("Failed to register vaccination");
  }

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
  name: string,
  description?: string,
) {
  const petInShelter = await repository.findById(petId, shelterId);

  if (!petInShelter) return { error: "Pet not found in shelter" as const };

  const newEvent = await repository.createEventRecord({
    petId,
    name,
    description,
  });

  if (!newEvent) {
    throw new Error("Failed to register event");
  }

  return {
    data: {
      id: newEvent.id,
      name: newEvent.name,
      description: newEvent.description,
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
