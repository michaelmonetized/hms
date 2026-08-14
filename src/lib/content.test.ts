import { describe, expect, test } from "vite-plus/test";
import {
  createBlock,
  insertBlockTree,
  moveBlockTree,
  normalizeContent,
  normalizeSlug,
  publicPath,
  removeBlockTree,
  slugify,
  pickVariant,
  updateBlockTree,
} from "./content";

describe("slugify", () => {
  test("turns a title into a url slug", () => {
    expect(slugify("Why We Built HMS")).toBe("why-we-built-hms");
  });

  test("strips leading slashes and junk", () => {
    expect(slugify("/About Us!!")).toBe("about-us");
  });

  test("returns empty string when nothing usable remains", () => {
    expect(slugify("***")).toBe("");
  });
});

describe("normalizeSlug", () => {
  test("treats home aliases as home", () => {
    expect(normalizeSlug("/")).toBe("home");
    expect(normalizeSlug("")).toBe("home");
    expect(normalizeSlug("home")).toBe("home");
  });

  test("slugifies any other path", () => {
    expect(normalizeSlug("/About Us")).toBe("about-us");
  });
});

describe("createBlock", () => {
  test("builds a hero with the required fields", () => {
    const block = createBlock("hero");
    expect(block.type).toBe("hero");
    expect(block.content.title).toBeTruthy();
    expect(block.content.subtitle).toBeTruthy();
    expect(block.content.buttonText).toBeTruthy();
  });

  test("builds an image block with a url field", () => {
    const block = createBlock("image");
    expect(block.type).toBe("image");
    expect(block.content).toHaveProperty("url");
  });

  test("builds a columns block with empty column children", () => {
    const block = createBlock("columns");
    expect(block.children).toHaveLength(3);
    expect(block.children?.every((child) => child.type === "column")).toBe(true);
  });
});

describe("block tree", () => {
  test("inserts a block at the root", () => {
    const heading = createBlock("heading");
    const text = createBlock("text");
    const next = insertBlockTree([heading], null, 1, text);
    expect(next.map((block) => block.type)).toEqual(["heading", "text"]);
  });

  test("inserts a block into a column", () => {
    const columns = createBlock("columns");
    const image = createBlock("image");
    const columnId = columns.children?.[0].id ?? "";
    const next = insertBlockTree([columns], columnId, 0, image);
    expect(next[0].children?.[0].children?.[0].type).toBe("image");
  });

  test("updates copy without losing siblings", () => {
    const heading = createBlock("heading");
    const next = updateBlockTree([heading], heading.id, { title: "Hello" });
    expect(next[0].content.title).toBe("Hello");
  });

  test("removes a nested block", () => {
    const columns = createBlock("columns");
    const image = createBlock("image");
    const columnId = columns.children?.[0].id ?? "";
    const withImage = insertBlockTree([columns], columnId, 0, image);
    const next = removeBlockTree(withImage, image.id);
    expect(next[0].children?.[0].children).toEqual([]);
  });

  test("moves a block between columns", () => {
    const columns = createBlock("columns");
    const image = createBlock("image");
    const first = columns.children?.[0].id ?? "";
    const second = columns.children?.[1].id ?? "";
    const inserted = insertBlockTree([columns], first, 0, image);
    const moved = moveBlockTree(inserted, image.id, second, 0);
    expect(moved[0].children?.[0].children).toEqual([]);
    expect(moved[0].children?.[1].children?.[0].id).toBe(image.id);
  });
});

describe("publicPath", () => {
  test("puts the site at the root", () => {
    expect(publicPath("page", "home")).toBe("/");
    expect(publicPath("page", "about")).toBe("/about");
    expect(publicPath("post", "why-hms")).toBe("/blog/why-hms");
    expect(publicPath("product", "pro")).toBe("/shop/pro");
  });
});

describe("normalizeContent", () => {
  test("wraps a raw block array", () => {
    const block = createBlock("heading");
    expect(normalizeContent([block])).toEqual({ blocks: [block] });
  });

  test("returns empty blocks for garbage input", () => {
    expect(normalizeContent(null)).toEqual({ blocks: [] });
    expect(normalizeContent("nope")).toEqual({ blocks: [] });
  });

  test("keeps a valid { blocks } document", () => {
    const block = createBlock("text");
    expect(normalizeContent({ blocks: [block] })).toEqual({ blocks: [block] });
  });
});

describe("pickVariant", () => {
  test("returns fallback content when there are no variants", () => {
    const fallback = { blocks: [createBlock("hero")] };
    expect(pickVariant([], fallback)).toBe(fallback);
  });

  test("picks the only variant", () => {
    const content = { blocks: [createBlock("cta")] };
    expect(pickVariant([{ traffic: 100, content }], { blocks: [] })).toBe(content);
  });

  test("honors a named winner", () => {
    const a = {
      name: "A",
      traffic: 50,
      content: { blocks: [createBlock("hero")] },
      isWinner: false,
    };
    const b = { name: "B", traffic: 50, content: { blocks: [createBlock("cta")] }, isWinner: true };
    expect(pickVariant([a, b], { blocks: [] }, "B")).toBe(b.content);
  });

  test("uses the declared winner when no name is forced", () => {
    const a = { traffic: 90, content: { blocks: [createBlock("hero")] }, isWinner: false };
    const b = { traffic: 10, content: { blocks: [createBlock("cta")] }, isWinner: true };
    expect(pickVariant([a, b], { blocks: [] })).toBe(b.content);
  });
});
