import { sql } from "drizzle-orm";
import { db } from "@/db";

export async function findAllPublic() {
  return db.query.pet.findMany({
    where: (p, { and, eq, isNull }) =>
      and(isNull(p.deletedAt), eq(p.status, "in_shelter")),
    with: {
      shelter: true,
    },
  });
}

export async function findByIdPublic(id: number) {
  return db.query.pet.findFirst({
    where: (p, { and, eq, isNull }) => and(isNull(p.deletedAt), eq(p.id, id)),
    with: {
      shelter: true,
    },
  });
}

export async function findAllColors() {
  const result = await db.execute(
    sql`SELECT enumlabel AS color FROM pg_enum WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'color') ORDER BY enumsortorder`,
  );
  return result.rows as { color: string }[];
}

export async function findAllSpecies() {
  const result = await db.execute(
    sql`SELECT enumlabel AS specie FROM pg_enum WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'specie') ORDER BY enumsortorder`,
  );
  return result.rows as { specie: string }[];
}

export async function findAllStatuses() {
  const result = await db.execute(
    sql`SELECT enumlabel AS status FROM pg_enum WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'status') ORDER BY enumsortorder`,
  );
  return result.rows as { status: string }[];
}

export async function findAllVaccines() {
  return db.query.vaccines.findMany();
}
