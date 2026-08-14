import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireIdentity } from "./lib/auth";

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
 * Get or create site
 * One site per owner. Seeds a draft home page on first run.
 * @param name - Optional display name
 * @returns Site document ID
 */
export const getOrCreate = mutation({
  args: {
    name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const existing = await ctx.db
      .query("sites")
      .withIndex("by_owner", (q) => q.eq("ownerId", identity.subject))
      .unique();
    if (existing) return existing._id;

    const siteId = await ctx.db.insert("sites", {
      name: args.name ?? "My Site",
      ownerId: identity.subject,
    });

    await ctx.db.insert("pages", {
      siteId,
      title: "Home",
      slug: "home",
      status: "draft",
      content: {
        blocks: [
          {
            id: "home-hero",
            type: "hero",
            content: {
              title: "Build systems that scale.",
              subtitle: "The site is the editor. Click Edit.",
              buttonText: "See the work",
              buttonHref: "/blog",
              align: "center",
            },
          },
          {
            id: "home-collection",
            type: "collection",
            content: {
              title: "Latest",
              source: "posts",
              layout: "grid",
              limit: 6,
              columns: 3,
            },
          },
        ],
      },
      createdBy: identity.subject,
      updatedAt: Date.now(),
    });

    return siteId;
  },
});

/**
 * Public site
 * Signed-in users get their site. Visitors get the first site on this deployment.
 */
export const publicSite = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (identity) {
      return ctx.db
        .query("sites")
        .withIndex("by_owner", (q) => q.eq("ownerId", identity.subject))
        .unique();
    }
    return ctx.db.query("sites").first();
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
    await requireIdentity(ctx);
    await ctx.db.patch(id, patch);
  },
});
