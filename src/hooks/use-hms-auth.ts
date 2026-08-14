import { useAuth } from "@clerk/react";
import { hasClerk } from "@/lib/env";

function useDevAuth() {
  return {
    isLoaded: true,
    isSignedIn: true,
    userId: "dev_user_1",
    orgId: null,
    sessionId: "dev_session_1",
  };
}

export const useHMSAuth = hasClerk ? useAuth : useDevAuth;
