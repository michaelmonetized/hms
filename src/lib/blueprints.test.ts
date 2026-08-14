import { describe, expect, test } from "vite-plus/test";
import {
  createContentField,
  defaultBlueprintTree,
  encodeTerms,
  modeForKind,
  parseTerms,
  pickTemplate,
} from "./blueprints";
import { createBlock } from "./content";
import {
  addBlueprint,
  addContentType,
  addEntry,
  addPage,
  emptyState,
  ensureThemeTemplates,
  seedState,
} from "./store";

describe("blueprints", () => {
  test("maps kind to a builder mode", () => {
    expect(modeForKind("form")).toBe("form");
    expect(modeForKind("loop-item")).toBe("loop-item");
    expect(modeForKind("template")).toBe("template");
    expect(modeForKind("component")).toBe("component");
  });

  test("form starter is a form with fields", () => {
    const tree = defaultBlueprintTree("form");
    expect(tree[0].type).toBe("form");
    expect(tree[0].children?.every((child) => child.type === "field")).toBe(true);
  });

  test("theme surfaces start with the right blocks", () => {
    expect(defaultBlueprintTree("template", "header").some((block) => block.type === "menu")).toBe(
      true,
    );
    expect(defaultBlueprintTree("template", "404")[0].content.title).toBe("Not found");
    expect(
      defaultBlueprintTree("template", "product-single").some(
        (block) => block.type === "add-to-cart",
      ),
    ).toBe(true);
  });

  test("single templates include the document body slot", () => {
    const tree = defaultBlueprintTree("template", "post-single");
    expect(tree.some((block) => block.type === "document-content")).toBe(true);
  });

  test("picks the template for a surface and type", () => {
    const archive = { kind: "template" as const, appliesTo: "post-archive" as const };
    const typed = {
      kind: "template" as const,
      appliesTo: "entry-single" as const,
      contentTypeId: "t1",
    };
    expect(pickTemplate([archive, typed], "post-archive")?.appliesTo).toBe("post-archive");
    expect(pickTemplate([archive, typed], "entry-single", "t1")).toEqual(typed);
    expect(pickTemplate([archive, typed], "entry-single", "missing")).toBeUndefined();
  });

  test("slugs a content field key", () => {
    expect(createContentField({ label: "Client Name" }).key).toBe("client_name");
  });

  test("round-trips terms", () => {
    expect(parseTerms("saas, agency")).toEqual(["saas", "agency"]);
    expect(encodeTerms(["saas", " agency ", ""])).toBe("saas,agency");
  });
});

describe("library store", () => {
  test("creates a form blueprint with a field tree", () => {
    const { next, id } = addBlueprint(emptyState(), { name: "Lead", kind: "form" });
    const blueprint = next.blueprints.find((item) => item._id === id);
    expect(blueprint?.kind).toBe("form");
    expect(blueprint?.content.blocks[0].type).toBe("form");
  });

  test("seeds blog templates and a content type", () => {
    const state = seedState();
    expect(state.blueprints.some((item) => item.appliesTo === "post-single")).toBe(true);
    expect(state.blueprints.some((item) => item.appliesTo === "post-archive")).toBe(true);
    expect(state.contentTypes.some((item) => item.slug === "work")).toBe(true);
    expect(state.entries.some((item) => item.slug === "brochure")).toBe(true);
    expect(state.blueprints.some((item) => item.appliesTo === "header")).toBe(true);
    expect(state.blueprints.some((item) => item.appliesTo === "product-single")).toBe(true);
  });

  test("ensureThemeTemplates adds missing surfaces without wiping pages", () => {
    const started = addPage(emptyState(), { title: "About" });
    const next = ensureThemeTemplates(started.next);
    expect(next.pages).toHaveLength(1);
    expect(next.blueprints.some((item) => item.appliesTo === "header")).toBe(true);
    expect(next.blueprints.some((item) => item.appliesTo === "product-archive")).toBe(true);
    const again = ensureThemeTemplates(next);
    expect(again.blueprints.filter((item) => item.appliesTo === "header")).toHaveLength(1);
  });

  test("rejects a duplicate entry slug inside a type", () => {
    const type = addContentType(emptyState(), { name: "Work", slug: "work" });
    const first = addEntry(type.next, { contentTypeId: type.id, title: "One", slug: "one" });
    expect(() =>
      addEntry(first.next, { contentTypeId: type.id, title: "Two", slug: "one" }),
    ).toThrow(/slug/i);
  });
});

describe("createBlock form", () => {
  test("builds a form with three field children", () => {
    const form = createBlock("form");
    expect(form.children).toHaveLength(3);
    expect(form.children?.map((child) => child.content.fieldType)).toEqual([
      "text",
      "email",
      "textarea",
    ]);
  });
});
