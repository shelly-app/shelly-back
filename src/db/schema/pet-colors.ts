import { relations } from "drizzle-orm";
import { integer, pgTable, primaryKey } from "drizzle-orm/pg-core";
import { colors } from "@/db/schema/colors";
import { pet } from "@/db/schema/pet";

export const petColors = pgTable(
  "pet_colors",
  {
    petId: integer("pet_id")
      .notNull()
      .references(() => pet.id, { onDelete: "cascade" }),
    colorId: integer("color_id")
      .notNull()
      .references(() => colors.id),
  },
  (t) => [primaryKey({ columns: [t.petId, t.colorId] })],
);

export const petColorsRelations = relations(petColors, ({ one }) => ({
  pet: one(pet, { fields: [petColors.petId], references: [pet.id] }),
  color: one(colors, { fields: [petColors.colorId], references: [colors.id] }),
}));

export type PetColor = typeof petColors.$inferSelect;
export type NewPetColor = typeof petColors.$inferInsert;
