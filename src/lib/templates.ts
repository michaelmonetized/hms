import { createBlock, newId, type Block } from "./content";

export type PageTemplate = {
  id: string;
  label: string;
  hint: string;
  blocks: () => Block[];
};

const SECTIONS_KEY = "hms.builder.sections";

/**
 * Page templates
 * Starter layouts dropped onto an empty canvas.
 */
export const PAGE_TEMPLATES: PageTemplate[] = [
  {
    id: "landing",
    label: "Landing",
    hint: "Hero, proof, posts, close",
    blocks: () => [
      createBlock("hero"),
      createBlock("features"),
      createBlock("stats"),
      createBlock("collection"),
      createBlock("cta"),
    ],
  },
  {
    id: "about",
    label: "About",
    hint: "Story, numbers, quote",
    blocks: () => {
      const heading = createBlock("heading");
      heading.content = { ...heading.content, title: "About {{site.name}}", level: 1 };
      const text = createBlock("text");
      text.content = {
        body: "{{site.description}} We ship the live page. Visitors see it now.",
      };
      return [heading, text, createBlock("stats"), createBlock("quote"), createBlock("cta")];
    },
  },
  {
    id: "pricing",
    label: "Pricing",
    hint: "Plans and questions",
    blocks: () => {
      const hero = createBlock("hero");
      hero.content = {
        ...hero.content,
        title: "Simple pricing.",
        subtitle: "Start free. Upgrade when the hustle pays.",
        buttonText: "Start",
        buttonHref: "/shop",
      };
      return [hero, createBlock("pricing"), createBlock("faq"), createBlock("cta")];
    },
  },
  {
    id: "story",
    label: "Long read",
    hint: "Heading, columns, media",
    blocks: () => {
      const heading = createBlock("heading");
      heading.content = { title: "{{doc.title}}", level: 1 };
      const columns = createBlock("columns");
      columns.content = { ...columns.content, columns: 2 };
      columns.children = columns.children?.slice(0, 2);
      const left = createBlock("text");
      const right = createBlock("image");
      if (columns.children?.[0]) columns.children[0].children = [left];
      if (columns.children?.[1]) columns.children[1].children = [right];
      return [heading, columns, createBlock("quote")];
    },
  },
];

export type SavedSection = {
  id: string;
  name: string;
  block: Block;
  createdAt: number;
};

/**
 * List saved sections
 */
export function listSavedSections(): SavedSection[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(SECTIONS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SavedSection[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Save section
 */
export function saveSection(name: string, block: Block): SavedSection {
  const entry: SavedSection = {
    id: newId(),
    name: name.trim() || block.type,
    block,
    createdAt: Date.now(),
  };
  const next = [entry, ...listSavedSections()].slice(0, 40);
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(SECTIONS_KEY, JSON.stringify(next));
  }
  return entry;
}

/**
 * Remove saved section
 */
export function removeSavedSection(id: string): SavedSection[] {
  const next = listSavedSections().filter((item) => item.id !== id);
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(SECTIONS_KEY, JSON.stringify(next));
  }
  return next;
}
