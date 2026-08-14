import { describe, expect, test } from "vite-plus/test";
import { createBlock } from "./content";
import {
  addPage,
  addPost,
  addProduct,
  addRevision,
  addVariant,
  emptyState,
  removePage,
  restoreRevision,
  updatePage,
  updateSite,
} from "./store";

describe("store", () => {
  test("creates a draft page with a unique slug", () => {
    const { next, id } = addPage(emptyState(), { title: "About Us" });
    expect(next.pages).toHaveLength(1);
    expect(next.pages[0]._id).toBe(id);
    expect(next.pages[0].title).toBe("About Us");
    expect(next.pages[0].slug).toBe("about-us");
    expect(next.pages[0].status).toBe("draft");
  });

  test("rejects a duplicate page slug", () => {
    const first = addPage(emptyState(), { title: "About" });
    expect(() => addPage(first.next, { title: "About" })).toThrow(/slug/i);
  });

  test("snapshots the previous content when a page is updated", () => {
    const created = addPage(emptyState(), { title: "Home", slug: "home" });
    const updated = updatePage(created.next, created.id, {
      content: { blocks: [createBlock("hero")] },
    });
    expect(updated.revisions).toHaveLength(1);
    expect(updated.revisions[0].entityId).toBe(created.id);
    expect(updated.pages[0].content.blocks).toHaveLength(1);
  });

  test("rolls a page back to a revision", () => {
    const created = addPage(emptyState(), { title: "Home", slug: "home" });
    const original = created.next.pages[0].content;
    const updated = updatePage(created.next, created.id, {
      content: { blocks: [createBlock("cta")] },
    });
    const revisionId = updated.revisions[0]._id;
    const restored = restoreRevision(updated, revisionId);
    expect(restored.pages[0].content).toEqual(original);
    expect(restored.revisions.length).toBeGreaterThan(1);
  });

  test("creates posts and products with slugs from names", () => {
    const post = addPost(emptyState(), { title: "Why HMS" });
    expect(post.next.posts[0].slug).toBe("why-hms");
    const product = addProduct(post.next, {
      name: "Pro License",
      price: 4900,
      type: "subscription",
    });
    expect(product.next.products[0].slug).toBe("pro-license");
    expect(product.next.products[0].status).toBe("draft");
  });

  test("deletes a page and its revisions", () => {
    const created = addPage(emptyState(), { title: "Gone" });
    const withRev = addRevision(created.next, {
      entityType: "page",
      entityId: created.id,
      content: created.next.pages[0].content,
    });
    const next = removePage(withRev.next, created.id);
    expect(next.pages).toHaveLength(0);
    expect(next.revisions).toHaveLength(0);
  });

  test("writes site settings without dropping the rest of the site", () => {
    const next = updateSite(emptyState(), {
      name: "Studio",
      settings: { seo: { metaTitle: "Studio" } },
    });
    expect(next.site.name).toBe("Studio");
    expect(next.site.settings?.seo?.metaTitle).toBe("Studio");
    expect(next.site.ownerId).toBeTruthy();
  });

  test("stores a split-test variant against a page", () => {
    const created = addPage(emptyState(), { title: "Home", slug: "home" });
    const withVariant = addVariant(created.next, {
      entityType: "page",
      entityId: created.id,
      name: "B",
      traffic: 50,
      content: { blocks: [createBlock("cta")] },
    });
    expect(withVariant.next.variants).toHaveLength(1);
    expect(withVariant.next.variants[0].name).toBe("B");
  });
});
