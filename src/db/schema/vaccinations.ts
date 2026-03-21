import { relations } from "drizzle-orm";
import { integer, pgTable, serial, timestamp } from "drizzle-orm/pg-core";
import { pet } from "#/db/schema/pet.js";
import { vaccines } from "#/db/schema/vaccines.js";

export const vaccinations = pgTable("vaccinations", {
  id: serial("id").primaryKey(),
  petId: integer("pet_id")
    .notNull()
    .references(() => pet.id, { onDelete: "cascade" }),
  vaccineId: integer("vaccine_id")
    .notNull()
    .references(() => vaccines.id),
  administeredAt: timestamp("administered_at").notNull().defaultNow(),
});

export const vaccinationsRelations = relations(vaccinations, ({ one }) => ({
  pet: one(pet, { fields: [vaccinations.petId], references: [pet.id] }),
  vaccine: one(vaccines, {
    fields: [vaccinations.vaccineId],
    references: [vaccines.id],
  }),
}));

export type Vaccination = typeof vaccinations.$inferSelect;
export type NewVaccination = typeof vaccinations.$inferInsert;
