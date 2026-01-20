import "dotenv/config";
import postgres from "postgres";

async function setupDatabase() {
    const databaseUrl = process.env.DATABASE_URL;
    const queryClient = postgres(databaseUrl);

    try {
        console.log("🔧 Setting up database...");

        // Create app tables only (auth tables already exist from Better Auth)
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
    `);

        console.log("✅ All tables created successfully!");

    } catch (error) {
        console.error("❌ Error:", error.message);
        if (error.message.includes("already exists")) {
            console.log("✅ Tables already exist, skipping...");
        } else {
            throw error;
        }
    } finally {
        await queryClient.end();
    }
}

setupDatabase()
    .then(() => {
        console.log("✅ Database ready!");
        process.exit(0);
    })
    .catch((error) => {
        console.error("❌ Failed:", error);
        process.exit(1);
    });
