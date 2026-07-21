import type { z } from "zod";
import * as repository from "@/api/contact/repository";
import type { createContactSubmissionBodySchema } from "@/api/contact/schemas";

type CreateContactSubmissionInput = z.infer<
  typeof createContactSubmissionBodySchema
>;

export async function createContactSubmission(
  body: CreateContactSubmissionInput,
) {
  const created = await repository.create({
    type: body.type,
    name: body.name,
    email: body.email,
    phone: body.phone ?? null,
    organization: body.organization ?? null,
    message: body.message,
    shelterName: body.shelterName ?? null,
    shelterLocation: body.shelterLocation ?? null,
    shelterType: body.shelterType ?? null,
  });

  return { id: created.id, success: true as const };
}
