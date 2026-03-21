import { pgTable, serial, varchar } from "drizzle-orm/pg-core";

export const petStatus = pgTable("pet_status", {
  id: serial("id").primaryKey(),
  status: varchar("status", { length: 50 }).notNull(),
});

export type PetStatus = typeof petStatus.$inferSelect;
export type NewPetStatus = typeof petStatus.$inferInsert;
