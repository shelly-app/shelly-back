import { pgEnum, pgTable, serial, text, varchar } from "drizzle-orm/pg-core";
import { timestamps } from "./helpers/timestamps";

export const contactTypeEnum = pgEnum("contact_type", ["shelter", "sponsor"]);

export type ContactTypeValue = "shelter" | "sponsor";

export const contactSubmissions = pgTable("contact_submissions", {
  id: serial("id").primaryKey(),
  type: contactTypeEnum("type").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 64 }),
  organization: varchar("organization", { length: 255 }),
  message: text("message").notNull(),
  shelterName: varchar("shelter_name", { length: 255 }),
  shelterLocation: varchar("shelter_location", { length: 255 }),
  shelterType: varchar("shelter_type", { length: 255 }),
  sponsorshipType: varchar("sponsorship_type", { length: 255 }),
  budget: varchar("budget", { length: 255 }),
  ...timestamps,
});

export type ContactSubmission = typeof contactSubmissions.$inferSelect;
export type NewContactSubmission = typeof contactSubmissions.$inferInsert;
