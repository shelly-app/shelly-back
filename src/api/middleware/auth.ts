import { CognitoJwtVerifier } from "aws-jwt-verify";
import { eq } from "drizzle-orm";
import type { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { StatusCodes } from "@/api/constants";
import { db } from "@/db";
import { users } from "@/db/schema";
import { cognitoClientId, cognitoUserPoolId } from "@/env";

const verifier = CognitoJwtVerifier.create({
  userPoolId: cognitoUserPoolId,
  tokenUse: "id",
  clientId: cognitoClientId,
});

const cognitoPayloadSchema = z.object({
  sub: z.string(),
  email: z.email(),
  // Federated providers don't always supply these (e.g. single-name Google
  // accounts, or before attribute mapping is configured), so treat them as
  // optional and derive a display name from whatever is available.
  given_name: z.string().optional(),
  family_name: z.string().optional(),
  name: z.string().optional(),
});

const resolveDisplayName = (
  payload: z.infer<typeof cognitoPayloadSchema>,
): string =>
  payload.name?.trim() ||
  [payload.given_name, payload.family_name].filter(Boolean).join(" ").trim() ||
  payload.email;

export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    res
      .status(StatusCodes.UNAUTHORIZED)
      .json({ error: "Missing or invalid authorization header" });
    return;
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    res.status(StatusCodes.UNAUTHORIZED).json({ error: "No token provided" });
    return;
  }

  try {
    const payload = await verifier.verify(token);

    const parsedPayload = cognitoPayloadSchema.parse(payload);
    const displayName = resolveDisplayName(parsedPayload);

    let user = await db.query.users.findFirst({
      where: eq(users.cognitoSub, parsedPayload.sub),
    });

    if (!user) {
      const existing = await db.query.users.findFirst({
        where: eq(users.email, parsedPayload.email),
      });

      if (existing) {
        const [updated] = await db
          .update(users)
          .set({
            cognitoSub: parsedPayload.sub,
            name: displayName,
          })
          .where(eq(users.id, existing.id))
          .returning();
        user = updated;
      } else {
        const [newUser] = await db
          .insert(users)
          .values({
            email: parsedPayload.email,
            name: displayName,
            cognitoSub: parsedPayload.sub,
          })
          .returning();
        user = newUser;
      }
    }

    if (!user) {
      throw new Error("Failed to sync user");
    }

    req.user = user;

    next();
  } catch (err) {
    // Surface the actual reason (token expired, issuer/audience mismatch,
    // missing claims, etc.) in the server logs; the client still gets a
    // generic message so we don't leak verification details. Drizzle wraps
    // DB/connection failures as a generic "Failed query: ..." message and
    // stashes the real Postgres error on `.cause`, so log that too — otherwise
    // an infra problem (e.g. a stale pool after the DB container is recreated)
    // is indistinguishable from a genuine token failure.
    console.error(
      "Auth verification failed:",
      err instanceof Error ? err.message : err,
      err instanceof Error && err.cause ? { cause: err.cause } : "",
    );
    res.status(StatusCodes.UNAUTHORIZED).json({ error: "Invalid token" });
  }
}
