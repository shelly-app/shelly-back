import { relations } from "drizzle-orm";
import { pgTable, serial, varchar } from "drizzle-orm/pg-core";
import { timestamps } from "#/db/schema/helpers/timestamps.js";
import { shelterMembers } from "#/db/schema/shelter-members.js";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  cognitoSub: varchar("cognito_sub", { length: 255 }).notNull().unique(),
  ...timestamps,
});

export const usersRelations = relations(users, ({ many }) => ({
  shelterMemberships: many(shelterMembers),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
