import { defineSchema, defineTable } from "convex/server";
import { zodToConvexFields } from "convex-helpers/server/zod";
import {
  UserSchema,
  SiteSchema,
  PageSchema,
  PostSchema,
  ProductSchema,
  MediaSchema,
  RevisionSchema,
  VariantSchema,
} from "../src/lib/schemas";

export default defineSchema({
  users: defineTable(zodToConvexFields(UserSchema.shape)).index("by_clerk", ["clerkId"]),

  sites: defineTable(zodToConvexFields(SiteSchema.shape)).index("by_owner", ["ownerId"]),

  pages: defineTable(zodToConvexFields(PageSchema.shape))
    .index("by_site", ["siteId"])
    .index("by_slug", ["siteId", "slug"]),

  posts: defineTable(zodToConvexFields(PostSchema.shape))
    .index("by_site", ["siteId"])
    .index("by_slug", ["siteId", "slug"]),

  products: defineTable(zodToConvexFields(ProductSchema.shape))
    .index("by_site", ["siteId"])
    .index("by_slug", ["siteId", "slug"]),

  media: defineTable(zodToConvexFields(MediaSchema.shape)).index("by_site", ["siteId"]),

  revisions: defineTable(zodToConvexFields(RevisionSchema.shape)).index("by_entity", [
    "entityType",
    "entityId",
  ]),

  variants: defineTable(zodToConvexFields(VariantSchema.shape)).index("by_entity", [
    "entityType",
    "entityId",
  ]),
});
