import { relations } from "drizzle-orm";
import { pgTable, serial, varchar } from "drizzle-orm/pg-core";
import { timestamps } from "@/db/schema/helpers/timestamps";
import { rolePermissions } from "@/db/schema/role-permissions";

export const permissions = pgTable("permissions", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  ...timestamps,
});

export const permissionsRelations = relations(permissions, ({ many }) => ({
  rolePermissions: many(rolePermissions),
}));

export type Permission = typeof permissions.$inferSelect;
export type NewPermission = typeof permissions.$inferInsert;
