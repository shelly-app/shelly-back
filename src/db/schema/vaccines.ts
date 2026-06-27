import { pgTable, serial, text } from "drizzle-orm/pg-core";

export const vaccines = pgTable("vaccines", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
});

export type Vaccine = typeof vaccines.$inferSelect;
export type NewVaccine = typeof vaccines.$inferInsert;
