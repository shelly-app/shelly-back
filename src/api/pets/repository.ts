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
    sql`SELECT enum_label as color FROM pg_enum WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'color')`,
  );
  return result as unknown as { color: string }[];
}

export async function findAllSpecies() {
  const result = await db.execute(
    sql`SELECT enum_label as specie FROM pg_enum WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'specie')`,
  );
  return result as unknown as { specie: string }[];
}

export async function findAllStatuses() {
  const result = await db.execute(
    sql`SELECT enum_label as status FROM pg_enum WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'status')`,
  );
  return result as unknown as { status: string }[];
}

export async function findAllVaccines() {
  return db.query.vaccines.findMany();
}
