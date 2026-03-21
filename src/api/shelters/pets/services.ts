import { and, eq, inArray } from "drizzle-orm";
import type { z } from "zod";
import { ZodError } from "zod";
import type {
  detailedPetResponseSchema,
  petResponseSchema,
} from "#/api/pets/schemas.js";
import { db } from "#/db/index.js";
import type { Color } from "#/db/schema/colors.js";
import { events } from "#/db/schema/events.js";
import { colors, pet, petColors, petStatusHistory } from "#/db/schema/index.js";
import { vaccinations } from "#/db/schema/vaccinations.js";

export async function findShelterPetDetailed(shelterId: number, petId: number) {
  const result = await db.query.pet.findFirst({
    where: (pet, { and, eq, isNull }) =>
      and(
        isNull(pet.deletedAt),
        eq(pet.id, petId),
        eq(pet.shelterId, shelterId),
      ),
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
    db.query.petStatus.findFirst({
      where: (ps, { eq }) => eq(ps.status, body.status),
    }),
    db.query.species.findFirst({
      where: (s, { eq }) => eq(s.name, body.specie),
    }),
    db.query.shelter.findFirst({
      where: (s, { eq }) => eq(s.id, shelterId),
    }),
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
    matchingColors = await db.query.colors.findMany({
      where: inArray(colors.color, body.colors),
    });

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

  const registeredPet = await db.transaction(async (tx) => {
    const { status: _status, specie: _specie, colors: _colors, ...data } = body;
    const [newPet] = await tx
      .insert(pet)
      .values({
        ...data,
        statusId: statusRecord.id,
        specieId: specieRecord.id,
        shelterId: shelterId,
      })
      .returning();

    if (!newPet) {
      throw new Error("Failed to insert pet");
    }

    if (matchingColors.length > 0) {
      const petColorValues = matchingColors.map((c) => ({
        petId: newPet.id,
        colorId: c.id,
      }));
      await tx.insert(petColors).values(petColorValues);
    }

    await tx.insert(petStatusHistory).values({
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
  const existing = await db.query.pet.findFirst({
    where: (pet, { and, eq, isNull }) =>
      and(
        isNull(pet.deletedAt),
        eq(pet.id, petId),
        eq(pet.shelterId, shelterId),
      ),
    with: {
      specie: true,
      status: true,
      shelter: true,
      petColors: { with: { color: true } },
    },
  });

  if (!existing) return { error: "Pet not found" as const };

  const updateData: Partial<typeof pet.$inferInsert> = {};

  const statusValue = body.status;
  const specieValue = body.specie;

  const [statusRecord, specieRecord] = await Promise.all([
    statusValue
      ? db.query.petStatus.findFirst({
          where: (ps, { eq }) => eq(ps.status, statusValue),
        })
      : Promise.resolve(null),
    specieValue
      ? db.query.species.findFirst({
          where: (s, { eq }) => eq(s.name, specieValue),
        })
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
      matchingColors = await db.query.colors.findMany({
        where: inArray(colors.color, body.colors),
      });

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
    updateData.name = body.name;
  }
  if (body.birthDate !== undefined && body.birthDate !== existing.birthDate) {
    updateData.birthDate = body.birthDate;
  }
  if (body.breed !== undefined && body.breed !== existing.breed) {
    updateData.breed = body.breed;
  }
  if (body.sex !== undefined && body.sex !== existing.sex) {
    updateData.sex = body.sex;
  }
  if (body.size !== undefined && body.size !== existing.size) {
    updateData.size = body.size;
  }
  if (
    body.description !== undefined &&
    body.description !== existing.description
  ) {
    updateData.description = body.description;
  }

  const updatedPet = await db.transaction(async (tx) => {
    let petRow = existing;

    if (Object.keys(updateData).length > 0) {
      const [res] = await tx
        .update(pet)
        .set(updateData)
        .where(eq(pet.id, petId))
        .returning();
      if (res) {
        petRow = { ...petRow, ...res };
      }
    }

    if (updateData.statusId !== undefined) {
      await tx.insert(petStatusHistory).values({
        petId: petId,
        statusId: updateData.statusId,
      });
    }

    if (body.colors !== undefined) {
      await tx.delete(petColors).where(eq(petColors.petId, petId));
      if (matchingColors.length > 0) {
        await tx
          .insert(petColors)
          .values(matchingColors.map((c) => ({ petId, colorId: c.id })));
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
  const deletedPet = await db
    .delete(pet)
    .where(and(eq(pet.id, petId), eq(pet.shelterId, shelterId)))
    .returning({ id: pet.id });

  return deletedPet.length > 0;
}

export async function registerVaccination(
  shelterId: number,
  petId: number,
  vaccineCode: string,
  administeredAt?: Date,
) {
  const data = await db.query.pet.findFirst({
    where: (p, { and, eq }) => and(eq(p.id, petId), eq(p.shelterId, shelterId)),
    with: {
      specie: true,
    },
  });

  if (!data) return { error: "Pet not found" as const };

  const vaccine = await db.query.vaccines.findFirst({
    where: (v, { and, eq }) =>
      and(eq(v.code, vaccineCode), eq(v.specieId, data.specieId)),
  });

  if (!vaccine) {
    return {
      error:
        "Vaccine not found or not compatible with this pet species" as const,
    };
  }

  const [vaccination] = await db
    .insert(vaccinations)
    .values({
      petId,
      vaccineId: vaccine.id,
      administeredAt,
    })
    .returning();

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
  const petInShelter = await db.query.pet.findFirst({
    where: (p, { and, eq }) => and(eq(p.id, petId), eq(p.shelterId, shelterId)),
  });

  if (!petInShelter) return { error: "Pet not found in shelter" as const };

  const [newEvent] = await db
    .insert(events)
    .values({
      petId,
      name,
      description,
    })
    .returning();

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
  const petInShelter = await db.query.pet.findFirst({
    where: (p, { and, eq }) => and(eq(p.id, petId), eq(p.shelterId, shelterId)),
  });

  if (!petInShelter) return { error: "Pet not found in shelter" as const };

  const deletedEvent = await db
    .delete(events)
    .where(and(eq(events.id, eventId), eq(events.petId, petId)))
    .returning({ id: events.id });

  if (deletedEvent.length === 0) return { error: "Event not found" as const };

  return { data: true };
}
