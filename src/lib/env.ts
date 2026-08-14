const clerkKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const convexUrl = import.meta.env.VITE_CONVEX_URL;

export const hasClerk = Boolean(
  clerkKey && clerkKey.startsWith("pk_") && !clerkKey.includes("xxxxxxxx"),
);

export const hasConvex = Boolean(
  convexUrl && convexUrl.startsWith("https://") && !convexUrl.includes("your-deployment"),
);

export const isLive = hasClerk && hasConvex;

export const clerkPublishableKey = clerkKey;
export const convexDeploymentUrl = convexUrl;
