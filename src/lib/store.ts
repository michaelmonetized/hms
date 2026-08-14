import {
  createBlock,
  newId,
  normalizeContent,
  normalizeSlug,
  slugify,
  type PageContent,
} from "./content";
import type { Site } from "./schemas";

export type EntityType = "page" | "post" | "product";

export type StoredSite = Site & {
  _id: string;
  _creationTime: number;
};

export type StoredPage = {
  _id: string;
  _creationTime: number;
  siteId: string;
  title: string;
  slug: string;
  status: "published" | "draft";
  content: PageContent;
  meta?: { title?: string; description?: string };
  createdBy: string;
  updatedAt: number;
};

export type StoredPost = {
  _id: string;
  _creationTime: number;
  siteId: string;
  title: string;
  slug: string;
  status: "published" | "draft";
  content: PageContent;
  excerpt?: string;
  coverImage?: string;
  publishedAt?: number;
  meta?: { title?: string; description?: string };
  createdBy: string;
  updatedAt: number;
};

export type StoredProduct = {
  _id: string;
  _creationTime: number;
  siteId: string;
  name: string;
  slug: string;
  status: "active" | "draft" | "archived";
  type: "physical" | "digital" | "subscription";
  price: number;
  description?: PageContent;
  images?: string[];
  inventory?: number;
  stripePriceId?: string;
  createdBy: string;
  updatedAt: number;
};

export type StoredMedia = {
  _id: string;
  _creationTime: number;
  siteId: string;
  storageId: string;
  name: string;
  mimeType: string;
  size: number;
  url?: string;
  uploadedBy: string;
  createdAt: number;
};

export type StoredRevision = {
  _id: string;
  _creationTime: number;
  entityType: EntityType;
  entityId: string;
  content: unknown;
  createdBy: string;
  createdAt: number;
};

export type StoredVariant = {
  _id: string;
  _creationTime: number;
  entityType: "page" | "post";
  entityId: string;
  name: string;
  content: PageContent;
  traffic: number;
  isWinner?: boolean;
  createdBy: string;
};

export type HMSState = {
  site: StoredSite;
  pages: StoredPage[];
  posts: StoredPost[];
  products: StoredProduct[];
  media: StoredMedia[];
  revisions: StoredRevision[];
  variants: StoredVariant[];
};

const LOCAL_SITE_ID = "local_site";
const LOCAL_OWNER = "dev_user_1";

function now(): number {
  return Date.now();
}

function actor(state: HMSState): string {
  return state.site.ownerId || LOCAL_OWNER;
}

function assertUniqueSlug(
  items: { _id: string; slug: string }[],
  slug: string,
  ignoreId?: string,
): void {
  if (items.some((item) => item.slug === slug && item._id !== ignoreId)) {
    throw new Error(`Slug "${slug}" is already in use`);
  }
}

/**
 * Empty state
 * @returns A blank local HMS workspace
 */
export function emptyState(): HMSState {
  const created = now();
  return {
    site: {
      _id: LOCAL_SITE_ID,
      _creationTime: created,
      name: "HMS Demo Site",
      domain: "hms.app",
      description:
        "Full-featured TanStack Start core with Convex and a real-time JSON page builder.",
      ownerId: LOCAL_OWNER,
      settings: {
        language: "en-US",
        seo: {
          metaTitle: "%s | HMS",
          metaDescription: "Move fast, break stuff, and hustle hard with HMS.",
        },
        commerce: {
          currency: "USD",
          taxRate: "0",
          shippingFee: "0",
        },
      },
    },
    pages: [],
    posts: [],
    products: [],
    media: [],
    revisions: [],
    variants: [],
  };
}

/**
 * Seed state
 * @returns Demo content matching the original admin screens
 */
export function seedState(): HMSState {
  const state = emptyState();
  const home = addPage(state, {
    title: "Home",
    slug: "home",
    status: "published",
    content: {
      blocks: [
        {
          id: "b1",
          type: "hero",
          content: {
            title: "Build, publish, hustle.",
            subtitle: "Replace bloated legacy CMSs with speed and simplicity.",
            buttonText: "Get Started",
          },
        },
        {
          id: "b-features",
          type: "features",
          content: {
            title: "Why HMS",
            items: ["Realtime JSON Page Builder", "Timestamped Revisions", "Native A/B Testing"],
          },
        },
        {
          id: "b-cta",
          type: "cta",
          content: {
            title: "Ready to replace WordPress?",
            subtitle: "Publish a page. Visitors see it instantly.",
            buttonText: "Read the blog",
            buttonHref: "/blog",
          },
        },
        {
          id: "b-posts",
          type: "collection",
          content: {
            title: "From the blog",
            source: "posts",
            layout: "grid",
            limit: 3,
            columns: 3,
          },
        },
      ],
    },
  });
  const about = addPage(home.next, {
    title: "About Us",
    slug: "about",
    content: {
      blocks: [
        { id: "b2", type: "heading", content: { title: "Our Mission" } },
        {
          id: "b3",
          type: "text",
          content: { body: "HMS is built for modern engineering and growth." },
        },
      ],
    },
  });
  const post = addPost(about.next, {
    title: "Why We Built HMS to Replace WordPress",
    excerpt: "Dynamic rendering, real-time edits, zero technical debt.",
    status: "published",
  });
  const product = addProduct(post.next, {
    name: "HMS Pro License",
    type: "subscription",
    price: 4900,
    status: "active",
  });
  return addProduct(product.next, {
    name: "Starter Theme Pack",
    type: "digital",
    price: 2900,
    status: "active",
  }).next;
}

/**
 * Add page
 * @param state - Current workspace
 * @param input - Title and optional slug/content
 * @returns Next state and the new page id
 */
export function addPage(
  state: HMSState,
  input: {
    title: string;
    slug?: string;
    status?: StoredPage["status"];
    content?: PageContent;
  },
): { next: HMSState; id: string } {
  const slug = normalizeSlug(input.slug ?? input.title);
  assertUniqueSlug(state.pages, slug);
  const created = now();
  const id = newId();
  const page: StoredPage = {
    _id: id,
    _creationTime: created,
    siteId: state.site._id,
    title: input.title,
    slug,
    status: input.status ?? "draft",
    content: normalizeContent(input.content ?? { blocks: [] }),
    createdBy: actor(state),
    updatedAt: created,
  };
  return { next: { ...state, pages: [page, ...state.pages] }, id };
}

/**
 * Update page
 * Writes a revision when content changes.
 */
export function updatePage(
  state: HMSState,
  id: string,
  patch: Partial<Pick<StoredPage, "title" | "slug" | "status" | "content" | "meta">>,
  options: { snapshot?: boolean } = {},
): HMSState {
  const existing = state.pages.find((page) => page._id === id);
  if (!existing) throw new Error("Page not found");
  const slug = patch.slug ? normalizeSlug(patch.slug) : existing.slug;
  assertUniqueSlug(state.pages, slug, id);
  const shouldSnapshot = options.snapshot ?? true;
  let revisions = state.revisions;
  if (patch.content && shouldSnapshot) {
    const snap = addRevision(state, {
      entityType: "page",
      entityId: id,
      content: existing.content,
    });
    revisions = snap.next.revisions;
  }
  const page: StoredPage = {
    ...existing,
    ...patch,
    slug,
    content: patch.content ? normalizeContent(patch.content) : existing.content,
    updatedAt: now(),
  };
  return {
    ...state,
    revisions,
    pages: state.pages.map((item) => (item._id === id ? page : item)),
  };
}

/**
 * Remove page
 * Drops the page plus its revisions and variants.
 */
export function removePage(state: HMSState, id: string): HMSState {
  return {
    ...state,
    pages: state.pages.filter((page) => page._id !== id),
    revisions: state.revisions.filter((rev) => !(rev.entityType === "page" && rev.entityId === id)),
    variants: state.variants.filter(
      (variant) => !(variant.entityType === "page" && variant.entityId === id),
    ),
  };
}

/**
 * Add post
 */
export function addPost(
  state: HMSState,
  input: {
    title: string;
    slug?: string;
    excerpt?: string;
    status?: StoredPost["status"];
    content?: PageContent;
  },
): { next: HMSState; id: string } {
  const slug = normalizeSlug(input.slug ?? input.title);
  assertUniqueSlug(state.posts, slug);
  const created = now();
  const id = newId();
  const published = input.status === "published";
  const post: StoredPost = {
    _id: id,
    _creationTime: created,
    siteId: state.site._id,
    title: input.title,
    slug,
    excerpt: input.excerpt,
    status: input.status ?? "draft",
    content: normalizeContent(input.content ?? { blocks: [createBlock("heading")] }),
    publishedAt: published ? created : undefined,
    createdBy: actor(state),
    updatedAt: created,
  };
  return { next: { ...state, posts: [post, ...state.posts] }, id };
}

/**
 * Update post
 */
export function updatePost(
  state: HMSState,
  id: string,
  patch: Partial<
    Pick<StoredPost, "title" | "slug" | "status" | "content" | "excerpt" | "coverImage" | "meta">
  >,
  options: { snapshot?: boolean } = {},
): HMSState {
  const existing = state.posts.find((post) => post._id === id);
  if (!existing) throw new Error("Post not found");
  const slug = patch.slug ? normalizeSlug(patch.slug) : existing.slug;
  assertUniqueSlug(state.posts, slug, id);
  const shouldSnapshot = options.snapshot ?? true;
  let revisions = state.revisions;
  if (patch.content && shouldSnapshot) {
    const snap = addRevision(state, {
      entityType: "post",
      entityId: id,
      content: existing.content,
    });
    revisions = snap.next.revisions;
  }
  const publishing = patch.status === "published" && existing.status !== "published";
  const post: StoredPost = {
    ...existing,
    ...patch,
    slug,
    content: patch.content ? normalizeContent(patch.content) : existing.content,
    publishedAt: publishing ? now() : existing.publishedAt,
    updatedAt: now(),
  };
  return {
    ...state,
    revisions,
    posts: state.posts.map((item) => (item._id === id ? post : item)),
  };
}

/**
 * Remove post
 */
export function removePost(state: HMSState, id: string): HMSState {
  return {
    ...state,
    posts: state.posts.filter((post) => post._id !== id),
    revisions: state.revisions.filter((rev) => !(rev.entityType === "post" && rev.entityId === id)),
    variants: state.variants.filter(
      (variant) => !(variant.entityType === "post" && variant.entityId === id),
    ),
  };
}

/**
 * Add product
 */
export function addProduct(
  state: HMSState,
  input: {
    name: string;
    slug?: string;
    type: StoredProduct["type"];
    price: number;
    status?: StoredProduct["status"];
  },
): { next: HMSState; id: string } {
  const slug = slugify(input.slug ?? input.name);
  if (!slug) throw new Error("Slug is required");
  assertUniqueSlug(state.products, slug);
  const created = now();
  const id = newId();
  const product: StoredProduct = {
    _id: id,
    _creationTime: created,
    siteId: state.site._id,
    name: input.name,
    slug,
    type: input.type,
    price: input.price,
    status: input.status ?? "draft",
    createdBy: actor(state),
    updatedAt: created,
  };
  return { next: { ...state, products: [product, ...state.products] }, id };
}

/**
 * Update product
 */
export function updateProduct(
  state: HMSState,
  id: string,
  patch: Partial<
    Pick<
      StoredProduct,
      | "name"
      | "slug"
      | "status"
      | "price"
      | "description"
      | "images"
      | "inventory"
      | "stripePriceId"
    >
  >,
): HMSState {
  const existing = state.products.find((product) => product._id === id);
  if (!existing) throw new Error("Product not found");
  const slug = patch.slug ? slugify(patch.slug) : existing.slug;
  assertUniqueSlug(state.products, slug, id);
  const product: StoredProduct = {
    ...existing,
    ...patch,
    slug,
    updatedAt: now(),
  };
  return {
    ...state,
    products: state.products.map((item) => (item._id === id ? product : item)),
  };
}

/**
 * Remove product
 */
export function removeProduct(state: HMSState, id: string): HMSState {
  return {
    ...state,
    products: state.products.filter((product) => product._id !== id),
    revisions: state.revisions.filter(
      (rev) => !(rev.entityType === "product" && rev.entityId === id),
    ),
  };
}

/**
 * Add media
 */
export function addMedia(
  state: HMSState,
  input: {
    name: string;
    mimeType: string;
    size: number;
    url?: string;
    storageId?: string;
  },
): { next: HMSState; id: string } {
  const created = now();
  const id = newId();
  const item: StoredMedia = {
    _id: id,
    _creationTime: created,
    siteId: state.site._id,
    storageId: input.storageId ?? id,
    name: input.name,
    mimeType: input.mimeType,
    size: input.size,
    url: input.url,
    uploadedBy: actor(state),
    createdAt: created,
  };
  return { next: { ...state, media: [item, ...state.media] }, id };
}

/**
 * Remove media
 */
export function removeMedia(state: HMSState, id: string): HMSState {
  return { ...state, media: state.media.filter((item) => item._id !== id) };
}

/**
 * Add revision
 */
export function addRevision(
  state: HMSState,
  input: { entityType: EntityType; entityId: string; content: unknown },
): { next: HMSState; id: string } {
  const created = now();
  const id = newId();
  const revision: StoredRevision = {
    _id: id,
    _creationTime: created,
    entityType: input.entityType,
    entityId: input.entityId,
    content: input.content,
    createdBy: actor(state),
    createdAt: created,
  };
  return { next: { ...state, revisions: [revision, ...state.revisions] }, id };
}

/**
 * Restore revision
 * Snapshots the live document, then writes the revision content back.
 */
export function restoreRevision(state: HMSState, revisionId: string): HMSState {
  const revision = state.revisions.find((item) => item._id === revisionId);
  if (!revision) throw new Error("Revision not found");

  if (revision.entityType === "page") {
    return updatePage(state, revision.entityId, {
      content: normalizeContent(revision.content),
    });
  }
  if (revision.entityType === "post") {
    return updatePost(state, revision.entityId, {
      content: normalizeContent(revision.content),
    });
  }
  return updateProduct(state, revision.entityId, {
    description: normalizeContent(revision.content),
  });
}

/**
 * Add variant
 */
export function addVariant(
  state: HMSState,
  input: {
    entityType: "page" | "post";
    entityId: string;
    name: string;
    content: PageContent;
    traffic: number;
    isWinner?: boolean;
  },
): { next: HMSState; id: string } {
  const created = now();
  const id = newId();
  const variant: StoredVariant = {
    _id: id,
    _creationTime: created,
    entityType: input.entityType,
    entityId: input.entityId,
    name: input.name,
    content: normalizeContent(input.content),
    traffic: input.traffic,
    isWinner: input.isWinner,
    createdBy: actor(state),
  };
  return { next: { ...state, variants: [variant, ...state.variants] }, id };
}

/**
 * Update variant
 */
export function updateVariant(
  state: HMSState,
  id: string,
  patch: Partial<Pick<StoredVariant, "name" | "content" | "traffic" | "isWinner">>,
): HMSState {
  return {
    ...state,
    variants: state.variants.map((variant) =>
      variant._id === id
        ? {
            ...variant,
            ...patch,
            content: patch.content ? normalizeContent(patch.content) : variant.content,
          }
        : variant,
    ),
  };
}

/**
 * Remove variant
 */
export function removeVariant(state: HMSState, id: string): HMSState {
  return { ...state, variants: state.variants.filter((variant) => variant._id !== id) };
}

/**
 * Update site
 */
export function updateSite(
  state: HMSState,
  patch: Partial<Pick<StoredSite, "name" | "domain" | "description" | "logo" | "settings">>,
): HMSState {
  return {
    ...state,
    site: {
      ...state.site,
      ...patch,
      settings: patch.settings
        ? { ...state.site.settings, ...patch.settings }
        : state.site.settings,
    },
  };
}

export const STORAGE_KEY = "hms.v1";

/**
 * Load state
 * @param storage - localStorage-like store
 * @returns Parsed state or a seed if none exists
 */
export function loadState(storage: Pick<Storage, "getItem">): HMSState {
  const raw = storage.getItem(STORAGE_KEY);
  if (!raw) return seedState();
  try {
    const parsed = JSON.parse(raw) as HMSState;
    if (!parsed?.site || !Array.isArray(parsed.pages)) return seedState();
    return parsed;
  } catch {
    return seedState();
  }
}

/**
 * Save state
 */
export function saveState(storage: Pick<Storage, "setItem">, state: HMSState): void {
  storage.setItem(STORAGE_KEY, JSON.stringify(state));
}
