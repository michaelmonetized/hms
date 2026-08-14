import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireIdentity } from "./lib/auth";

const fieldType = v.union(
  v.literal("text"),
  v.literal("rich"),
  v.literal("image"),
  v.literal("url"),
  v.literal("number"),
  v.literal("date"),
  v.literal("relation"),
  v.literal("repeater"),
  v.literal("terms"),
);

const field = v.object({
  id: v.string(),
  key: v.string(),
  label: v.string(),
  type: fieldType,
  relationTypeId: v.optional(v.string()),
  options: v.optional(v.array(v.string())),
  repeaterFields: v.optional(
    v.array(
      v.object({
        id: v.string(),
        key: v.string(),
        label: v.string(),
        type: fieldType,
        relationTypeId: v.optional(v.string()),
      }),
    ),
  ),
});

export const list = query({
  args: { siteId: v.id("sites") },
  handler: async (ctx, { siteId }) => {
    return ctx.db
      .query("contentTypes")
      .withIndex("by_site", (q) => q.eq("siteId", siteId))
      .collect();
  },
});

export const create = mutation({
  args: {
    siteId: v.id("sites"),
    name: v.string(),
    slug: v.string(),
    plural: v.string(),
    fields: v.array(field),
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    return ctx.db.insert("contentTypes", {
      ...args,
      createdBy: identity.subject,
      updatedAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("contentTypes"),
    name: v.optional(v.string()),
    slug: v.optional(v.string()),
    plural: v.optional(v.string()),
    fields: v.optional(v.array(field)),
  },
  handler: async (ctx, { id, ...patch }) => {
    await requireIdentity(ctx);
    await ctx.db.patch(id, { ...patch, updatedAt: Date.now() });
  },
});

export const remove = mutation({
  args: { id: v.id("contentTypes") },
  handler: async (ctx, { id }) => {
    await requireIdentity(ctx);
    await ctx.db.delete(id);
  },
});
