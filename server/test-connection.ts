import "dotenv/config";
import postgres from "postgres";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("❌ DATABASE_URL not found in .env");
  process.exit(1);
}

console.log("🔧 Testing database connection...");
console.log("📡 Database URL:", databaseUrl.replace(/:[^:@]+@/, ":****@"));

const queryClient = postgres(databaseUrl);

queryClient`SELECT 1 as test`
  .then(() => {
    console.log("✅ Database connection successful!");
    queryClient.end();
    process.exit(0);
  })
  .catch((error: any) => {
    console.error("❌ Database connection failed!");
    console.error("Error:", error.message);
    if (error.code) {
      console.error("Error code:", error.code);
    }
    queryClient.end();
    process.exit(1);
  });

