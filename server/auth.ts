import "dotenv/config";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema.js";

// Get database connection string from environment
// For Supabase, use connection pooling URL (Transaction mode, port 6543)
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL environment variable is required");
}

// Create postgres client
const queryClient = postgres(databaseUrl);

// Create drizzle instance
const db = drizzle(queryClient, { schema });

// Better Auth configuration
export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.usersAuth,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
      ratelimit: schema.ratelimit,
    },
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // Set to true in production
  },
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3001",
  basePath: "/api/auth",
  secret: process.env.BETTER_AUTH_SECRET || (() => {
    console.warn("⚠️  WARNING: Using default secret. Set BETTER_AUTH_SECRET in production!");
    return "change-this-secret-key-in-production-min-32-chars";
  })(),
  trustedOrigins: [
    "http://localhost:8080",
    "http://localhost:3001",
    process.env.CLIENT_URL || "http://localhost:8080",
  ],
});

export type Session = typeof auth.$Infer.Session;

