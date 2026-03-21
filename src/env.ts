import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.string("production"),
  PORT: z.coerce.number().default(3000),
  DB_USER: z.string(),
  DB_PASSWORD: z.string(),
  DB_HOST: z.string(),
  DB_PORT: z.coerce.number(),
  DB_NAME: z.string(),
  DB_MIGRATING: z.stringbool().default(false),
  DB_SEEDING: z.stringbool().default(false),
  SEED_ADMIN_EMAILS: z
    .string()
    .optional()
    .transform((val) => val?.split(",")),
  DB_SSL: z.stringbool().default(true),
  COGNITO_USER_POOL_ID: z.string(),
  COGNITO_CLIENT_ID: z.string(),
});

export type Env = z.infer<typeof envSchema>;

const env = envSchema.parse(process.env);

export const {
  PORT: port,
  DB_USER: dbUser,
  DB_PASSWORD: dbPassword,
  DB_HOST: dbHost,
  DB_PORT: dbPort,
  DB_NAME: dbName,
  DB_MIGRATING: dbMigrating,
  DB_SEEDING: dbSeeding,
  SEED_ADMIN_EMAILS: seedAdminEmails,
  DB_SSL: dbSsl,
  COGNITO_USER_POOL_ID: cognitoUserPoolId,
  COGNITO_CLIENT_ID: cognitoClientId,
} = env;
