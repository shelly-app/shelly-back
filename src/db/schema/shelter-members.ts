import { relations } from "drizzle-orm";
import { integer, pgTable, primaryKey, timestamp } from "drizzle-orm/pg-core";
import { roles } from "#/db/schema/roles.js";
import { shelter } from "#/db/schema/shelter.js";
import { users } from "#/db/schema/users.js";

export const shelterMembers = pgTable(
  "shelter_members",
  {
    shelterId: integer("shelter_id")
      .notNull()
      .references(() => shelter.id, { onDelete: "cascade" }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    roleId: integer("role_id")
      .notNull()
      .references(() => roles.id),
    joinedAt: timestamp("joined_at").defaultNow().notNull(),
  },
  (t) => [primaryKey({ columns: [t.shelterId, t.userId] })],
);

export const shelterMembersRelations = relations(shelterMembers, ({ one }) => ({
  shelter: one(shelter, {
    fields: [shelterMembers.shelterId],
    references: [shelter.id],
  }),
  user: one(users, {
    fields: [shelterMembers.userId],
    references: [users.id],
  }),
  role: one(roles, {
    fields: [shelterMembers.roleId],
    references: [roles.id],
  }),
}));

export type ShelterMember = typeof shelterMembers.$inferSelect;
export type NewShelterMember = typeof shelterMembers.$inferInsert;
