import { describe, expect, test } from "vite-plus/test";
import { searchCatalog } from "./catalog";

describe("searchCatalog", () => {
  test("returns every group when the query is empty", () => {
    expect(searchCatalog("").length).toBeGreaterThan(3);
  });

  test("finds widgets by keyword", () => {
    const groups = searchCatalog("youtube");
    expect(groups.flatMap((group) => group.items).map((item) => item.type)).toContain("video");
  });

  test("returns nothing for junk", () => {
    expect(searchCatalog("zzzz-no-widget")).toEqual([]);
  });
});
