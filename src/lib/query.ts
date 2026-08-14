import { compareValues, type DynamicContext, type DynamicDocument } from "./dynamic";
import type { CollectionSort, CompareOp } from "./content";

export type Queryable = {
  id: string;
  title: string;
  meta: string;
  href: string;
  image?: string;
  updatedAt?: number;
  fields?: Record<string, string>;
  document: DynamicDocument;
};

export type QuerySpec = {
  sort?: CollectionSort;
  sortField?: string;
  filterField?: string;
  filterCompare?: CompareOp;
  filterValue?: string;
  excludeCurrent?: boolean;
  relatedField?: string;
  offset?: number;
  limit?: number;
  paginate?: boolean;
  searchParam?: string;
  page?: number;
  facetField?: string;
};

export type QueryResult<T extends Queryable = Queryable> = {
  items: T[];
  page: number;
  pages: number;
  total: number;
};

function valueOf(item: Queryable, key?: string): string {
  if (!key) return "";
  if (key === "title") return item.title;
  if (key === "slug") return item.document.slug;
  if (key === "excerpt") return item.document.excerpt ?? item.meta;
  if (key === "meta") return item.meta;
  return item.fields?.[key] ?? item.document.fields?.[key] ?? "";
}

/**
 * Query items
 * Filter, relate, search, sort, and paginate a collection.
 */
export function queryItems<T extends Queryable>(
  items: T[],
  spec: QuerySpec,
  ctx: DynamicContext,
): QueryResult<T> {
  let next = items.slice();
  if (spec.excludeCurrent && ctx.document) {
    const current = ctx.document;
    next = next.filter((item) => {
      if (current.id && item.id === current.id) return false;
      if (item.document.slug === current.slug && item.document.kind === current.kind) return false;
      return true;
    });
  }
  if (spec.filterField) {
    next = next.filter((item) =>
      compareValues(valueOf(item, spec.filterField), spec.filterCompare ?? "eq", spec.filterValue),
    );
  }
  if (spec.relatedField && ctx.document) {
    const key = spec.relatedField;
    const mine =
      ctx.document.fields?.[key] ??
      ctx.document.relations?.[key]?.map((item) => item.id).join(",") ??
      "";
    next = next.filter((item) => {
      const theirs = valueOf(item, key);
      if (!mine || !theirs) return false;
      if (mine === theirs) return true;
      const left = mine.split(",").map((part) => part.trim());
      const right = theirs.split(",").map((part) => part.trim());
      return left.some((id) => right.includes(id));
    });
  }
  if (spec.facetField) {
    const selected = (ctx.query[spec.facetField] ?? ctx.query.facet ?? "").trim();
    if (selected) {
      next = next.filter((item) => {
        const value = valueOf(item, spec.facetField);
        if (value === selected) return true;
        return value
          .split(",")
          .map((part) => part.trim())
          .includes(selected);
      });
    }
  }
  const searchKey = spec.searchParam || "q";
  const needle = (ctx.query[searchKey] ?? "").trim().toLowerCase();
  if (needle) {
    next = next.filter((item) => {
      const hay = [item.title, item.meta, ...Object.values(item.fields ?? {})]
        .join(" ")
        .toLowerCase();
      return hay.includes(needle);
    });
  }

  const sort = spec.sort ?? "date-desc";
  next.sort((a, b) => {
    if (sort === "title-asc") return a.title.localeCompare(b.title);
    if (sort === "title-desc") return b.title.localeCompare(a.title);
    if (sort === "field-asc")
      return valueOf(a, spec.sortField).localeCompare(valueOf(b, spec.sortField));
    if (sort === "field-desc")
      return valueOf(b, spec.sortField).localeCompare(valueOf(a, spec.sortField));
    const aTime = a.updatedAt ?? 0;
    const bTime = b.updatedAt ?? 0;
    return sort === "date-asc" ? aTime - bTime : bTime - aTime;
  });

  const offset = Math.max(0, spec.offset ?? 0);
  const sliced = next.slice(offset);
  const total = sliced.length;
  const pageSize = Math.max(1, spec.limit ?? 6);
  if (!spec.paginate) {
    return { items: sliced.slice(0, pageSize), page: 1, pages: 1, total };
  }
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const requested = spec.page ?? Number(ctx.query.page || "1");
  const page = Math.min(pages, Math.max(1, Number.isFinite(requested) ? requested : 1));
  const start = (page - 1) * pageSize;
  return { items: sliced.slice(start, start + pageSize), page, pages, total };
}
