import type { ReactNode } from "react";
import { ClerkProvider, useAuth } from "@clerk/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { TooltipProvider } from "@/components/ui/tooltip";

const clerkKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const convexUrl = import.meta.env.VITE_CONVEX_URL;

const hasClerk = Boolean(clerkKey && clerkKey.startsWith("pk_") && !clerkKey.includes("xxxxxxxx"));
const hasConvex = Boolean(
  convexUrl && convexUrl.startsWith("https://") && !convexUrl.includes("your-deployment"),
);

export function HMSProvider({ children }: { children: ReactNode }) {
  if (hasClerk && hasConvex) {
    const convex = new ConvexReactClient(convexUrl!);
    return (
      <ClerkProvider publishableKey={clerkKey!}>
        <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
          <TooltipProvider>{children}</TooltipProvider>
        </ConvexProviderWithClerk>
      </ClerkProvider>
    );
  }

  if (hasConvex) {
    const convex = new ConvexReactClient(convexUrl!);
    return (
      <ConvexProvider client={convex}>
        <TooltipProvider>{children}</TooltipProvider>
      </ConvexProvider>
    );
  }

  return <TooltipProvider>{children}</TooltipProvider>;
}
