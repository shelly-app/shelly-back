import { relations } from "drizzle-orm";
import {
  integer,
  jsonb,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { pet } from "@/db/schema/pet";
import { users } from "@/db/schema/users";

export type EventMetadata = {
  from?: string | null;
  to?: string | null;
};

export const eventTypeEnum = pgEnum("event_type", [
  "status_change",
  "vaccination",
  "user_event",
  "name_change",
  "size_change",
]);

export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  petId: integer("pet_id")
    .notNull()
    .references(() => pet.id, { onDelete: "cascade" }),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  type: eventTypeEnum("event_type").notNull().default("user_event"),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  metadata: jsonb("metadata").$type<EventMetadata>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const eventsRelations = relations(events, ({ one }) => ({
  pet: one(pet, { fields: [events.petId], references: [pet.id] }),
  user: one(users, { fields: [events.userId], references: [users.id] }),
}));

export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;
