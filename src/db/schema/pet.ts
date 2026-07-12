import { relations } from "drizzle-orm";
import {
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

import { adoptionRequests } from "@/db/schema/adoption-requests";
import {
  type ColorValue,
  sexEnum,
  sizeEnum,
  specieEnum,
  statusEnum,
} from "@/db/schema/enums";
import { events } from "@/db/schema/events";
import { shelter } from "@/db/schema/shelter";
import { vaccinations } from "@/db/schema/vaccinations";
import { timestamps } from "./helpers/timestamps";

export type {
  ColorValue,
  SexValue,
  SizeValue,
  SpecieValue,
  StatusValue,
} from "@/db/schema/enums";
export {
  colorEnum,
  sexEnum,
  sizeEnum,
  specieEnum,
  statusEnum,
} from "@/db/schema/enums";

export const pet = pgTable("pets", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  birthDate: timestamp("birth_date", { mode: "string" }),
  breed: varchar("breed", { length: 255 }),
  specie: specieEnum("specie").notNull(),
  sex: sexEnum("sex").notNull(),
  size: sizeEnum("size"),
  colors: text("colors").array().$type<ColorValue[]>(),
  status: statusEnum("status").notNull(),
  description: text("description"),
  photoKey: varchar("photo_key", { length: 512 }),
  shelterId: integer("shelter_id")
    .notNull()
    .references(() => shelter.id),
  ...timestamps,
});

export const petRelations = relations(pet, ({ one, many }) => ({
  shelter: one(shelter, { fields: [pet.shelterId], references: [shelter.id] }),
  vaccinations: many(vaccinations),
  events: many(events),
  adoptionRequests: many(adoptionRequests),
}));

export type Pet = typeof pet.$inferSelect;
export type NewPet = typeof pet.$inferInsert;
