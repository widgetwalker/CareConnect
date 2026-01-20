import "dotenv/config";
import postgres from "postgres";

async function fixAuthTables() {
    const databaseUrl = process.env.DATABASE_URL;
    const queryClient = postgres(databaseUrl);

    try {
        console.log("🔧 Fixing auth tables schema...");

        // Drop and recreate session table with correct schema
        await queryClient.unsafe(`DROP TABLE IF EXISTS "session" CASCADE;`);
        await queryClient.unsafe(`
      CREATE TABLE "session" (
        "id" TEXT PRIMARY KEY,
        "expires_at" TIMESTAMPTZ NOT NULL,
        "token" TEXT NOT NULL UNIQUE,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "ip_address" TEXT,
        "user_agent" TEXT,
        "user_id" TEXT NOT NULL REFERENCES "user"("id")
      );
    `);
        console.log("✅ Session table recreated");

        // Drop and recreate account table with correct schema
        await queryClient.unsafe(`DROP TABLE IF EXISTS "account" CASCADE;`);
        await queryClient.unsafe(`
      CREATE TABLE "account" (
        "id" TEXT PRIMARY KEY,
        "account_id" TEXT NOT NULL,
        "provider_id" TEXT NOT NULL,
        "user_id" TEXT NOT NULL REFERENCES "user"("id"),
        "access_token" TEXT,
        "refresh_token" TEXT,
        "id_token" TEXT,
        "access_token_expires_at" TIMESTAMPTZ,
        "refresh_token_expires_at" TIMESTAMPTZ,
        "scope" TEXT,
        "password" TEXT,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
        console.log("✅ Account table recreated");

        // Recreate verification table
        await queryClient.unsafe(`DROP TABLE IF EXISTS "verification" CASCADE;`);
        await queryClient.unsafe(`
      CREATE TABLE "verification" (
        "id" TEXT PRIMARY KEY,
        "identifier" TEXT NOT NULL,
        "value" TEXT NOT NULL,
        "expires_at" TIMESTAMPTZ NOT NULL,
        "created_at" TIMESTAMPTZ,
        "updated_at" TIMESTAMPTZ
      );
    `);
        console.log("✅ Verification table recreated");

        console.log("✅ All auth tables fixed!");

    } catch (error) {
        console.error("❌ Error:", error.message);
        throw error;
    } finally {
        await queryClient.end();
    }
}

fixAuthTables()
    .then(() => {
        console.log("✅ Database schema fixed! Please restart the server.");
        process.exit(0);
    })
    .catch((error) => {
        console.error("❌ Failed:", error);
        process.exit(1);
    });
