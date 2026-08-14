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
  "html",
  "form",
  "field",
  "component",
  "document-content",
  "hero",
  "cta",
  "section",
  "features",
  "columns",
  "column",
  "stats",
  "testimonials",
  "faq",
  "pricing",
  "logos",
  "collection",
  "menu",
  "search",
  "add-to-cart",
  "cart",
] as const;

export type BlockType = (typeof BLOCK_TYPES)[number];

export type CollectionSource = string;
export type CollectionLayout = "grid" | "table" | "carousel" | "gallery" | "list";
export type Breakpoint = "desktop" | "tablet" | "mobile";
export type VisibilityWhen = "always" | "logged-in" | "logged-out" | "query" | "never";
export type CompareOp =
  | "eq"
  | "neq"
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "contains"
  | "empty"
  | "not-empty";
export type VisibilityOp =
  | "always"
  | "never"
  | "logged-in"
  | "logged-out"
  | "role"
  | "query"
  | "referrer"
  | "cookie"
  | "schedule"
  | "field"
  | "device";
export type CollectionSort =
  | "date-desc"
  | "date-asc"
  | "title-asc"
  | "title-desc"
  | "field-asc"
  | "field-desc";
export type FormActionType = "none" | "email" | "create-entry" | "redirect";
export type FormFieldType =
  | "text"
  | "email"
  | "textarea"
  | "select"
  | "checkbox"
  | "number"
  | "url";

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
  fieldType?: FormFieldType;
  required?: boolean;
  placeholder?: string;
  blueprintId?: string;
  loopItemId?: string;
  sort?: CollectionSort;
  sortField?: string;
  filterField?: string;
  filterCompare?: CompareOp;
  filterValue?: string;
  excludeCurrent?: boolean;
  relatedField?: string;
  offset?: number;
  paginate?: boolean;
  searchParam?: string;
  emptyTitle?: string;
  emptyBody?: string;
  loadMore?: boolean;
  facetField?: string;
  formAction?: FormActionType;
  formTarget?: string;
  formRedirect?: string;
  showWhenField?: string;
  showWhenValue?: string;
};

export type BlockStyle = {
  paddingTop?: number;
  paddingRight?: number;
  paddingBottom?: number;
  paddingLeft?: number;
  marginTop?: number;
  marginBottom?: number;
  background?: string;
  color?: string;
  maxWidth?: number;
  align?: "left" | "center" | "right";
  fontSize?: number;
};

export type VisibilityCondition = {
  op: VisibilityOp;
  key?: string;
  value?: string;
  compare?: CompareOp;
  from?: string;
  to?: string;
};

export type VisibilityRule = {
  when?: VisibilityWhen;
  queryKey?: string;
  queryValue?: string;
  hideOn?: Breakpoint[];
  match?: "all" | "any";
  conditions?: VisibilityCondition[];
  fallback?: string;
};

export type DynamicBindings = Partial<Record<string, string>>;

export type Block = {
  id: string;
  type: BlockType;
  content: BlockContent;
  children?: Block[];
  style?: BlockStyle;
  visibility?: VisibilityRule;
  bindings?: DynamicBindings;
  htmlId?: string;
  cssClass?: string;
  hidden?: boolean;
  locked?: boolean;
};

export type BlockLocation = {
  block: Block;
  parentId: string | null;
  index: number;
};

export type FlatNode = {
  id: string;
  type: BlockType;
  parentId: string | null;
  index: number;
  depth: number;
  label: string;
  hidden?: boolean;
  locked?: boolean;
  childCount: number;
};

export const CONTAINER_TYPES: ReadonlySet<BlockType> = new Set(["section", "column", "form"]);

export type BuilderMode = "page" | "form" | "component" | "loop-item" | "template";

export type PageContent = {
  blocks: Block[];
};

export const RESERVED_SLUGS = new Set([
  "blog",
  "shop",
  "sign-in",
  "manage",
  "media",
  "settings",
  "search",
  "cart",
]);

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
  html: { body: "<p>Custom HTML. Tokens like {{site.name}} work here.</p>" },
  form: {
    title: "Get in touch",
    subtitle: "We reply the same day.",
    buttonText: "Send",
  },
  field: { title: "Name", fieldType: "text", placeholder: "", required: false },
  component: { title: "Component", blueprintId: "" },
  "document-content": { title: "Document body" },
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
  section: { title: "" },
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
    loopItemId: "",
  },
  menu: { title: "" },
  search: { title: "Search", placeholder: "Search…" },
  "add-to-cart": { buttonText: "Add to cart" },
  cart: { title: "Cart" },
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
  if (type === "section") {
    block.children = [];
  }
  if (type === "form") {
    block.children = [
      fieldBlock("Name", "text"),
      fieldBlock("Email", "email"),
      fieldBlock("Message", "textarea"),
    ];
  }
  return block;
}

function fieldBlock(title: string, fieldType: FormFieldType): Block {
  return {
    id: newId(),
    type: "field",
    content: { title, fieldType, placeholder: "", required: fieldType !== "checkbox" },
  };
}

function cloneStyle(style?: BlockStyle): BlockStyle | undefined {
  return style ? { ...style } : undefined;
}

function cloneVisibility(rule?: VisibilityRule): VisibilityRule | undefined {
  if (!rule) return undefined;
  return { ...rule, hideOn: rule.hideOn?.slice() };
}

/**
 * Clone block
 * Deep-copies a block and assigns fresh ids to it and every descendant.
 */
export function cloneBlock(block: Block): Block {
  return {
    ...block,
    id: newId(),
    content: cloneContent(block.content),
    style: cloneStyle(block.style),
    visibility: cloneVisibility(block.visibility),
    bindings: block.bindings ? { ...block.bindings } : undefined,
    children: block.children?.map(cloneBlock),
  };
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
    style: raw.style && typeof raw.style === "object" ? raw.style : undefined,
    visibility: raw.visibility && typeof raw.visibility === "object" ? raw.visibility : undefined,
    bindings: raw.bindings && typeof raw.bindings === "object" ? raw.bindings : undefined,
    htmlId: typeof raw.htmlId === "string" ? raw.htmlId : undefined,
    cssClass: typeof raw.cssClass === "string" ? raw.cssClass : undefined,
    hidden: raw.hidden === true ? true : undefined,
    locked: raw.locked === true ? true : undefined,
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
 * Locate block
 * Returns the block plus its parent id and sibling index.
 */
export function locateBlock(
  blocks: Block[],
  id: string,
  parentId: string | null = null,
): BlockLocation | null {
  for (let index = 0; index < blocks.length; index += 1) {
    const block = blocks[index];
    if (block.id === id) return { block, parentId, index };
    if (block.children) {
      const nested = locateBlock(block.children, id, block.id);
      if (nested) return nested;
    }
  }
  return null;
}

/**
 * Find path
 * Root-to-leaf ancestors of the matching block, including itself.
 */
export function findPath(blocks: Block[], id: string): Block[] {
  for (const block of blocks) {
    if (block.id === id) return [block];
    if (block.children) {
      const nested = findPath(block.children, id);
      if (nested.length > 0) return [block, ...nested];
    }
  }
  return [];
}

/**
 * Block label
 * Short label for navigator, breadcrumbs, and finder.
 */
export function blockLabel(block: Block): string {
  const copy = block.content.title || block.content.buttonText || block.content.body;
  if (copy) {
    const clipped = copy.replace(/\s+/g, " ").trim().slice(0, 32);
    if (clipped.length > 0) return clipped;
  }
  return block.type.replaceAll("-", " ");
}

/**
 * Flatten tree
 * Depth-first list used by the navigator and keyboard movement.
 */
export function flattenTree(
  blocks: Block[],
  parentId: string | null = null,
  depth = 0,
): FlatNode[] {
  const nodes: FlatNode[] = [];
  blocks.forEach((block, index) => {
    nodes.push({
      id: block.id,
      type: block.type,
      parentId,
      index,
      depth,
      label: blockLabel(block),
      hidden: block.hidden,
      locked: block.locked,
      childCount: block.children?.length ?? 0,
    });
    if (block.children) {
      nodes.push(...flattenTree(block.children, block.id, depth + 1));
    }
  });
  return nodes;
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
 * Patch block
 * Merges any block fields except id. Content is shallow-merged.
 */
export function patchBlock(
  blocks: Block[],
  id: string,
  patch: Partial<Omit<Block, "id">>,
): Block[] {
  return blocks.map((block) => {
    if (block.id === id) {
      return {
        ...block,
        ...patch,
        content: patch.content ? { ...block.content, ...patch.content } : block.content,
      };
    }
    if (block.children) {
      return { ...block, children: patchBlock(block.children, id, patch) };
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
export function publicPath(
  kind: "page" | "post" | "product" | "entry",
  slug: string,
  typeSlug?: string,
): string {
  const normalized = normalizeSlug(slug);
  if (kind === "page") return normalized === "home" ? "/" : `/${normalized}`;
  if (kind === "post") return `/blog/${normalized}`;
  if (kind === "entry") return `/${normalizeSlug(typeSlug ?? "entries")}/${normalized}`;
  return `/shop/${normalized}`;
}

/**
 * Manage path
 */
export function managePath(
  kind: "page" | "post" | "product" | "media" | "settings" | "library" | "types",
): string {
  if (kind === "page") return "/manage/pages";
  if (kind === "post") return "/manage/blog";
  if (kind === "product") return "/manage/products";
  if (kind === "media") return "/manage/media";
  if (kind === "library") return "/manage/library";
  if (kind === "types") return "/manage/types";
  return "/manage/settings";
}

/**
 * Relative time
 */
export function relativeTime(timestamp: number): string {
  return formatDistanceToNow(timestamp, { addSuffix: true });
}
