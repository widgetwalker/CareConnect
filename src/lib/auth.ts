import { createAuthClient } from "better-auth/react";

// Better Auth client configuration
export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_BETTER_AUTH_URL || "http://localhost:3001",
  fetchOptions: {
    credentials: "include",
  },
});

// Export auth methods
export const {
  signIn,
  signUp,
  signOut,
  useSession,
  $fetch,
} = authClient;

