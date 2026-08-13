import { useAuth } from "@clerk/react";

const clerkKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const hasClerk = Boolean(clerkKey && clerkKey.startsWith("pk_") && !clerkKey.includes("xxxxxxxx"));

export function useHMSAuth() {
  if (hasClerk) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useAuth();
  }
  return {
    isLoaded: true,
    isSignedIn: true,
    userId: "dev_user_1",
    orgId: null,
    sessionId: "dev_session_1",
  };
}
