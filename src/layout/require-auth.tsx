import { Outlet } from "react-router-dom";
import { RedirectToSignIn } from "@clerk/react";
import { useHMSAuth } from "@/hooks/use-hms-auth";

export function RequireAuth() {
  const { isLoaded, isSignedIn } = useHMSAuth();
  if (!isLoaded) {
    return (
      <div className="flex justify-center py-20">
        <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }
  if (!isSignedIn) return <RedirectToSignIn />;
  return <Outlet />;
}
