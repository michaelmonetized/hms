import { describe, expect, test } from "vite-plus/test";
import { emptyDynamicContext, type DynamicDocument } from "./dynamic";
import { queryItems, type Queryable } from "./query";

function item(title: string, patch: Partial<Queryable> = {}): Queryable {
  const slug = title.toLowerCase().replace(/\s+/g, "-");
  const document: DynamicDocument = {
    kind: "entry",
    title,
    slug,
    fields: patch.fields,
    ...patch.document,
  };
  return {
    id: patch.id ?? slug,
    title,
    meta: patch.meta ?? "",
    href: `/${slug}`,
    updatedAt: patch.updatedAt ?? 1,
    fields: patch.fields,
    document,
  };
}

describe("queryItems", () => {
  const rows = [
    item("Alpha", { updatedAt: 3, fields: { client: "Ada", price: "10" } }),
    item("Beta", { updatedAt: 2, fields: { client: "Ada", price: "30" } }),
    item("Gamma", { updatedAt: 1, fields: { client: "Bea", price: "20" } }),
  ];

  test("filters by field compare", () => {
    const result = queryItems(
      rows,
      { filterField: "price", filterCompare: "gt", filterValue: "15", limit: 10 },
      emptyDynamicContext(),
    );
    expect(result.items.map((row) => row.title)).toEqual(["Beta", "Gamma"]);
  });

  test("sorts by title and date", () => {
    expect(
      queryItems(rows, { sort: "title-asc", limit: 10 }, emptyDynamicContext()).items.map(
        (row) => row.title,
      ),
    ).toEqual(["Alpha", "Beta", "Gamma"]);
    expect(
      queryItems(rows, { sort: "date-desc", limit: 10 }, emptyDynamicContext()).items[0].title,
    ).toBe("Alpha");
  });

  test("related field matches the current document", () => {
    const ctx = {
      ...emptyDynamicContext(),
      document: { kind: "entry" as const, title: "Me", slug: "me", fields: { client: "Ada" } },
    };
    const result = queryItems(rows, { relatedField: "client", limit: 10 }, ctx);
    expect(result.items.map((row) => row.title)).toEqual(["Alpha", "Beta"]);
  });

  test("excludes the current document", () => {
    const ctx = {
      ...emptyDynamicContext(),
      document: { kind: "entry" as const, id: "alpha", title: "Alpha", slug: "alpha" },
    };
    const result = queryItems(rows, { excludeCurrent: true, limit: 10 }, ctx);
    expect(result.items.some((row) => row.title === "Alpha")).toBe(false);
  });

  test("searches and paginates", () => {
    const ctx = { ...emptyDynamicContext(), query: { q: "beta", page: "1" } };
    const searched = queryItems(rows, { searchParam: "q", limit: 10 }, ctx);
    expect(searched.items.map((row) => row.title)).toEqual(["Beta"]);
    const page = queryItems(
      rows,
      { paginate: true, limit: 2, sort: "title-asc" },
      {
        ...emptyDynamicContext(),
        query: { page: "2" },
      },
    );
    expect(page.pages).toBe(2);
    expect(page.items.map((row) => row.title)).toEqual(["Gamma"]);
  });

  test("facets comma-separated terms", () => {
    const tagged = [
      item("Alpha", { fields: { sector: "saas, agency" } }),
      item("Beta", { fields: { sector: "retail" } }),
      item("Gamma", { fields: { sector: "saas" } }),
    ];
    const result = queryItems(
      tagged,
      { facetField: "sector", limit: 10 },
      { ...emptyDynamicContext(), query: { sector: "saas" } },
    );
    expect(result.items.map((row) => row.title)).toEqual(["Alpha", "Gamma"]);
  });
});
