import { formatDistanceToNow } from "date-fns";

export const BLOCK_TYPES = [
  "heading",
  "text",
  "button",
  "divider",
  "spacer",
  "quote",
  "image",
  "video",
  "gallery",
  "video-gallery",
  "hero",
  "cta",
  "features",
  "columns",
  "column",
  "stats",
  "testimonials",
  "faq",
  "pricing",
  "logos",
  "collection",
] as const;

export type BlockType = (typeof BLOCK_TYPES)[number];

export type CollectionSource = "pages" | "posts" | "products" | "media";
export type CollectionLayout = "grid" | "table" | "carousel" | "gallery" | "list";

export type BlockContent = {
  title?: string;
  subtitle?: string;
  body?: string;
  buttonText?: string;
  buttonHref?: string;
  items?: string[];
  url?: string;
  urls?: string[];
  columns?: number;
  source?: CollectionSource;
  layout?: CollectionLayout;
  limit?: number;
  level?: 1 | 2 | 3;
  align?: "left" | "center" | "right";
  background?: string;
};

export type Block = {
  id: string;
  type: BlockType;
  content: BlockContent;
  children?: Block[];
};

export type PageContent = {
  blocks: Block[];
};

export const RESERVED_SLUGS = new Set(["blog", "shop", "sign-in", "manage", "media", "settings"]);

const DEFAULTS: Record<BlockType, BlockContent> = {
  heading: { title: "Section heading", level: 2 },
  text: { body: "Write the story. Keep it short enough to finish." },
  button: { buttonText: "Get started", buttonHref: "/shop" },
  divider: {},
  spacer: {},
  quote: {
    body: "Simplicity is prerequisite for reliability.",
    title: "Edsger W. Dijkstra",
  },
  image: { title: "Image", url: "" },
  video: { title: "Video", url: "" },
  gallery: {
    title: "Gallery",
    urls: [],
  },
  "video-gallery": { title: "Videos", urls: [] },
  hero: {
    title: "Build systems that scale.",
    subtitle: "The site is the editor. Change it. Visitors see it.",
    buttonText: "See the work",
    buttonHref: "/blog",
    align: "center",
  },
  cta: {
    title: "Ready when you are.",
    subtitle: "Publish. The live page updates now.",
    buttonText: "Start",
    buttonHref: "/",
  },
  features: {
    title: "What you get",
    items: ["Live editing on the real page", "Drag-and-drop blocks", "Dynamic views of your data"],
  },
  columns: { columns: 3 },
  column: {},
  stats: {
    title: "Proof",
    items: ["12ms saves", "0 plugins", "1 page, two modes"],
  },
  testimonials: {
    title: "What they said",
    items: ["We shipped the site the same afternoon. — A. Builder"],
  },
  faq: {
    title: "Questions",
    items: ["Can I edit the live page? Yes. Click Edit in the bar."],
  },
  pricing: {
    title: "Pricing",
    items: ["Starter — $0", "Pro — $49/mo", "Agency — talk to us"],
  },
  logos: { title: "Used by", items: ["Studio", "Shop", "Newsroom"] },
  collection: {
    title: "Latest",
    source: "posts",
    layout: "grid",
    limit: 6,
    columns: 3,
  },
};

/**
 * Slugify
 * Turns free text into a URL-safe slug.
 * @param input - Any title or path fragment
 * @returns Lowercase hyphenated slug, or an empty string
 */
export function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/^\//, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Normalize slug
 * Maps home aliases to "home" and slugifies everything else.
 * @param input - Raw slug or path
 * @returns Canonical slug
 */
export function normalizeSlug(input: string): string {
  const slug = slugify(input);
  return slug === "" || slug === "home" || slug === "index" ? "home" : slug;
}

/**
 * New id
 * @returns A unique id for blocks and local records
 */
export function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function cloneContent(content: BlockContent): BlockContent {
  return {
    ...content,
    items: content.items?.slice(),
    urls: content.urls?.slice(),
  };
}

/**
 * Create block
 * @param type - Block type to create
 * @returns A new block with default copy for that type
 */
export function createBlock(type: BlockType): Block {
  const block: Block = {
    id: newId(),
    type,
    content: cloneContent(DEFAULTS[type] ?? {}),
  };
  if (type === "columns") {
    const count = block.content.columns ?? 3;
    block.children = Array.from({ length: count }, () => ({
      id: newId(),
      type: "column" as const,
      content: {},
      children: [],
    }));
  }
  return block;
}

function normalizeBlock(value: unknown): Block | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Block;
  if (typeof raw.id !== "string" || !BLOCK_TYPES.includes(raw.type as BlockType)) return null;
  const children = Array.isArray(raw.children)
    ? raw.children.map(normalizeBlock).filter((block): block is Block => block !== null)
    : undefined;
  return {
    id: raw.id,
    type: raw.type,
    content: raw.content && typeof raw.content === "object" ? raw.content : {},
    children,
  };
}

/**
 * Normalize content
 * Accepts a stored page/post document, a raw block array, or junk.
 * @param content - Unknown stored content
 * @returns A { blocks } document
 */
export function normalizeContent(content: unknown): PageContent {
  if (Array.isArray(content)) {
    return {
      blocks: content.map(normalizeBlock).filter((block): block is Block => block !== null),
    };
  }
  if (content && typeof content === "object" && "blocks" in content) {
    const blocks = (content as { blocks: unknown }).blocks;
    if (Array.isArray(blocks)) {
      return {
        blocks: blocks.map(normalizeBlock).filter((block): block is Block => block !== null),
      };
    }
  }
  return { blocks: [] };
}

/**
 * Find block
 * Walks the tree and returns the first match.
 */
export function findBlock(blocks: Block[], id: string): Block | null {
  for (const block of blocks) {
    if (block.id === id) return block;
    if (block.children) {
      const nested = findBlock(block.children, id);
      if (nested) return nested;
    }
  }
  return null;
}

/**
 * Update block tree
 * Patches content on the matching block.
 */
export function updateBlockTree(
  blocks: Block[],
  id: string,
  patch: Partial<BlockContent>,
): Block[] {
  return blocks.map((block) => {
    if (block.id === id) {
      return { ...block, content: { ...block.content, ...patch } };
    }
    if (block.children) {
      return { ...block, children: updateBlockTree(block.children, id, patch) };
    }
    return block;
  });
}

/**
 * Remove block tree
 * Drops a block anywhere in the tree.
 */
export function removeBlockTree(blocks: Block[], id: string): Block[] {
  return blocks
    .filter((block) => block.id !== id)
    .map((block) =>
      block.children ? { ...block, children: removeBlockTree(block.children, id) } : block,
    );
}

function extractBlock(blocks: Block[], id: string): { next: Block[]; taken: Block | null } {
  let taken: Block | null = null;
  const next: Block[] = [];
  for (const block of blocks) {
    if (block.id === id) {
      taken = block;
      continue;
    }
    if (block.children && !taken) {
      const nested = extractBlock(block.children, id);
      next.push({ ...block, children: nested.next });
      taken = nested.taken;
      continue;
    }
    if (block.children) {
      next.push({ ...block, children: extractBlock(block.children, id).next });
      continue;
    }
    next.push(block);
  }
  return { next, taken };
}

/**
 * Insert block tree
 * Places a block at index under parentId. Null parent is the root.
 */
export function insertBlockTree(
  blocks: Block[],
  parentId: string | null,
  index: number,
  incoming: Block,
): Block[] {
  if (!parentId) {
    const next = [...blocks];
    next.splice(Math.max(0, Math.min(index, next.length)), 0, incoming);
    return next;
  }
  return blocks.map((block) => {
    if (block.id === parentId) {
      const children = [...(block.children ?? [])];
      children.splice(Math.max(0, Math.min(index, children.length)), 0, incoming);
      return { ...block, children };
    }
    if (block.children) {
      return { ...block, children: insertBlockTree(block.children, parentId, index, incoming) };
    }
    return block;
  });
}

function containsBlock(block: Block, id: string): boolean {
  if (block.id === id) return true;
  return Boolean(block.children?.some((child) => containsBlock(child, id)));
}

/**
 * Move block tree
 * Extracts a block and inserts it at the new parent/index.
 */
export function moveBlockTree(
  blocks: Block[],
  id: string,
  parentId: string | null,
  index: number,
): Block[] {
  const extracted = extractBlock(blocks, id);
  if (!extracted.taken) return blocks;
  if (parentId && containsBlock(extracted.taken, parentId)) return blocks;
  return insertBlockTree(extracted.next, parentId, index, extracted.taken);
}

type VariantLike = {
  name?: string;
  traffic: number;
  content: unknown;
  isWinner?: boolean;
};

/**
 * Pick variant
 * Uses a named variant, then a declared winner, then weighted traffic.
 */
export function pickVariant<T extends VariantLike>(
  variants: T[],
  fallback: unknown,
  name?: string,
): unknown {
  if (variants.length === 0) return fallback;
  if (name) {
    const named = variants.find((variant) => variant.name === name);
    if (named) return named.content;
  }
  const winner = variants.find((variant) => variant.isWinner);
  if (winner) return winner.content;
  if (variants.length === 1) return variants[0].content;

  const total = variants.reduce((sum, variant) => sum + Math.max(0, variant.traffic), 0);
  if (total <= 0) return variants[0].content;
  let cursor = Math.random() * total;
  for (const variant of variants) {
    cursor -= Math.max(0, variant.traffic);
    if (cursor <= 0) return variant.content;
  }
  return variants[0].content;
}

/**
 * Format price
 */
export function formatPrice(cents: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(cents / 100);
}

/**
 * Format bytes
 */
export function formatBytes(size: number): string {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Public path
 * Visitor-facing URL. The site lives at the root.
 */
export function publicPath(kind: "page" | "post" | "product", slug: string): string {
  const normalized = normalizeSlug(slug);
  if (kind === "page") return normalized === "home" ? "/" : `/${normalized}`;
  if (kind === "post") return `/blog/${normalized}`;
  return `/shop/${normalized}`;
}

/**
 * Manage path
 */
export function managePath(kind: "page" | "post" | "product" | "media" | "settings"): string {
  if (kind === "page") return "/manage/pages";
  if (kind === "post") return "/manage/blog";
  if (kind === "product") return "/manage/products";
  if (kind === "media") return "/manage/media";
  return "/manage/settings";
}

/**
 * Relative time
 */
export function relativeTime(timestamp: number): string {
  return formatDistanceToNow(timestamp, { addSuffix: true });
}
