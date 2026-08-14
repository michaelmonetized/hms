import type { BlockType } from "./content";

export type CatalogItem = {
  type: Exclude<BlockType, "column">;
  label: string;
  hint: string;
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
      { type: "heading", label: "Heading", hint: "H1–H3" },
      { type: "text", label: "Text", hint: "Body copy" },
      { type: "button", label: "Button", hint: "Link or action" },
      { type: "quote", label: "Quote", hint: "Pull quote" },
      { type: "divider", label: "Divider", hint: "Hairline rule" },
      { type: "spacer", label: "Spacer", hint: "Vertical room" },
    ],
  },
  {
    id: "media",
    label: "Media",
    items: [
      { type: "image", label: "Image", hint: "Single still" },
      { type: "video", label: "Video", hint: "File or YouTube" },
      { type: "gallery", label: "Image gallery", hint: "Grid of stills" },
      { type: "video-gallery", label: "Video gallery", hint: "Row of clips" },
    ],
  },
  {
    id: "layout",
    label: "Layout",
    items: [
      { type: "hero", label: "Hero", hint: "Title, dek, action" },
      { type: "cta", label: "Call to action", hint: "Closing band" },
      { type: "columns", label: "Columns", hint: "2–4 tracks" },
      { type: "features", label: "Features", hint: "Three points" },
    ],
  },
  {
    id: "proof",
    label: "Proof",
    items: [
      { type: "stats", label: "Stats", hint: "Numbers in a row" },
      { type: "testimonials", label: "Testimonials", hint: "Quotes" },
      { type: "faq", label: "FAQ", hint: "Q and A" },
      { type: "pricing", label: "Pricing", hint: "Plan cards" },
      { type: "logos", label: "Logo row", hint: "Names or marks" },
    ],
  },
  {
    id: "dynamic",
    label: "Dynamic views",
    items: [
      {
        type: "collection",
        label: "Collection",
        hint: "Pages, posts, products, or media as a grid, table, carousel, or gallery",
      },
    ],
  },
];
