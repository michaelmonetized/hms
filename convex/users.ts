import { internalMutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Upsert user
 * Syncs a Clerk user into the users table. Called from a webhook or client-side on sign-in.
 * @param clerkId - Clerk user ID
 * @param email - User's email address
 * @param name - Display name (optional)
 * @param imageUrl - Profile image URL (optional)
 * @returns The user's Convex document ID
 */
export const upsert = internalMutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerk", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        email: args.email,
        name: args.name,
        imageUrl: args.imageUrl,
      });
      return existing._id;
    }

    return ctx.db.insert("users", args);
  },
});

/**
 * Get current user
 * Returns the authenticated user's document, or null if not signed in.
 * @returns User document or null
 */
export const me = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    return ctx.db
      .query("users")
      .withIndex("by_clerk", (q) => q.eq("clerkId", identity.subject))
      .unique();
  },
});
