import { relations } from "drizzle-orm";
import { integer, pgTable, serial, timestamp } from "drizzle-orm/pg-core";
import { pet } from "#/db/schema/pet.js";
import { petStatus } from "#/db/schema/pet-status.js";

export const petStatusHistory = pgTable("pet_status_history", {
  id: serial("id").primaryKey(),
  petId: integer("pet_id")
    .notNull()
    .references(() => pet.id, { onDelete: "cascade" }),
  statusId: integer("status_id")
    .notNull()
    .references(() => petStatus.id),
  changedAt: timestamp("changed_at").defaultNow().notNull(),
});

export const petStatusHistoryRelations = relations(
  petStatusHistory,
  ({ one }) => ({
    pet: one(pet, {
      fields: [petStatusHistory.petId],
      references: [pet.id],
    }),
    status: one(petStatus, {
      fields: [petStatusHistory.statusId],
      references: [petStatus.id],
    }),
  }),
);

export type PetStatusHistory = typeof petStatusHistory.$inferSelect;
export type NewPetStatusHistory = typeof petStatusHistory.$inferInsert;
