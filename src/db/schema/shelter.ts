import { relations } from "drizzle-orm";
import { pgTable, serial, varchar } from "drizzle-orm/pg-core";
import { timestamps } from "#/db/schema/helpers/timestamps.js";
import { shelterMembers } from "#/db/schema/shelter-members.js";

export const shelter = pgTable("shelters", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  address: varchar("address", { length: 255 }),
  city: varchar("city", { length: 255 }).notNull(),
  state: varchar("state", { length: 255 }).notNull(),
  zip: varchar("zip", { length: 16 }).notNull(),
  country: varchar("country", { length: 255 }).notNull(),
  ...timestamps,
});

export const shelterRelations = relations(shelter, ({ many }) => ({
  members: many(shelterMembers),
}));

export type Shelter = typeof shelter.$inferSelect;
export type NewShelter = typeof shelter.$inferInsert;
