import { z } from "zod";

const optionalString = z.preprocess(
  (value) =>
    typeof value === "string" && value.trim() === "" ? undefined : value,
  z.string().trim().min(1).optional(),
);

const optionalEmail = z.preprocess(
  (value) =>
    typeof value === "string" && value.trim() === "" ? undefined : value,
  z.email().optional(),
);

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
  // Provider-neutral SMTP configuration. Gmail SMTP with an app password is
  // a free option; other SMTP providers can be used without code changes.
  SMTP_HOST: optionalString,
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_SECURE: z.stringbool().default(false),
  SMTP_USER: optionalString,
  SMTP_PASSWORD: optionalString,
  SMTP_FROM_EMAIL: optionalEmail,
  CONTACT_RECIPIENT_EMAIL: optionalEmail,
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
  SMTP_HOST: smtpHost,
  SMTP_PORT: smtpPort,
  SMTP_SECURE: smtpSecure,
  SMTP_USER: smtpUser,
  SMTP_PASSWORD: smtpPassword,
  SMTP_FROM_EMAIL: smtpFromEmail,
  CONTACT_RECIPIENT_EMAIL: contactRecipientEmail,
} = env;
