import { relations } from "drizzle-orm";
import {
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

import { events } from "#/db/schema/events.js";
import { petColors } from "#/db/schema/pet-colors.js";
import { petStatus } from "#/db/schema/pet-status.js";
import { petStatusHistory } from "#/db/schema/pet-status-history.js";
import { shelter } from "#/db/schema/shelter.js";
import { species } from "#/db/schema/species.js";
import { vaccinations } from "#/db/schema/vaccinations.js";
import { timestamps } from "./helpers/timestamps.js";

export const sexEnum = pgEnum("sex", ["male", "female"]);
export const sizeEnum = pgEnum("size", ["small", "medium", "large"]);

export const pet = pgTable("pets", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  birthDate: timestamp("birth_date", { mode: "string" }),
  breed: varchar("breed", { length: 255 }),
  specieId: integer("specie_id")
    .notNull()
    .references(() => species.id),
  sex: sexEnum("sex"),
  size: sizeEnum("size"),
  statusId: integer("status_id")
    .notNull()
    .references(() => petStatus.id),
  description: text("description"),
  shelterId: integer("shelter_id")
    .notNull()
    .references(() => shelter.id),
  ...timestamps,
});

export const petRelations = relations(pet, ({ one, many }) => ({
  specie: one(species, { fields: [pet.specieId], references: [species.id] }),
  status: one(petStatus, {
    fields: [pet.statusId],
    references: [petStatus.id],
  }),
  shelter: one(shelter, { fields: [pet.shelterId], references: [shelter.id] }),
  petColors: many(petColors),
  vaccinations: many(vaccinations),
  statusHistory: many(petStatusHistory),
  events: many(events),
}));

export type Pet = typeof pet.$inferSelect;
export type NewPet = typeof pet.$inferInsert;
