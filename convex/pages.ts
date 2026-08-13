import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * List pages
 * Returns all pages for a site, ordered by most recently updated.
 * @param siteId - The site to list pages for
 * @returns Array of page documents
 */
export const list = query({
  args: { siteId: v.id("sites") },
  handler: async (ctx, { siteId }) => {
    return ctx.db
      .query("pages")
      .withIndex("by_site", (q) => q.eq("siteId", siteId))
      .order("desc")
      .collect();
  },
});

/**
 * Get page by slug
 * @param siteId - The site ID
 * @param slug - URL slug
 * @returns Page document or null
 */
export const bySlug = query({
  args: { siteId: v.id("sites"), slug: v.string() },
  handler: async (ctx, { siteId, slug }) => {
    return ctx.db
      .query("pages")
      .withIndex("by_slug", (q) => q.eq("siteId", siteId).eq("slug", slug))
      .unique();
  },
});

/**
 * Create page
 * @param siteId - The site to create the page under
 * @param title - Page title
 * @param slug - URL slug (must be unique per site)
 * @returns New page document ID
 */
export const create = mutation({
  args: {
    siteId: v.id("sites"),
    title: v.string(),
    slug: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    return ctx.db.insert("pages", {
      ...args,
      status: "draft",
      content: { blocks: [] },
      createdBy: identity.subject,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Update page
 * Saves content and optionally updates the title, slug, status, or meta.
 * Also writes a revision snapshot before overwriting.
 * @param id - Page document ID
 * @param patch - Fields to update
 */
export const update = mutation({
  args: {
    id: v.id("pages"),
    title: v.optional(v.string()),
    slug: v.optional(v.string()),
    status: v.optional(v.union(v.literal("published"), v.literal("draft"))),
    content: v.optional(v.any()),
    meta: v.optional(
      v.object({
        title: v.optional(v.string()),
        description: v.optional(v.string()),
      }),
    ),
  },
  handler: async (ctx, { id, ...patch }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const existing = await ctx.db.get(id);
    if (!existing || !("content" in existing)) throw new Error("Page not found");

    await ctx.db.insert("revisions", {
      entityType: "page",
      entityId: id,
      content: existing.content,
      createdBy: identity.subject,
      createdAt: Date.now(),
    });

    await ctx.db.patch(id, { ...patch, updatedAt: Date.now() });
  },
});

/**
 * Delete page
 * @param id - Page document ID
 */
export const remove = mutation({
  args: { id: v.id("pages") },
  handler: async (ctx, { id }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    await ctx.db.delete(id);
  },
});
