import "dotenv/config";
import postgres from "postgres";

async function checkUsers() {
    const databaseUrl = process.env.DATABASE_URL;
    const queryClient = postgres(databaseUrl);

    try {
        console.log("🔍 Checking for users in database...\n");

        const users = await queryClient.unsafe(`
      SELECT id, name, email, email_verified, created_at 
      FROM "user" 
      ORDER BY created_at DESC;
    `);

        if (users.length === 0) {
            console.log("❌ No users found in the database.");
            console.log("\nTry signing up at http://localhost:8080/");
        } else {
            console.log(`✅ Found ${users.length} user(s):\n`);
            users.forEach((user, index) => {
                console.log(`${index + 1}. Name: ${user.name}`);
                console.log(`   Email: ${user.email}`);
                console.log(`   Verified: ${user.email_verified}`);
                console.log(`   Created: ${user.created_at}`);
                console.log(`   ID: ${user.id}\n`);
            });
        }

    } catch (error) {
        console.error("❌ Error:", error.message);
    } finally {
        await queryClient.end();
    }
}

checkUsers();
