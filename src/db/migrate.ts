import { migrate } from "drizzle-orm/node-postgres/migrator";
import { connection, db } from "#/db/index.js";
import { dbMigrating } from "#/env.js";
import config from "../../drizzle.config.js";

if (!dbMigrating) {
  throw new Error(
    'You must set DB_MIGRATING to "true" when running migrations',
  );
}

await migrate(db, { migrationsFolder: config.out ?? "src/db/migrations" });

await connection.end();
