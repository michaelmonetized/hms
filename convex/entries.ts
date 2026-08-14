import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireIdentity } from "./lib/auth";

export const list = query({
  args: { siteId: v.id("sites") },
  handler: async (ctx, { siteId }) => {
    return ctx.db
      .query("entries")
      .withIndex("by_site", (q) => q.eq("siteId", siteId))
      .collect();
  },
});

export const published = query({
  args: { siteId: v.id("sites") },
  handler: async (ctx, { siteId }) => {
    const rows = await ctx.db
      .query("entries")
      .withIndex("by_site", (q) => q.eq("siteId", siteId))
      .collect();
    return rows.filter((row) => row.status === "published");
  },
});

export const create = mutation({
  args: {
    siteId: v.id("sites"),
    contentTypeId: v.string(),
    title: v.string(),
    slug: v.string(),
    fields: v.optional(v.record(v.string(), v.string())),
    content: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    return ctx.db.insert("entries", {
      siteId: args.siteId,
      contentTypeId: args.contentTypeId,
      title: args.title,
      slug: args.slug,
      status: "draft",
      fields: args.fields ?? {},
      content: args.content ?? { blocks: [] },
      createdBy: identity.subject,
      updatedAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("entries"),
    title: v.optional(v.string()),
    slug: v.optional(v.string()),
    status: v.optional(v.union(v.literal("published"), v.literal("draft"))),
    fields: v.optional(v.record(v.string(), v.string())),
    content: v.optional(v.any()),
  },
  handler: async (ctx, { id, ...patch }) => {
    await requireIdentity(ctx);
    await ctx.db.patch(id, { ...patch, updatedAt: Date.now() });
  },
});

export const remove = mutation({
  args: { id: v.id("entries") },
  handler: async (ctx, { id }) => {
    await requireIdentity(ctx);
    await ctx.db.delete(id);
  },
});
