import type { MutationCtx, QueryCtx } from "../_generated/server";

/**
 * Require identity
 * Reads the Clerk JWT from the Convex auth context.
 * @param ctx - Query or mutation context
 * @returns The signed-in identity
 */
export async function requireIdentity(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Unauthorized");
  return identity;
}
