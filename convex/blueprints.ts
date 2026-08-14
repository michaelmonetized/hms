import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireIdentity } from "./lib/auth";

const appliesTo = v.union(
  v.literal("page"),
  v.literal("post-single"),
  v.literal("post-archive"),
  v.literal("entry-single"),
  v.literal("entry-archive"),
  v.literal("header"),
  v.literal("footer"),
  v.literal("404"),
  v.literal("search"),
  v.literal("product-single"),
  v.literal("product-archive"),
);

export const list = query({
  args: { siteId: v.id("sites") },
  handler: async (ctx, { siteId }) => {
    return ctx.db
      .query("blueprints")
      .withIndex("by_site", (q) => q.eq("siteId", siteId))
      .collect();
  },
});

export const create = mutation({
  args: {
    siteId: v.id("sites"),
    name: v.string(),
    kind: v.union(
      v.literal("component"),
      v.literal("form"),
      v.literal("loop-item"),
      v.literal("template"),
    ),
    appliesTo: v.optional(appliesTo),
    contentTypeId: v.optional(v.string()),
    content: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    return ctx.db.insert("blueprints", {
      siteId: args.siteId,
      name: args.name,
      kind: args.kind,
      appliesTo: args.appliesTo,
      contentTypeId: args.contentTypeId,
      content: args.content ?? { blocks: [] },
      createdBy: identity.subject,
      updatedAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("blueprints"),
    name: v.optional(v.string()),
    content: v.optional(v.any()),
    appliesTo: v.optional(appliesTo),
    contentTypeId: v.optional(v.string()),
  },
  handler: async (ctx, { id, ...patch }) => {
    await requireIdentity(ctx);
    await ctx.db.patch(id, { ...patch, updatedAt: Date.now() });
  },
});

export const remove = mutation({
  args: { id: v.id("blueprints") },
  handler: async (ctx, { id }) => {
    await requireIdentity(ctx);
    await ctx.db.delete(id);
  },
});
