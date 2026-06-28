import { db } from "@/db";
import { contactSubmissions, type NewContactSubmission } from "@/db/schema";

export async function create(values: NewContactSubmission) {
  const [created] = await db
    .insert(contactSubmissions)
    .values(values)
    .returning();
  if (!created) throw new Error("Failed to create contact submission");
  return created;
}
