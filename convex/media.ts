import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * List media
 * @param siteId - The site to list media for
 * @returns Array of media documents, newest first
 */
export const list = query({
  args: { siteId: v.id("sites") },
  handler: async (ctx, { siteId }) => {
    return ctx.db
      .query("media")
      .withIndex("by_site", (q) => q.eq("siteId", siteId))
      .order("desc")
      .collect();
  },
});

/**
 * Record uploaded file
 * Called after a file is uploaded to Convex storage to register it in the media library.
 * @param siteId - The site this media belongs to
 * @param storageId - Convex storage ID returned after upload
 * @param name - Original filename
 * @param mimeType - MIME type (e.g. image/jpeg)
 * @param size - File size in bytes
 * @returns New media document ID
 */
export const record = mutation({
  args: {
    siteId: v.id("sites"),
    storageId: v.string(),
    name: v.string(),
    mimeType: v.string(),
    size: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const url = await ctx.storage.getUrl(args.storageId);

    return ctx.db.insert("media", {
      ...args,
      url: url ?? undefined,
      uploadedBy: identity.subject,
      createdAt: Date.now(),
    });
  },
});

/**
 * Delete media
 * Removes the document and the underlying file from Convex storage.
 * @param id - Media document ID
 */
export const remove = mutation({
  args: { id: v.id("media") },
  handler: async (ctx, { id }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const doc = await ctx.db.get(id);
    if (!doc || !("storageId" in doc)) return;

    await ctx.storage.delete(doc.storageId);
    await ctx.db.delete(id);
  },
});
