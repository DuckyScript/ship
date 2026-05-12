import { parse } from "cookie";
import { jwtVerify } from "jose";
import { Session } from "@contracts/constants";
import type { User } from "@db/schema";
import { env } from "./env";
import { findUserByUnionId } from "../queries/users";

const SESSION_JWT_ERROR_NAMES = new Set([
  "JWTExpired",
  "JWTInvalid",
  "JWSSignatureVerificationFailed",
  "JWSInvalid",
  "JOSEAlgNotAllowed",
  "JOSENotSupported",
]);

function isSessionTokenError(error: unknown): boolean {
  return (
    error instanceof Error &&
    SESSION_JWT_ERROR_NAMES.has(error.name)
  );
}

/**
 * Resolves the current user from the session cookie when `SESSION_JWT_SECRET`
 * is set and the cookie holds a valid JWT whose `sub` (or `unionId`) matches
 * a row in `users`. Otherwise returns undefined (guest).
 */
export async function getSessionUser(req: Request): Promise<User | undefined> {
  const raw = req.headers.get("cookie");
  if (!raw) return undefined;

  const token = parse(raw)[Session.cookieName];
  if (!token) return undefined;

  const secret = env.sessionJwtSecret;
  if (!secret) return undefined;

  let payload: Awaited<ReturnType<typeof jwtVerify>>["payload"];
  try {
    ({ payload } = await jwtVerify(
      token,
      new TextEncoder().encode(secret),
    ));
  } catch (error: unknown) {
    if (isSessionTokenError(error)) return undefined;
    throw error;
  }

  const unionId =
    typeof payload.sub === "string"
      ? payload.sub
      : typeof payload.unionId === "string"
        ? payload.unionId
        : undefined;
  if (!unionId) return undefined;
  return (await findUserByUnionId(unionId)) ?? undefined;
}
