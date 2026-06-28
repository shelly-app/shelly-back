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
    schema.adoptionRequests,
    schema.contactSubmissions,
    schema.shelterMembers,
    schema.events,
    schema.vaccinations,
    schema.pet,
    schema.vaccines,
    schema.shelter,
    schema.roles,
    schema.permissions,
    schema.rolePermissions,
  ]) {
    await resetTable(db, table);
  }

  await seeds.seedVaccines(db);
  await seeds.seedShelter(db);
  // Roles and members must be seeded before pets: pet events reference a user,
  // so at least one user has to exist before `seedPets` runs.
  await seeds.seedRoles(db);
  await seeds.seedPermissions(db);
  await seeds.seedRolePermissions(db);
  await seeds.seedMembers(db);
  await seeds.seedPets(db);
  await seeds.seedAdoptionRequests(db);

  await connection.end();
}

runSeeds();
