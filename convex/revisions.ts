import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireIdentity } from "./lib/auth";

const entityType = v.union(v.literal("page"), v.literal("post"), v.literal("product"));

/**
 * List revisions
 * @param entityType - page, post, or product
 * @param entityId - Target document id
 * @returns Newest revisions first
 */
export const list = query({
  args: { entityType, entityId: v.string() },
  handler: async (ctx, args) => {
    await requireIdentity(ctx);
    return ctx.db
      .query("revisions")
      .withIndex("by_entity", (q) =>
        q.eq("entityType", args.entityType).eq("entityId", args.entityId),
      )
      .order("desc")
      .collect();
  },
});

/**
 * Recent revisions
 * @returns Latest revision snapshots across the workspace
 */
export const recent = query({
  args: {},
  handler: async (ctx) => {
    await requireIdentity(ctx);
    return ctx.db.query("revisions").order("desc").take(40);
  },
});

/**
 * Restore revision
 * Snapshots the live document, then writes this revision's content back.
 * @param id - Revision document id
 */
export const restore = mutation({
  args: { id: v.id("revisions") },
  handler: async (ctx, { id }) => {
    const identity = await requireIdentity(ctx);
    const revision = (await ctx.db.get(id)) as {
      entityType: "page" | "post" | "product";
      entityId: string;
      content: unknown;
    } | null;
    if (!revision) throw new Error("Revision not found");

    if (revision.entityType === "page") {
      const page = await ctx.db.get(revision.entityId as never);
      if (!page || !("content" in page)) throw new Error("Page not found");
      await ctx.db.insert("revisions", {
        entityType: "page",
        entityId: page._id,
        content: page.content,
        createdBy: identity.subject,
        createdAt: Date.now(),
      });
      await ctx.db.patch(page._id, { content: revision.content, updatedAt: Date.now() });
      return;
    }

    if (revision.entityType === "post") {
      const post = await ctx.db.get(revision.entityId as never);
      if (!post || !("content" in post)) throw new Error("Post not found");
      await ctx.db.insert("revisions", {
        entityType: "post",
        entityId: post._id,
        content: post.content,
        createdBy: identity.subject,
        createdAt: Date.now(),
      });
      await ctx.db.patch(post._id, { content: revision.content, updatedAt: Date.now() });
      return;
    }

    const product = await ctx.db.get(revision.entityId as never);
    if (!product || !("description" in product)) throw new Error("Product not found");
    await ctx.db.insert("revisions", {
      entityType: "product",
      entityId: product._id,
      content: product.description,
      createdBy: identity.subject,
      createdAt: Date.now(),
    });
    await ctx.db.patch(product._id, { description: revision.content, updatedAt: Date.now() });
  },
});
