import { relations } from "drizzle-orm";
import { integer, pgTable, serial, text } from "drizzle-orm/pg-core";
import { species } from "@/db/schema/species";

export const vaccines = pgTable("vaccines", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  specieId: integer("specie_id")
    .notNull()
    .references(() => species.id),
});

export const vaccinesRelations = relations(vaccines, ({ one }) => ({
  specie: one(species, {
    fields: [vaccines.specieId],
    references: [species.id],
  }),
}));

export type Vaccine = typeof vaccines.$inferSelect;
export type NewVaccine = typeof vaccines.$inferInsert;
