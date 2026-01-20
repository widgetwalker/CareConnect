import "dotenv/config";
import postgres from "postgres";

async function createUserTable() {
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
        throw new Error("DATABASE_URL environment variable is required");
    }

    const queryClient = postgres(databaseUrl);

    try {
        console.log("🔧 Creating user table...");

        // Create the user table
        await queryClient.unsafe(`
      CREATE TABLE IF NOT EXISTS "user" (
        "id" TEXT PRIMARY KEY,
        "name" TEXT NOT NULL,
        "email" TEXT NOT NULL UNIQUE,
        "email_verified" BOOLEAN NOT NULL DEFAULT false,
        "image" TEXT,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

        console.log("✅ User table created!");

        // Now create the rest of the tables and indexes
        await queryClient.unsafe(`
      -- Indexes for better performance
      CREATE INDEX IF NOT EXISTS idx_session_user_id ON "session"("user_id");
      CREATE INDEX IF NOT EXISTS idx_account_user_id ON "account"("user_id");
    `);

        console.log("✅ Indexes created!");

        // Create app-specific tables
        await queryClient.unsafe(`
      CREATE TABLE IF NOT EXISTS "specialties" (
        "id" TEXT PRIMARY KEY,
        "name" TEXT NOT NULL,
        "icon" TEXT
      );

      CREATE TABLE IF NOT EXISTS "doctors" (
        "id" TEXT PRIMARY KEY,
        "name" TEXT NOT NULL,
        "specialty_id" TEXT REFERENCES "specialties"("id"),
        "rating" TEXT,
        "bio" TEXT,
        "experience" TEXT,
        "availability" TEXT,
        "image" TEXT,
        "consultation_fee" INTEGER
      );

      CREATE TABLE IF NOT EXISTS "medicines" (
        "id" TEXT PRIMARY KEY,
        "name" TEXT NOT NULL,
        "category" TEXT,
        "price" INTEGER NOT NULL,
        "description" TEXT,
        "image" TEXT,
        "stock" INTEGER NOT NULL DEFAULT 100
      );

      CREATE TABLE IF NOT EXISTS "appointments" (
        "id" TEXT PRIMARY KEY,
        "user_id" TEXT REFERENCES "user"("id") NOT NULL,
        "doctor_id" TEXT REFERENCES "doctors"("id") NOT NULL,
        "date" TIMESTAMPTZ NOT NULL,
        "status" TEXT NOT NULL DEFAULT 'scheduled',
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS "cart_items" (
        "id" TEXT PRIMARY KEY,
        "user_id" TEXT REFERENCES "user"("id") NOT NULL,
        "medicine_id" TEXT REFERENCES "medicines"("id") NOT NULL,
        "quantity" INTEGER NOT NULL DEFAULT 1,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_appointments_user_id ON "appointments"("user_id");
      CREATE INDEX IF NOT EXISTS idx_appointments_doctor_id ON "appointments"("doctor_id");
      CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON "cart_items"("user_id");
    `);

        console.log("✅ All application tables created!");

    } catch (error) {
        console.error("❌ Error:", error.message);
        throw error;
    } finally {
        await queryClient.end();
    }
}

createUserTable()
    .then(() => {
        console.log("✅ Database setup complete!");
        process.exit(0);
    })
    .catch((error) => {
        console.error("❌ Failed:", error);
        process.exit(1);
    });
