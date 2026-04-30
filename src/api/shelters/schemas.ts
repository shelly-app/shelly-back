import { createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { shelter } from "@/db/schema";

export const shelterIdParamsSchema = z.object({
  id: z.coerce
    .number()
    .int()
    .positive()
    .meta({ examples: [1] }),
});

export const shelterSelectSchema = createSelectSchema(shelter);
