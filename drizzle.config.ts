import { defineConfig } from "drizzle-kit";
import {
  dbHost,
  dbName,
  dbPassword,
  dbPort,
  dbSsl,
  dbUser,
} from "./src/env.js";

export default defineConfig({
  schema: "./src/db/schema/index.ts",
  out: "./src/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    user: dbUser,
    password: dbPassword,
    host: dbHost,
    port: dbPort,
    database: dbName,
    ssl: dbSsl,
  },
  verbose: true,
  strict: true,
});
