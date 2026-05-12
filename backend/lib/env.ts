import "dotenv/config";

function required(name: string): string {
  const value = process.env[name];
  if (!value && process.env.NODE_ENV === "production") {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value ?? "";
}

export const env = {
  appId: required("APP_ID"),
  appSecret: required("APP_SECRET"),
  isProduction: process.env.NODE_ENV === "production",
  databaseUrl: required("DATABASE_URL"),
  // Kimi authentication integration removed; related env vars dropped.
  ownerUnionId: process.env.OWNER_UNION_ID ?? "",
  marinesiaApiKey: process.env.MARINESIA_API_KEY ?? "",
  /** HS256 (or compatible) secret for `kimi_sid` JWT sessions; omit for guest-only. */
  sessionJwtSecret: process.env.SESSION_JWT_SECRET ?? "",
};
