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
  given_name: z.string(),
  family_name: z.string(),
});

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
            name: `${parsedPayload.given_name} ${parsedPayload.family_name}`,
          })
          .where(eq(users.id, existing.id))
          .returning();
        user = updated;
      } else {
        const [newUser] = await db
          .insert(users)
          .values({
            email: parsedPayload.email,
            name: `${parsedPayload.given_name} ${parsedPayload.family_name}`,
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
    // generic message so we don't leak verification details.
    console.error(
      "Auth verification failed:",
      err instanceof Error ? err.message : err,
    );
    res.status(StatusCodes.UNAUTHORIZED).json({ error: "Invalid token" });
  }
}
