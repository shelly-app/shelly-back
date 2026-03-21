import { pgTable, serial, varchar } from "drizzle-orm/pg-core";

export const species = pgTable("species", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
});

export type Species = typeof species.$inferSelect;
export type NewSpecies = typeof species.$inferInsert;
