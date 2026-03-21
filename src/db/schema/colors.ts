import { pgTable, serial, varchar } from "drizzle-orm/pg-core";

export const colors = pgTable("colors", {
  id: serial("id").primaryKey(),
  color: varchar("color", { length: 50 }).notNull(),
});

export type Color = typeof colors.$inferSelect;
export type NewColor = typeof colors.$inferInsert;
