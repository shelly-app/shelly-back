import { migrate } from "drizzle-orm/node-postgres/migrator";
import { connection, db } from "@/db";
import { dbMigrating } from "@/env";

if (!dbMigrating) {
  throw new Error(
    'You must set DB_MIGRATING to "true" when running migrations',
  );
}

async function runMigrations() {
  await migrate(db, { migrationsFolder: "./src/db/migrations" });
  await connection.end();
}

runMigrations();
