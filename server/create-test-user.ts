import "dotenv/config";
import { auth } from "./auth.js";

// Test user credentials
export const TEST_USER = {
  email: "test@aghizu.com",
  password: "Test123!@#",
  name: "Test User",
};

async function createTestUser() {
  try {
    console.log("🔧 Creating test user via Better Auth API...");
    
    // Use Better Auth's signUp endpoint
    const signUpRequest = new Request("http://localhost:3001/api/auth/sign-up/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: TEST_USER.email,
        password: TEST_USER.password,
        name: TEST_USER.name,
      }),
    });

    const response = await auth.handler(signUpRequest);
    const responseText = await response.text();
    
    if (response.ok) {
      console.log("\n✅ Test user created successfully!");
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log("📧 Email:", TEST_USER.email);
      console.log("🔑 Password:", TEST_USER.password);
      console.log("👤 Name:", TEST_USER.name);
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    } else {
      // Check if user already exists
      try {
        const errorData = JSON.parse(responseText);
        if (errorData.message?.toLowerCase().includes("already") || 
            errorData.message?.toLowerCase().includes("taken") ||
            errorData.message?.toLowerCase().includes("exists")) {
          console.log("\n✅ Test user already exists!");
          console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
          console.log("📧 Email:", TEST_USER.email);
          console.log("🔑 Password:", TEST_USER.password);
          console.log("👤 Name:", TEST_USER.name);
          console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        } else {
          console.error("❌ Error creating user:", errorData);
          throw new Error(errorData.message || "Failed to create user");
        }
      } catch (parseError) {
        console.error("❌ Error response:", responseText);
        throw new Error("Failed to create test user");
      }
    }
  } catch (error: any) {
    console.error("❌ Error creating test user:", error.message);
    console.error("\n⚠️  Make sure the auth server is running first!");
    console.error("   Run: npm run dev:auth");
    throw error;
  }
}

createTestUser()
  .then(() => {
    console.log("\n✅ Test user setup complete!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Failed to create test user:", error);
    process.exit(1);
  });

