import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "#/db/schema/index.js";
import {
  dbHost,
  dbMigrating,
  dbName,
  dbPassword,
  dbPort,
  dbSeeding,
  dbUser,
} from "#/env.js";

export const connection = new pg.Pool({
  user: dbUser,
  password: dbPassword,
  host: dbHost,
  port: dbPort,
  database: dbName,
  max: dbMigrating || dbSeeding ? 1 : undefined,
});

export const db = drizzle(connection, {
  schema,
  logger: true,
});

export type db = typeof db;
