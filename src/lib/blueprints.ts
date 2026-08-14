import { createBlock, newId, type Block, type BuilderMode, type PageContent } from "./content";

export const BLUEPRINT_KINDS = ["component", "form", "loop-item", "template"] as const;
export type BlueprintKind = (typeof BLUEPRINT_KINDS)[number];

export const TEMPLATE_SURFACES = [
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
] as const;
export type TemplateSurface = (typeof TEMPLATE_SURFACES)[number];

export type ContentFieldType =
  | "text"
  | "rich"
  | "image"
  | "url"
  | "number"
  | "date"
  | "relation"
  | "repeater"
  | "terms";

export type ContentField = {
  id: string;
  key: string;
  label: string;
  type: ContentFieldType;
  relationTypeId?: string;
  repeaterFields?: ContentField[];
  options?: string[];
};

/**
 * Mode for kind
 * Which live-editor catalog a blueprint opens with.
 */
export function modeForKind(kind: BlueprintKind): BuilderMode {
  if (kind === "form") return "form";
  if (kind === "loop-item") return "loop-item";
  if (kind === "template") return "template";
  return "component";
}

/**
 * Default tree
 * Starter blocks for a new blueprint.
 */
export function defaultBlueprintTree(kind: BlueprintKind, surface?: TemplateSurface): Block[] {
  if (kind === "form") return [createBlock("form")];
  if (kind === "loop-item") {
    const heading = createBlock("heading");
    heading.content = { title: "{{doc.title}}", level: 3 };
    const text = createBlock("text");
    text.content = { body: "{{doc.excerpt}}" };
    const image = createBlock("image");
    image.bindings = { url: "{{doc.image}}" };
    return [image, heading, text];
  }
  if (kind === "template" && surface === "post-archive") {
    const heading = createBlock("heading");
    heading.content = { title: "Blog", level: 1 };
    const collection = createBlock("collection");
    collection.content = {
      ...collection.content,
      source: "posts",
      layout: "grid",
      limit: 9,
      columns: 3,
    };
    return [heading, collection];
  }
  if (kind === "template" && (surface === "post-single" || surface === "entry-single")) {
    const heading = createBlock("heading");
    heading.content = { title: "{{doc.title}}", level: 1 };
    const dek = createBlock("text");
    dek.content = { body: "{{doc.excerpt}}" };
    return [heading, dek, createBlock("document-content")];
  }
  if (kind === "template" && surface === "entry-archive") {
    const heading = createBlock("heading");
    heading.content = { title: "{{doc.title}}", level: 1 };
    const collection = createBlock("collection");
    collection.content = { ...collection.content, source: "entries", layout: "grid", limit: 12 };
    return [heading, collection];
  }
  if (kind === "template" && surface === "header") {
    const name = createBlock("heading");
    name.content = { title: "{{site.name}}", level: 3 };
    return [name, createBlock("menu"), createBlock("search")];
  }
  if (kind === "template" && surface === "footer") {
    const text = createBlock("text");
    text.content = { body: "© {{year}} {{site.name}}" };
    return [text, createBlock("cart")];
  }
  if (kind === "template" && surface === "404") {
    const heading = createBlock("heading");
    heading.content = { title: "Not found", level: 1 };
    const text = createBlock("text");
    text.content = { body: "That page is gone. Try search, or go home." };
    const button = createBlock("button");
    button.content = { buttonText: "Home", buttonHref: "/" };
    return [heading, text, button];
  }
  if (kind === "template" && surface === "search") {
    const heading = createBlock("heading");
    heading.content = { title: "Search", level: 1 };
    const collection = createBlock("collection");
    collection.content = {
      ...collection.content,
      source: "posts",
      layout: "list",
      limit: 12,
      searchParam: "q",
    };
    return [heading, createBlock("search"), collection];
  }
  if (kind === "template" && surface === "product-archive") {
    const heading = createBlock("heading");
    heading.content = { title: "Shop", level: 1 };
    const collection = createBlock("collection");
    collection.content = {
      ...collection.content,
      source: "products",
      layout: "grid",
      limit: 12,
      columns: 3,
      searchParam: "q",
      loadMore: true,
    };
    return [heading, collection];
  }
  if (kind === "template" && surface === "product-single") {
    const heading = createBlock("heading");
    heading.content = { title: "{{doc.title}}", level: 1 };
    const price = createBlock("text");
    price.content = { body: "{{doc.price}}" };
    return [heading, price, createBlock("add-to-cart"), createBlock("document-content")];
  }
  const hero = createBlock("hero");
  return [hero, createBlock("text")];
}

/**
 * Pick template
 * First matching published-ready blueprint for a surface (and optional type).
 */
export function pickTemplate<
  T extends { kind: BlueprintKind; appliesTo?: TemplateSurface; contentTypeId?: string },
>(blueprints: T[], surface: TemplateSurface, contentTypeId?: string): T | undefined {
  return blueprints.find((item) => {
    if (item.kind !== "template") return false;
    if (item.appliesTo !== surface) return false;
    if (contentTypeId) return item.contentTypeId === contentTypeId;
    return !item.contentTypeId;
  });
}

/**
 * New content field
 */
export function createContentField(
  input: {
    key?: string;
    label: string;
    type?: ContentFieldType;
    options?: string[];
    relationTypeId?: string;
  } = { label: "Field" },
): ContentField {
  const label = input.label.trim() || "Field";
  return {
    id: newId(),
    key: (input.key ?? label)
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_"),
    label,
    type: input.type ?? "text",
    options: input.options,
    relationTypeId: input.relationTypeId,
  };
}

export function emptyPageContent(blocks: Block[] = []): PageContent {
  return { blocks };
}

/**
 * Parse relation ids
 * Comma-separated entry ids stored on a relation field.
 */
export function parseRelationIds(raw?: string): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function encodeRelationIds(ids: string[]): string {
  return ids.filter(Boolean).join(",");
}

/**
 * Parse repeater
 * JSON array of row maps. Junk becomes [].
 */
export function parseRepeater(raw?: string): Record<string, string>[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((row) => row && typeof row === "object")
      .map((row) => {
        const next: Record<string, string> = {};
        for (const [key, value] of Object.entries(row as Record<string, unknown>)) {
          next[key] =
            typeof value === "string" || typeof value === "number" || typeof value === "boolean"
              ? String(value)
              : "";
        }
        return next;
      });
  } catch {
    return [];
  }
}

export function encodeRepeater(rows: Record<string, string>[]): string {
  return JSON.stringify(rows);
}

/**
 * Parse terms
 * Comma-separated tags on a terms field.
 */
export function parseTerms(raw?: string): string[] {
  return parseRelationIds(raw);
}

export function encodeTerms(terms: string[]): string {
  return encodeRelationIds(terms.map((term) => term.trim()).filter(Boolean));
}

export type RelationRef = { id: string; title: string; slug?: string; href?: string };

/**
 * Decorate entry fields
 * Turns stored strings into repeaters and related refs for tokens and loops.
 */
export function decorateEntryFields(
  fields: Record<string, string>,
  typeFields: ContentField[],
  resolveRelation: (id: string) => RelationRef | undefined,
): {
  repeaters: Record<string, Record<string, string>[]>;
  relations: Record<string, RelationRef[]>;
} {
  const repeaters: Record<string, Record<string, string>[]> = {};
  const relations: Record<string, RelationRef[]> = {};
  for (const field of typeFields) {
    if (field.type === "repeater") {
      repeaters[field.key] = parseRepeater(fields[field.key]);
    }
    if (field.type === "relation") {
      relations[field.key] = parseRelationIds(fields[field.key]).map(
        (id) => resolveRelation(id) ?? { id, title: id },
      );
    }
  }
  return { repeaters, relations };
}
