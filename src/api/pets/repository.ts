import { eq } from "drizzle-orm";
import { db } from "@/db";
import { petStatus } from "@/db/schema";

export async function findAllPublic() {
  const inShelterStatusIds = await db
    .select({ id: petStatus.id })
    .from(petStatus)
    .where(eq(petStatus.status, "in_shelter"));

  const statusIds = inShelterStatusIds.map((s) => s.id);

  return db.query.pet.findMany({
    where: (p, { and, inArray: pInArray, isNull: pIsNull }) =>
      and(pIsNull(p.deletedAt), pInArray(p.statusId, statusIds)),
    with: {
      specie: true,
      status: true,
      shelter: true,
      petColors: {
        with: {
          color: true,
        },
      },
    },
  });
}

export async function findByIdPublic(id: number) {
  const inShelterStatusIds = await db
    .select({ id: petStatus.id })
    .from(petStatus)
    .where(eq(petStatus.status, "in_shelter"));

  const statusIds = inShelterStatusIds.map((s) => s.id);

  return db.query.pet.findFirst({
    where: (p, { and, eq: pEq, inArray: pInArray, isNull: pIsNull }) =>
      and(pIsNull(p.deletedAt), pEq(p.id, id), pInArray(p.statusId, statusIds)),
    with: {
      specie: true,
      status: true,
      shelter: true,
      petColors: {
        with: {
          color: true,
        },
      },
    },
  });
}

export async function findAllColors() {
  return db.query.colors.findMany();
}

export async function findAllSpecies() {
  return db.query.species.findMany();
}

export async function findAllStatuses() {
  return db.query.petStatus.findMany();
}

export async function findAllVaccines() {
  return db.query.vaccines.findMany({
    with: {
      specie: true,
    },
  });
}
