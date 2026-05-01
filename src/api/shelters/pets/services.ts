import type { z } from "zod";
import { ZodError } from "zod";
import type {
  detailedPetResponseSchema,
  petResponseSchema,
} from "@/api/pets/schemas";
import * as repository from "@/api/shelters/pets/repository";
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

export async function findShelterPetDetailed(shelterId: number, petId: number) {
  const result = await repository.findById(petId, shelterId);

  if (!result) return null;

  const response: z.infer<typeof detailedPetResponseSchema> = {
    id: result.id,
    name: result.name,
    birthDate: result.birthDate,
    breed: result.breed,
    specie: result.specie as SpecieValue,
    sex: result.sex as SexValue,
    size: result.size as SizeValue,
    status: result.status as StatusValue,
    description: result.description,
    colors: (result.colors ?? []) as string[],
    shelter: { name: result.shelter.name, city: result.shelter.city },
    vaccinations: result.vaccinations.map((v) => ({
      vaccine: v.vaccine.name,
      administeredAt: v.administeredAt.toISOString(),
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
    sex: "male" | "female";
    size: "small" | "medium" | "large";
    status?: string;
    specie?: string;
    birthDate?: string;
    description?: string | null;
    colors?: string[];
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

  const newPet = await repository.createPet({
    name: body.name,
    breed: body.breed,
    sex: body.sex as SexValue,
    size: body.size as SizeValue,
    specie: body.specie as SpecieValue,
    colors: petColors,
    status: body.status as StatusValue,
    description: body.description,
    shelterId,
    birthDate: body.birthDate,
  });

  const response: z.infer<typeof petResponseSchema> = {
    id: newPet.id,
    name: newPet.name,
    birthDate: newPet.birthDate,
    breed: newPet.breed,
    sex: newPet.sex as SexValue,
    size: newPet.size as SizeValue,
    description: newPet.description,
    specie: newPet.specie as SpecieValue,
    status: newPet.status as StatusValue,
    colors: (newPet.colors ?? []) as string[],
    shelter: { name: shelterRecord.name, city: shelterRecord.city },
    createdAt: newPet.createdAt,
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
    colors?: ColorValue[];
    status?: StatusValue;
    specie?: SpecieValue;
    description?: string;
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

  const updatedPet = await db.transaction(async (_tx) => {
    let petRow = existing;

    if (Object.keys(updateData).length > 0) {
      const res = await repository.updatePet(petId, updateData);
      if (res) {
        petRow = { ...petRow, ...res };
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
    specie: updatedPet.specie as SpecieValue,
    status: updatedPet.status as StatusValue,
    colors: (updatedPet.colors ?? []) as string[],
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

  const vaccination = await repository.createVaccinationRecord({
    petId,
    vaccineId: 1,
    administeredAt,
  });

  if (!vaccination) {
    throw new Error("Failed to register vaccination");
  }

  return {
    data: {
      vaccineName: "TBD",
      vaccineCode: vaccineCode,
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
