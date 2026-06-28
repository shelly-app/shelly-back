import { relations } from "drizzle-orm";
import {
  boolean,
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { pet } from "@/db/schema/pet";
import { shelter } from "@/db/schema/shelter";
import { timestamps } from "./helpers/timestamps";

export const adoptionRequestStatusEnum = pgEnum("adoption_request_status", [
  "pending",
  "approved",
  "rejected",
]);

export type AdoptionRequestStatusValue = "pending" | "approved" | "rejected";

export const adoptionRequests = pgTable("adoption_requests", {
  id: serial("id").primaryKey(),
  petId: integer("pet_id")
    .notNull()
    .references(() => pet.id, { onDelete: "cascade" }),
  shelterId: integer("shelter_id")
    .notNull()
    .references(() => shelter.id, { onDelete: "cascade" }),
  requesterName: varchar("requester_name", { length: 255 }).notNull(),
  requesterEmail: varchar("requester_email", { length: 255 }).notNull(),
  requesterPhone: varchar("requester_phone", { length: 64 }),
  status: adoptionRequestStatusEnum("status").notNull().default("pending"),
  message: text("message"),
  rejectionReason: text("rejection_reason"),
  location: varchar("location", { length: 255 }),
  familyComposition: varchar("family_composition", { length: 255 }),
  hasYard: boolean("has_yard"),
  approvedAt: timestamp("approved_at", { mode: "string" }),
  rejectedAt: timestamp("rejected_at", { mode: "string" }),
  ...timestamps,
});

export const adoptionRequestsRelations = relations(
  adoptionRequests,
  ({ one }) => ({
    pet: one(pet, {
      fields: [adoptionRequests.petId],
      references: [pet.id],
    }),
    shelter: one(shelter, {
      fields: [adoptionRequests.shelterId],
      references: [shelter.id],
    }),
  }),
);

export type AdoptionRequest = typeof adoptionRequests.$inferSelect;
export type NewAdoptionRequest = typeof adoptionRequests.$inferInsert;
