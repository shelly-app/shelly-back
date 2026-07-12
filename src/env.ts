import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.string("production"),
  DEBUG: z.stringbool().default(false),
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
  CORS_ORIGINS: z
    .string()
    .optional()
    .transform((val) =>
      val
        ?.split(",")
        .map((origin) => origin.trim())
        .filter(Boolean),
    ),
  COGNITO_USER_POOL_ID: z.string(),
  COGNITO_CLIENT_ID: z.string(),
  // S3 image uploads. Optional so the app boots without them configured;
  // the upload endpoints fail with a clear error when they're missing.
  // Credentials are resolved via the default AWS chain (EC2 IAM role in prod,
  // shared config/env locally) — no access keys are read here.
  S3_UPLOAD_BUCKET: z.string().optional(),
  S3_REGION: z.string().optional(),
  // Public base URL that fronts the bucket (e.g. a CloudFront domain or
  // https://<bucket>.s3.<region>.amazonaws.com), used to turn stored object
  // keys into browser-loadable URLs. No trailing slash.
  ASSET_PUBLIC_BASE_URL: z
    .string()
    .optional()
    .transform((val) => val?.replace(/\/+$/, "")),
});

export type Env = z.infer<typeof envSchema>;

const env = envSchema.parse(process.env);

export const {
  NODE_ENV: nodeEnv,
  DEBUG: debug,
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
  CORS_ORIGINS: corsOrigins,
  COGNITO_USER_POOL_ID: cognitoUserPoolId,
  COGNITO_CLIENT_ID: cognitoClientId,
  S3_UPLOAD_BUCKET: s3UploadBucket,
  S3_REGION: s3Region,
  ASSET_PUBLIC_BASE_URL: assetPublicBaseUrl,
} = env;
