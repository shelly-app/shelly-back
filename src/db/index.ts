import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@/db/schema";
import {
  dbHost,
  dbMigrating,
  dbName,
  dbPassword,
  dbPort,
  dbSeeding,
  dbSsl,
  dbUser,
} from "@/env";

export const connection = new pg.Pool({
  user: dbUser,
  password: dbPassword,
  host: dbHost,
  port: dbPort,
  database: dbName,
  // RDS enforces TLS (rds.force_ssl). rejectUnauthorized:false accepts RDS's
  // cert without bundling the RDS CA; set DB_SSL=false for a local plaintext db.
  ssl: dbSsl ? { rejectUnauthorized: false } : false,
  max: dbMigrating || dbSeeding ? 1 : undefined,
});

export const db = drizzle(connection, {
  schema,
  logger: true,
});

export type db = typeof db;
