import { pgTable, serial, text } from "drizzle-orm/pg-core";
import { specieEnum } from "@/db/schema/enums";

export const vaccines = pgTable("vaccines", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  specie: specieEnum("specie").notNull(),
});

export type Vaccine = typeof vaccines.$inferSelect;
export type NewVaccine = typeof vaccines.$inferInsert;
