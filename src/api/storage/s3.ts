import { randomUUID } from "node:crypto";
import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { ZodError } from "zod";
import { assetPublicBaseUrl, s3Region, s3UploadBucket } from "@/env";

// Image content types we accept for uploads, mapped to the file extension used
// when generating the object key.
const ALLOWED_IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
};

const UPLOAD_URL_TTL_SECONDS = 300;

let client: S3Client | null = null;

function getClient(): S3Client {
  if (!s3UploadBucket || !s3Region) {
    throw new Error(
      "S3 uploads are not configured: set S3_UPLOAD_BUCKET and S3_REGION.",
    );
  }
  if (!client) {
    // Credentials are resolved by the default AWS provider chain (EC2 IAM role
    // in production, shared config/env locally).
    client = new S3Client({ region: s3Region });
  }
  return client;
}

/**
 * Builds a public URL for a stored object key, or null when there is no key or
 * no configured public base URL.
 */
export function buildPublicUrl(key: string | null | undefined): string | null {
  if (!key || !assetPublicBaseUrl) return null;
  return `${assetPublicBaseUrl}/${key}`;
}

/**
 * Creates a presigned PUT URL for a browser to upload an image directly to S3.
 * Throws a ZodError for unsupported content types so it surfaces as a 400.
 */
export async function createPresignedUpload(
  prefix: string,
  contentType: string,
) {
  const extension = ALLOWED_IMAGE_TYPES[contentType];

  if (!extension) {
    throw new ZodError([
      {
        code: "custom",
        path: ["contentType"],
        message: `Unsupported content type. Allowed: ${Object.keys(
          ALLOWED_IMAGE_TYPES,
        ).join(", ")}`,
      },
    ]);
  }

  const key = `${prefix}/${randomUUID()}.${extension}`;

  const uploadUrl = await getSignedUrl(
    getClient(),
    new PutObjectCommand({
      Bucket: s3UploadBucket,
      Key: key,
      ContentType: contentType,
    }),
    { expiresIn: UPLOAD_URL_TTL_SECONDS },
  );

  return { uploadUrl, key };
}

/**
 * Deletes an object by key. Best-effort: failures are logged but not thrown, so
 * cleaning up a replaced image never fails the request that already succeeded.
 */
export async function deleteObject(key: string | null | undefined) {
  if (!key) return;
  try {
    await getClient().send(
      new DeleteObjectCommand({ Bucket: s3UploadBucket, Key: key }),
    );
  } catch (error) {
    console.error(`Failed to delete S3 object "${key}":`, error);
  }
}
