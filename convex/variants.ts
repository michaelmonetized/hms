import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireIdentity } from "./lib/auth";

const entityType = v.union(v.literal("page"), v.literal("post"));

/**
 * List variants
 * Public so visitors can be assigned a split-test variant.
 */
export const list = query({
  args: { entityType, entityId: v.string() },
  handler: async (ctx, args) => {
    return ctx.db
      .query("variants")
      .withIndex("by_entity", (q) =>
        q.eq("entityType", args.entityType).eq("entityId", args.entityId),
      )
      .collect();
  },
});

/**
 * All variants
 * Used by the workspace and public renderer.
 */
export const all = query({
  args: {},
  handler: async (ctx) => {
    return ctx.db.query("variants").collect();
  },
});

/**
 * Create variant
 */
export const create = mutation({
  args: {
    entityType,
    entityId: v.string(),
    name: v.string(),
    content: v.any(),
    traffic: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    return ctx.db.insert("variants", {
      ...args,
      createdBy: identity.subject,
    });
  },
});

/**
 * Update variant
 */
export const update = mutation({
  args: {
    id: v.id("variants"),
    name: v.optional(v.string()),
    content: v.optional(v.any()),
    traffic: v.optional(v.number()),
    isWinner: v.optional(v.boolean()),
  },
  handler: async (ctx, { id, ...patch }) => {
    await requireIdentity(ctx);
    await ctx.db.patch(id, patch);
  },
});

/**
 * Delete variant
 */
export const remove = mutation({
  args: { id: v.id("variants") },
  handler: async (ctx, { id }) => {
    await requireIdentity(ctx);
    await ctx.db.delete(id);
  },
});
