import { relations } from "drizzle-orm";
import { pgTable, serial, varchar } from "drizzle-orm/pg-core";
import { timestamps } from "#/db/schema/helpers/timestamps.js";
import { rolePermissions } from "#/db/schema/role-permissions.js";
import { shelterMembers } from "#/db/schema/shelter-members.js";

export const roles = pgTable("roles", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 50 }).notNull().unique(),
  ...timestamps,
});

export const rolesRelations = relations(roles, ({ many }) => ({
  permissions: many(rolePermissions),
  members: many(shelterMembers),
}));

export type Role = typeof roles.$inferSelect;
export type NewRole = typeof roles.$inferInsert;
