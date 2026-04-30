import { getTableName, sql, type Table } from "drizzle-orm";
import { connection, db } from "@/db";
import * as schema from "@/db/schema";
import * as seeds from "@/db/seeds";
import { dbSeeding } from "@/env";

if (!dbSeeding) {
  throw new Error('You must set DB_SEEDING to "true" when running seeds');
}

async function resetTable(db: db, table: Table) {
  return db.execute(
    sql.raw(`TRUNCATE TABLE ${getTableName(table)} RESTART IDENTITY CASCADE`),
  );
}

async function runSeeds() {
  for (const table of [
    schema.shelterMembers,
    schema.events,
    schema.petStatusHistory,
    schema.vaccinations,
    schema.petColors,
    schema.pet,
    schema.vaccines,
    schema.petStatus,
    schema.colors,
    schema.species,
    schema.shelter,
    schema.roles,
    schema.permissions,
    schema.rolePermissions,
  ]) {
    await resetTable(db, table);
  }

  await seeds.seedSpecies(db);
  await seeds.seedPetStatus(db);
  await seeds.seedColors(db);
  await seeds.seedVaccines(db);
  await seeds.seedShelter(db);
  await seeds.seedPets(db);
  await seeds.seedRoles(db);
  await seeds.seedPermissions(db);
  await seeds.seedRolePermissions(db);
  await seeds.seedMembers(db);

  await connection.end();
}

runSeeds();
