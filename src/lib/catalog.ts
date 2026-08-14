import type { BlockType, BuilderMode } from "./content";

export type CatalogItem = {
  type: Exclude<BlockType, "column">;
  label: string;
  hint: string;
  keywords?: string;
};

export type CatalogGroup = {
  id: string;
  label: string;
  items: CatalogItem[];
};

export const CATALOG: CatalogGroup[] = [
  {
    id: "basics",
    label: "Basics",
    items: [
      { type: "heading", label: "Heading", hint: "H1–H3", keywords: "title h1 h2 h3" },
      { type: "text", label: "Text", hint: "Body copy", keywords: "paragraph copy body" },
      { type: "button", label: "Button", hint: "Link or action", keywords: "cta link" },
      { type: "quote", label: "Quote", hint: "Pull quote", keywords: "blockquote cite" },
      { type: "divider", label: "Divider", hint: "Hairline rule", keywords: "separator hr" },
      { type: "spacer", label: "Spacer", hint: "Vertical room", keywords: "gap space" },
      { type: "html", label: "HTML", hint: "Embed or tokens", keywords: "embed code custom" },
      { type: "form", label: "Form", hint: "Fields you design", keywords: "contact lead email" },
      { type: "field", label: "Field", hint: "Form input", keywords: "input email textarea" },
      {
        type: "component",
        label: "Component",
        hint: "Saved blueprint",
        keywords: "global reusable",
      },
      {
        type: "document-content",
        label: "Document body",
        hint: "The entry or post blocks",
        keywords: "content the_content body",
      },
      { type: "menu", label: "Menu", hint: "Site navigation", keywords: "nav header links" },
      { type: "search", label: "Search", hint: "Find posts and entries", keywords: "find query" },
      { type: "add-to-cart", label: "Add to cart", hint: "Current product", keywords: "buy shop" },
      { type: "cart", label: "Cart", hint: "Lines and total", keywords: "basket checkout" },
    ],
  },
  {
    id: "media",
    label: "Media",
    items: [
      { type: "image", label: "Image", hint: "Single still", keywords: "photo picture" },
      { type: "video", label: "Video", hint: "File or YouTube", keywords: "youtube vimeo" },
      { type: "gallery", label: "Image gallery", hint: "Grid of stills", keywords: "photos" },
      { type: "video-gallery", label: "Video gallery", hint: "Row of clips", keywords: "videos" },
    ],
  },
  {
    id: "layout",
    label: "Layout",
    items: [
      {
        type: "section",
        label: "Section",
        hint: "Full-width container",
        keywords: "container wrap",
      },
      { type: "hero", label: "Hero", hint: "Title, dek, action", keywords: "banner splash" },
      { type: "cta", label: "Call to action", hint: "Closing band", keywords: "banner convert" },
      { type: "columns", label: "Columns", hint: "2–4 tracks", keywords: "grid row" },
      { type: "features", label: "Features", hint: "Three points", keywords: "benefits" },
    ],
  },
  {
    id: "proof",
    label: "Proof",
    items: [
      { type: "stats", label: "Stats", hint: "Numbers in a row", keywords: "metrics numbers" },
      { type: "testimonials", label: "Testimonials", hint: "Quotes", keywords: "reviews social" },
      { type: "faq", label: "FAQ", hint: "Q and A", keywords: "questions accordion" },
      { type: "pricing", label: "Pricing", hint: "Plan cards", keywords: "plans cost" },
      { type: "logos", label: "Logo row", hint: "Names or marks", keywords: "brands clients" },
    ],
  },
  {
    id: "dynamic",
    label: "Dynamic views",
    items: [
      {
        type: "collection",
        label: "Collection",
        hint: "A grid, table, carousel, or list — optionally painted by a loop item",
        keywords: "loop query archive posts products listing grid",
      },
    ],
  },
];

/**
 * Search catalog
 * Filters widget groups by label, type, hint, or keywords.
 */
export function searchCatalog(query: string): CatalogGroup[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return CATALOG;
  return CATALOG.map((group) => ({
    ...group,
    items: group.items.filter((item) =>
      [item.label, item.hint, item.type, item.keywords ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(needle),
    ),
  })).filter((group) => group.items.length > 0);
}

export function catalogItem(type: BlockType): CatalogItem | undefined {
  return CATALOG.flatMap((group) => group.items).find((item) => item.type === type);
}

const MODE_ALLOW: Record<BuilderMode, ReadonlySet<BlockType> | null> = {
  page: new Set(
    CATALOG.flatMap((group) => group.items.map((item) => item.type)).filter(
      (type) => type !== "field" && type !== "document-content",
    ),
  ),
  component: new Set(
    CATALOG.flatMap((group) => group.items.map((item) => item.type)).filter(
      (type) => type !== "field" && type !== "document-content",
    ),
  ),
  form: new Set([
    "form",
    "field",
    "heading",
    "text",
    "button",
    "columns",
    "section",
    "spacer",
    "divider",
  ]),
  "loop-item": new Set([
    "heading",
    "text",
    "image",
    "button",
    "html",
    "divider",
    "spacer",
    "quote",
    "add-to-cart",
  ]),
  template: null,
};

/**
 * Catalog for mode
 * Restricts the widget library to what that builder can place.
 */
export function catalogFor(mode: BuilderMode): CatalogGroup[] {
  const allow = MODE_ALLOW[mode];
  if (!allow) return CATALOG;
  return CATALOG.map((group) => ({
    ...group,
    items: group.items.filter((item) => allow.has(item.type)),
  })).filter((group) => group.items.length > 0);
}
