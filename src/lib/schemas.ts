import { z } from "zod";

export const UserSchema = z.object({
  clerkId: z.string(),
  email: z.string().email(),
  name: z.string().optional(),
  imageUrl: z.string().url().optional(),
});

export const SiteSettingsSchema = z.object({
  language: z.string().optional(),
  seo: z
    .object({
      metaTitle: z.string().optional(),
      metaDescription: z.string().optional(),
      ogImage: z.string().optional(),
      twitterHandle: z.string().optional(),
    })
    .optional(),
  commerce: z
    .object({
      currency: z.string().optional(),
      stripeKey: z.string().optional(),
      taxRate: z.string().optional(),
      shippingFee: z.string().optional(),
    })
    .optional(),
  integrations: z
    .object({
      resendApiKey: z.string().optional(),
    })
    .optional(),
});

export const SiteSchema = z.object({
  name: z.string().min(1, "Site name is required"),
  domain: z.string().optional(),
  description: z.string().optional(),
  logo: z.string().optional(),
  ownerId: z.string(),
  settings: SiteSettingsSchema.optional(),
});

export const PageSchema = z.object({
  siteId: z.string(),
  title: z.string().min(1, "Page title is required"),
  slug: z.string().min(1, "Slug is required"),
  status: z.enum(["published", "draft"]),
  content: z.any(),
  meta: z
    .object({
      title: z.string().optional(),
      description: z.string().optional(),
    })
    .optional(),
  createdBy: z.string(),
  updatedAt: z.number(),
});

export const PostSchema = z.object({
  siteId: z.string(),
  title: z.string().min(1, "Post title is required"),
  slug: z.string().min(1, "Slug is required"),
  status: z.enum(["published", "draft"]),
  content: z.any(),
  excerpt: z.string().optional(),
  coverImage: z.string().optional(),
  publishedAt: z.number().optional(),
  meta: z
    .object({
      title: z.string().optional(),
      description: z.string().optional(),
    })
    .optional(),
  createdBy: z.string(),
  updatedAt: z.number(),
});

export const ProductSchema = z.object({
  siteId: z.string(),
  name: z.string().min(1, "Product name is required"),
  slug: z.string().min(1, "Slug is required"),
  status: z.enum(["active", "draft", "archived"]),
  type: z.enum(["physical", "digital", "subscription"]),
  price: z.number().min(0, "Price must be non-negative"),
  description: z.any().optional(),
  images: z.array(z.string()).optional(),
  inventory: z.number().optional(),
  stripePriceId: z.string().optional(),
  createdBy: z.string(),
  updatedAt: z.number(),
});

export const MediaSchema = z.object({
  siteId: z.string(),
  storageId: z.string(),
  name: z.string(),
  mimeType: z.string(),
  size: z.number(),
  url: z.string().optional(),
  uploadedBy: z.string(),
  createdAt: z.number(),
});

export const RevisionSchema = z.object({
  entityType: z.enum(["page", "post", "product"]),
  entityId: z.string(),
  content: z.any(),
  createdBy: z.string(),
  createdAt: z.number(),
});

export const VariantSchema = z.object({
  entityType: z.enum(["page", "post"]),
  entityId: z.string(),
  name: z.string(),
  content: z.any(),
  traffic: z.number(),
  isWinner: z.boolean().optional(),
  createdBy: z.string(),
});

export type User = z.infer<typeof UserSchema>;
export type SiteSettings = z.infer<typeof SiteSettingsSchema>;
export type Site = z.infer<typeof SiteSchema>;
export type Page = z.infer<typeof PageSchema>;
export type Post = z.infer<typeof PostSchema>;
export type Product = z.infer<typeof ProductSchema>;
export type Media = z.infer<typeof MediaSchema>;
export type Revision = z.infer<typeof RevisionSchema>;
export type Variant = z.infer<typeof VariantSchema>;
