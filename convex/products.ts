import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * List products
 * @param siteId - The site to list products for
 * @returns Array of product documents
 */
export const list = query({
  args: { siteId: v.id("sites") },
  handler: async (ctx, { siteId }) => {
    return ctx.db
      .query("products")
      .withIndex("by_site", (q) => q.eq("siteId", siteId))
      .order("desc")
      .collect();
  },
});

/**
 * Create product
 * @param siteId - The site to create the product under
 * @param name - Product name
 * @param slug - URL slug
 * @param type - physical | digital | subscription
 * @param price - Price in cents
 * @returns New product document ID
 */
export const create = mutation({
  args: {
    siteId: v.id("sites"),
    name: v.string(),
    slug: v.string(),
    type: v.union(v.literal("physical"), v.literal("digital"), v.literal("subscription")),
    price: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    return ctx.db.insert("products", {
      ...args,
      status: "draft",
      createdBy: identity.subject,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Update product
 * @param id - Product document ID
 * @param patch - Fields to update
 */
export const update = mutation({
  args: {
    id: v.id("products"),
    name: v.optional(v.string()),
    slug: v.optional(v.string()),
    status: v.optional(v.union(v.literal("active"), v.literal("draft"), v.literal("archived"))),
    price: v.optional(v.number()),
    description: v.optional(v.any()),
    images: v.optional(v.array(v.string())),
    inventory: v.optional(v.number()),
    stripePriceId: v.optional(v.string()),
  },
  handler: async (ctx, { id, ...patch }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    await ctx.db.patch(id, { ...patch, updatedAt: Date.now() });
  },
});

/**
 * Delete product
 * @param id - Product document ID
 */
export const remove = mutation({
  args: { id: v.id("products") },
  handler: async (ctx, { id }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    await ctx.db.delete(id);
  },
});
