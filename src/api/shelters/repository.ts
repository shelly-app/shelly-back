import { eq } from "drizzle-orm";
import { db } from "@/db";
import { shelter } from "@/db/schema";

export async function findAll() {
  return db.query.shelter.findMany();
}

export async function findById(id: number) {
  const shelters = await db.select().from(shelter).where(eq(shelter.id, id));
  return shelters[0] ?? null;
}

export async function findPets(shelterId: number) {
  return db.query.pet.findMany({
    // Adopter-facing list: only pets still open for adoption ("in_shelter" or
    // "in_foster"); "adopted" (already placed) and "deceased" are excluded.
    where: (p, { and, eq, isNull, inArray }) =>
      and(
        isNull(p.deletedAt),
        eq(p.shelterId, shelterId),
        inArray(p.status, ["in_shelter", "in_foster"]),
      ),
    with: {
      shelter: true,
      vaccinations: { with: { vaccine: true } },
      events: true,
    },
  });
}
