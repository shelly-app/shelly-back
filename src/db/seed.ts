import { getTableName, sql, type Table } from "drizzle-orm";
import { connection, db } from "#/db/index.js";
import * as schema from "#/db/schema/index.js";
import * as seeds from "#/db/seeds/index.js";
import { dbSeeding } from "#/env.js";

if (!dbSeeding) {
  throw new Error('You must set DB_SEEDING to "true" when running seeds');
}

async function resetTable(db: db, table: Table) {
  return db.execute(
    sql.raw(`TRUNCATE TABLE ${getTableName(table)} RESTART IDENTITY CASCADE`),
  );
}

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
