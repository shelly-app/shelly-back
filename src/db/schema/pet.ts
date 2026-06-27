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

import { events } from "@/db/schema/events";
import { shelter } from "@/db/schema/shelter";
import { vaccinations } from "@/db/schema/vaccinations";
import { timestamps } from "./helpers/timestamps";

export const sexEnum = pgEnum("sex", ["male", "female"]);
export const sizeEnum = pgEnum("size", ["small", "medium", "large"]);
export const colorEnum = pgEnum("color", ["black", "white", "brown", "golden"]);
export const statusEnum = pgEnum("status", [
  "in_shelter",
  "adopted",
  "in_foster",
  "deceased",
]);
export const specieEnum = pgEnum("specie", ["dog", "cat"]);

export type ColorValue = "black" | "white" | "brown" | "golden";
export type SexValue = "male" | "female";
export type SizeValue = "small" | "medium" | "large";
export type StatusValue = "in_shelter" | "adopted" | "in_foster" | "deceased";
export type SpecieValue = "dog" | "cat";

export const pet = pgTable("pets", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  birthDate: timestamp("birth_date", { mode: "string" }),
  breed: varchar("breed", { length: 255 }),
  specie: specieEnum("specie").notNull(),
  sex: sexEnum("sex").notNull(),
  size: sizeEnum("size").notNull(),
  colors: text("colors").$type<ColorValue[]>(),
  status: statusEnum("status").notNull(),
  description: text("description"),
  shelterId: integer("shelter_id")
    .notNull()
    .references(() => shelter.id),
  ...timestamps,
});

export const petRelations = relations(pet, ({ one, many }) => ({
  shelter: one(shelter, { fields: [pet.shelterId], references: [shelter.id] }),
  vaccinations: many(vaccinations),
  events: many(events),
}));

export type Pet = typeof pet.$inferSelect;
export type NewPet = typeof pet.$inferInsert;
