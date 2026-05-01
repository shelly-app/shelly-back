import { eq } from "drizzle-orm";
import { db } from "@/db";
import { shelter } from "@/db/schema";

export async function findAll() {
  return db.query.shelter.findMany({
    columns: {
      id: false,
    },
  });
}

export async function findById(id: number) {
  const shelters = await db.select().from(shelter).where(eq(shelter.id, id));
  return shelters[0] ?? null;
}

export async function findPets(shelterId: number) {
  return db.query.pet.findMany({
    where: (pet, { and, eq, isNull: petIsNull }) =>
      and(petIsNull(pet.deletedAt), eq(pet.shelterId, shelterId)),
    with: {
      specie: true,
      status: true,
      shelter: true,
      petColors: {
        with: {
          color: true,
        },
      },
      vaccinations: {
        with: {
          vaccine: true,
        },
      },
      statusHistory: {
        with: {
          status: true,
        },
      },
      events: true,
    },
  });
}
