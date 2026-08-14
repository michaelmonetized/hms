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

const ContentFieldBase = {
  id: z.string(),
  key: z.string(),
  label: z.string(),
  type: z.enum(["text", "rich", "image", "url", "number", "date", "relation", "repeater", "terms"]),
  options: z.array(z.string()).optional(),
  relationTypeId: z.string().optional(),
};

export const ContentFieldSchema = z.object({
  ...ContentFieldBase,
  repeaterFields: z.array(z.object(ContentFieldBase)).optional(),
});

export const BlueprintSchema = z.object({
  siteId: z.string(),
  name: z.string().min(1, "Name is required"),
  kind: z.enum(["component", "form", "loop-item", "template"]),
  appliesTo: z
    .enum([
      "page",
      "post-single",
      "post-archive",
      "entry-single",
      "entry-archive",
      "header",
      "footer",
      "404",
      "search",
      "product-single",
      "product-archive",
    ])
    .optional(),
  contentTypeId: z.string().optional(),
  content: z.any(),
  createdBy: z.string(),
  updatedAt: z.number(),
});

export const ContentTypeSchema = z.object({
  siteId: z.string(),
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required"),
  plural: z.string(),
  fields: z.array(ContentFieldSchema),
  createdBy: z.string(),
  updatedAt: z.number(),
});

export const EntrySchema = z.object({
  siteId: z.string(),
  contentTypeId: z.string(),
  title: z.string().min(1, "Title is required"),
  slug: z.string().min(1, "Slug is required"),
  status: z.enum(["published", "draft"]),
  fields: z.record(z.string(), z.string()),
  content: z.any(),
  createdBy: z.string(),
  updatedAt: z.number(),
});

export const SubmissionSchema = z.object({
  formId: z.string(),
  values: z.record(z.string(), z.string()),
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
export type ContentFieldDef = z.infer<typeof ContentFieldSchema>;
export type Blueprint = z.infer<typeof BlueprintSchema>;
export type ContentType = z.infer<typeof ContentTypeSchema>;
export type Entry = z.infer<typeof EntrySchema>;
export type Submission = z.infer<typeof SubmissionSchema>;
