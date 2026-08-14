import type { ReactNode } from "react";
import { ClerkProvider, useAuth } from "@clerk/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toast";
import { HMSDataProvider } from "@/hooks/use-hms";
import { clerkPublishableKey, convexDeploymentUrl, hasClerk, hasConvex } from "@/lib/env";

function ShellProviders({ children }: { children: ReactNode }) {
  return (
    <TooltipProvider>
      <Toaster>
        <HMSDataProvider>{children}</HMSDataProvider>
      </Toaster>
    </TooltipProvider>
  );
}

export function HMSProvider({ children }: { children: ReactNode }) {
  if (hasClerk && hasConvex) {
    const convex = new ConvexReactClient(convexDeploymentUrl!);
    return (
      <ClerkProvider publishableKey={clerkPublishableKey!}>
        <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
          <ShellProviders>{children}</ShellProviders>
        </ConvexProviderWithClerk>
      </ClerkProvider>
    );
  }

  if (hasConvex) {
    const convex = new ConvexReactClient(convexDeploymentUrl!);
    return (
      <ConvexProvider client={convex}>
        <ShellProviders>{children}</ShellProviders>
      </ConvexProvider>
    );
  }

  return <ShellProviders>{children}</ShellProviders>;
}
