import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Get site
 * Returns the authenticated user's site, or null if not yet configured.
 * @returns Site document or null
 */
export const get = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    return ctx.db
      .query("sites")
      .withIndex("by_owner", (q) => q.eq("ownerId", identity.subject))
      .unique();
  },
});

/**
 * Create site
 * Creates the initial site for the authenticated user. One site per user.
 * @param name - Site display name
 * @param domain - Optional custom domain
 * @returns New site document ID
 */
export const create = mutation({
  args: {
    name: v.string(),
    domain: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const existing = await ctx.db
      .query("sites")
      .withIndex("by_owner", (q) => q.eq("ownerId", identity.subject))
      .unique();

    if (existing) throw new Error("Site already exists");

    return ctx.db.insert("sites", {
      ...args,
      ownerId: identity.subject,
    });
  },
});

/**
 * Update site
 * @param id - Site document ID
 * @param patch - Fields to update
 */
export const update = mutation({
  args: {
    id: v.id("sites"),
    name: v.optional(v.string()),
    domain: v.optional(v.string()),
    description: v.optional(v.string()),
    logo: v.optional(v.string()),
    settings: v.optional(v.any()),
  },
  handler: async (ctx, { id, ...patch }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    await ctx.db.patch(id, patch);
  },
});
