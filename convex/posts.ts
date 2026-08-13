import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * List posts
 * @param siteId - The site to list posts for
 * @returns Array of post documents, newest first
 */
export const list = query({
  args: { siteId: v.id("sites") },
  handler: async (ctx, { siteId }) => {
    return ctx.db
      .query("posts")
      .withIndex("by_site", (q) => q.eq("siteId", siteId))
      .order("desc")
      .collect();
  },
});

/**
 * Create post
 * @param siteId - The site to create the post under
 * @param title - Post title
 * @param slug - URL slug
 * @returns New post document ID
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

    return ctx.db.insert("posts", {
      ...args,
      status: "draft",
      content: { blocks: [] },
      createdBy: identity.subject,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Update post
 * @param id - Post document ID
 * @param patch - Fields to update
 */
export const update = mutation({
  args: {
    id: v.id("posts"),
    title: v.optional(v.string()),
    slug: v.optional(v.string()),
    status: v.optional(v.union(v.literal("published"), v.literal("draft"))),
    content: v.optional(v.any()),
    excerpt: v.optional(v.string()),
    coverImage: v.optional(v.string()),
    publishedAt: v.optional(v.number()),
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
    if (!existing || !("content" in existing)) throw new Error("Post not found");

    await ctx.db.insert("revisions", {
      entityType: "post",
      entityId: id,
      content: existing.content,
      createdBy: identity.subject,
      createdAt: Date.now(),
    });

    await ctx.db.patch(id, { ...patch, updatedAt: Date.now() });
  },
});

/**
 * Delete post
 * @param id - Post document ID
 */
export const remove = mutation({
  args: { id: v.id("posts") },
  handler: async (ctx, { id }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    await ctx.db.delete(id);
  },
});
