import { format, isValid, parseISO } from "date-fns";
import type {
  BlockContent,
  Breakpoint,
  CompareOp,
  DynamicBindings,
  VisibilityCondition,
  VisibilityRule,
} from "./content";

export type RelatedRef = {
  id: string;
  title: string;
  slug?: string;
  href?: string;
};

export type DynamicDocument = {
  kind: "page" | "post" | "product" | "entry";
  id?: string;
  title: string;
  slug: string;
  excerpt?: string;
  price?: string;
  href?: string;
  image?: string;
  fields?: Record<string, string>;
  repeaters?: Record<string, Record<string, string>[]>;
  relations?: Record<string, RelatedRef[]>;
};

export type DynamicContext = {
  site: { name?: string; domain?: string; description?: string } | null;
  document: DynamicDocument | null;
  user: { name?: string; email?: string; signedIn: boolean; role?: string };
  query: Record<string, string>;
  now: Date;
  referrer?: string;
  cookies?: Record<string, string>;
  cart?: { count: number; total: string };
};

export type DynamicToken = {
  token: string;
  label: string;
  group: string;
};

export const DYNAMIC_TOKENS: DynamicToken[] = [
  { token: "{{site.name}}", label: "Site name", group: "Site" },
  { token: "{{site.domain}}", label: "Site domain", group: "Site" },
  { token: "{{site.description}}", label: "Site description", group: "Site" },
  { token: "{{doc.title}}", label: "Document title", group: "Document" },
  { token: "{{doc.slug}}", label: "Document slug", group: "Document" },
  { token: "{{doc.excerpt}}", label: "Document excerpt", group: "Document" },
  { token: "{{doc.kind}}", label: "Document kind", group: "Document" },
  { token: "{{doc.price}}", label: "Product price", group: "Document" },
  { token: "{{doc.image}}", label: "Document image", group: "Document" },
  { token: "{{doc.href}}", label: "Document link", group: "Document" },
  { token: "{{page.title}}", label: "Page title", group: "Document" },
  { token: "{{post.title}}", label: "Post title", group: "Document" },
  { token: "{{post.excerpt}}", label: "Post excerpt", group: "Document" },
  { token: "{{product.name}}", label: "Product name", group: "Document" },
  { token: "{{user.name}}", label: "User name", group: "User" },
  { token: "{{user.email}}", label: "User email", group: "User" },
  { token: "{{user.signedIn}}", label: "Signed in", group: "User" },
  { token: "{{date}}", label: "Today", group: "Time" },
  { token: "{{year}}", label: "Year", group: "Time" },
  { token: "{{query.*}}", label: "Query param (replace *)", group: "Request" },
  { token: "{{entry.title}}", label: "Entry title", group: "Entry" },
  { token: "{{field.*}}", label: "Content field (replace *)", group: "Entry" },
  { token: "{{rel.*}}", label: "Related titles (replace *)", group: "Entry" },
  { token: "{{cart.count}}", label: "Cart count", group: "Shop" },
  { token: "{{cart.total}}", label: "Cart total", group: "Shop" },
];

const TOKEN = /\{\{\s*([^}]+?)\s*\}\}/g;

function lookup(path: string, ctx: DynamicContext): string {
  const parts = path.split(".");
  const [root, ...rest] = parts;
  if (root === "site") {
    const key = rest[0];
    if (key === "name") return ctx.site?.name ?? "";
    if (key === "domain") return ctx.site?.domain ?? "";
    if (key === "description") return ctx.site?.description ?? "";
    return "";
  }
  if (root === "doc" || root === "page" || root === "post" || root === "product") {
    const key = rest[0];
    const doc = ctx.document;
    if (!doc) return "";
    if (root === "page" && doc.kind !== "page") return "";
    if (root === "post" && doc.kind !== "post") return "";
    if (root === "product" && doc.kind !== "product") return "";
    if (key === "title" || key === "name") return doc.title;
    if (key === "slug") return doc.slug;
    if (key === "excerpt") return doc.excerpt ?? "";
    if (key === "kind") return doc.kind;
    if (key === "price") return doc.price ?? "";
    if (key === "href") return doc.href ?? "";
    if (key === "image") return doc.image ?? "";
    if (key && doc.fields?.[key] !== undefined) return doc.fields[key] ?? "";
    return "";
  }
  if (root === "entry" || root === "item") {
    const key = rest[0];
    const doc = ctx.document;
    if (!doc) return "";
    if (key === "title" || key === "name") return doc.title;
    if (key === "slug") return doc.slug;
    if (key === "excerpt") return doc.excerpt ?? "";
    if (key === "href") return doc.href ?? "";
    if (key === "image") return doc.image ?? "";
    if (key && doc.fields?.[key] !== undefined) return doc.fields[key] ?? "";
    return "";
  }
  if (root === "field") {
    const key = rest[0];
    if (!key) return "";
    const raw = ctx.document?.fields?.[key] ?? "";
    if (rest[1] && ctx.document?.repeaters?.[key]) {
      return ctx.document.repeaters[key]
        .map((row) => row[rest[1]] ?? "")
        .filter(Boolean)
        .join(", ");
    }
    if (ctx.document?.repeaters?.[key]) {
      return ctx.document.repeaters[key]
        .map((row) => Object.values(row).find((value) => value.trim().length > 0) ?? "")
        .filter(Boolean)
        .join(", ");
    }
    return raw;
  }
  if (root === "rel") {
    const key = rest[0];
    if (!key) return "";
    const related = ctx.document?.relations?.[key] ?? [];
    if (rest[1] === "href")
      return related
        .map((item) => item.href ?? "")
        .filter(Boolean)
        .join(", ");
    if (rest[1] === "slug")
      return related
        .map((item) => item.slug ?? "")
        .filter(Boolean)
        .join(", ");
    return related
      .map((item) => item.title)
      .filter(Boolean)
      .join(", ");
  }
  if (root === "user") {
    const key = rest[0];
    if (key === "name") return ctx.user.name ?? "";
    if (key === "email") return ctx.user.email ?? "";
    if (key === "role") return ctx.user.role ?? "";
    if (key === "signedIn") return ctx.user.signedIn ? "yes" : "no";
    return "";
  }
  if (root === "date") {
    return ctx.now.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }
  if (root === "year") {
    return String(ctx.now.getFullYear());
  }
  if (root === "query") {
    const key = rest.join(".");
    if (!key) return "";
    return ctx.query[key] ?? "";
  }
  if (root === "cookie") {
    const key = rest[0];
    if (!key) return "";
    return ctx.cookies?.[key] ?? "";
  }
  if (root === "referrer") {
    return ctx.referrer ?? "";
  }
  if (root === "cart") {
    const key = rest[0];
    if (key === "count") return String(ctx.cart?.count ?? 0);
    if (key === "total") return ctx.cart?.total ?? "";
    return "";
  }
  return "";
}

function applyModifier(
  value: string,
  name: string,
  arg: string | undefined,
  ctx: DynamicContext,
): string {
  const mod = name.trim().toLowerCase();
  if (mod === "upper") return value.toUpperCase();
  if (mod === "lower") return value.toLowerCase();
  if (mod === "title") {
    return value.replace(
      /\w\S*/g,
      (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
    );
  }
  if (mod === "slug") {
    return value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }
  if (mod === "truncate") {
    const n = Math.max(0, Number(arg) || 140);
    if (value.length <= n) return value;
    return `${value.slice(0, n).trimEnd()}…`;
  }
  if (mod === "fallback" || mod === "default") {
    return value.trim() ? value : (arg ?? "");
  }
  if (mod === "first") {
    return value.split(/,|\n/)[0]?.trim() ?? "";
  }
  if (mod === "join") {
    return value;
  }
  if (mod === "date") {
    const parsed = parseLooseDate(value) ?? ctx.now;
    try {
      return format(parsed, arg || "PPP");
    } catch {
      return value;
    }
  }
  return value;
}

function parseLooseDate(value: string): Date | null {
  if (!value) return null;
  const iso = parseISO(value);
  if (isValid(iso)) return iso;
  const native = new Date(value);
  return isValid(native) ? native : null;
}

/**
 * Resolve tokens
 * Replaces {{path|mod:arg}} markers. Unknown tokens become empty strings.
 */
export function resolveTokens(input: string, ctx: DynamicContext): string {
  return input.replace(TOKEN, (_, raw: string) => {
    const parts = raw.split("|").map((part) => part.trim());
    const path = parts[0] ?? "";
    let value = lookup(path, ctx);
    for (const part of parts.slice(1)) {
      const colon = part.indexOf(":");
      const name = colon === -1 ? part : part.slice(0, colon);
      const arg = colon === -1 ? undefined : part.slice(colon + 1);
      value = applyModifier(value, name, arg, ctx);
    }
    return value;
  });
}

function resolveField(
  fallback: string | undefined,
  binding: string | undefined,
  ctx: DynamicContext,
): string {
  if (binding) {
    const resolved = resolveTokens(binding, ctx).trim();
    if (resolved.length > 0) return resolved;
  }
  return resolveTokens(fallback ?? "", ctx);
}

/**
 * Apply bindings
 * Resolves dynamic tags on every string field. Bindings win when they resolve.
 */
export function applyBindings(
  content: BlockContent,
  bindings: DynamicBindings | undefined,
  ctx: DynamicContext,
): BlockContent {
  const next: BlockContent = { ...content };
  const stringKeys = ["title", "subtitle", "body", "buttonText", "buttonHref", "url"] as const;
  for (const key of stringKeys) {
    const current = next[key];
    if (typeof current === "string" || bindings?.[key]) {
      next[key] = resolveField(typeof current === "string" ? current : "", bindings?.[key], ctx);
    }
  }
  if (next.items) {
    next.items = next.items.map((item, index) =>
      resolveField(item, bindings?.[`items.${index}`] ?? bindings?.items, ctx),
    );
  }
  if (next.urls) {
    next.urls = next.urls.map((item) => resolveTokens(item, ctx));
  }
  if (next.emptyTitle) next.emptyTitle = resolveTokens(next.emptyTitle, ctx);
  if (next.emptyBody) next.emptyBody = resolveTokens(next.emptyBody, ctx);
  if (next.formTarget) next.formTarget = resolveTokens(next.formTarget, ctx);
  if (next.formRedirect) next.formRedirect = resolveTokens(next.formRedirect, ctx);
  return next;
}

/**
 * Compare
 * Field and query comparisons used by visibility and collection filters.
 */
export function compareValues(
  actual: string | undefined,
  compare: CompareOp | undefined,
  expected?: string,
): boolean {
  const op = compare ?? "eq";
  const left = actual ?? "";
  const right = expected ?? "";
  if (op === "empty") return left.trim() === "";
  if (op === "not-empty") return left.trim() !== "";
  if (op === "contains") return left.toLowerCase().includes(right.toLowerCase());
  if (op === "neq") return left !== right;
  const leftNum = Number(left);
  const rightNum = Number(right);
  const numeric = left !== "" && right !== "" && !Number.isNaN(leftNum) && !Number.isNaN(rightNum);
  if (op === "gt") return numeric ? leftNum > rightNum : left > right;
  if (op === "gte") return numeric ? leftNum >= rightNum : left >= right;
  if (op === "lt") return numeric ? leftNum < rightNum : left < right;
  if (op === "lte") return numeric ? leftNum <= rightNum : left <= right;
  return left === right;
}

function fieldValue(ctx: DynamicContext, key?: string): string {
  if (!key) return "";
  if (ctx.document?.fields?.[key] !== undefined) return ctx.document.fields[key] ?? "";
  if (key === "title") return ctx.document?.title ?? "";
  if (key === "slug") return ctx.document?.slug ?? "";
  if (key === "excerpt") return ctx.document?.excerpt ?? "";
  if (key === "price") return ctx.document?.price ?? "";
  return "";
}

/**
 * Evaluate condition
 */
export function evaluateCondition(
  condition: VisibilityCondition,
  ctx: DynamicContext,
  breakpoint: Breakpoint,
): boolean {
  const op = condition.op;
  if (op === "always") return true;
  if (op === "never") return false;
  if (op === "logged-in") return ctx.user.signedIn;
  if (op === "logged-out") return !ctx.user.signedIn;
  if (op === "role") {
    const role = ctx.user.role ?? "";
    if (!condition.value) return role.length > 0;
    return compareValues(role, condition.compare ?? "eq", condition.value);
  }
  if (op === "query") {
    const key = condition.key?.trim();
    if (!key) return false;
    return compareValues(
      ctx.query[key],
      condition.compare ?? (condition.value ? "eq" : "not-empty"),
      condition.value,
    );
  }
  if (op === "referrer") {
    return compareValues(ctx.referrer ?? "", condition.compare ?? "contains", condition.value);
  }
  if (op === "cookie") {
    const key = condition.key?.trim();
    if (!key) return false;
    return compareValues(
      ctx.cookies?.[key],
      condition.compare ?? (condition.value ? "eq" : "not-empty"),
      condition.value,
    );
  }
  if (op === "schedule") {
    const now = ctx.now.getTime();
    if (condition.from) {
      const start = parseLooseDate(condition.from);
      if (start && now < start.getTime()) return false;
    }
    if (condition.to) {
      const end = parseLooseDate(condition.to);
      if (end && now > end.getTime()) return false;
    }
    return true;
  }
  if (op === "field") {
    return compareValues(
      fieldValue(ctx, condition.key),
      condition.compare ?? "eq",
      condition.value,
    );
  }
  if (op === "device") {
    return condition.value === breakpoint;
  }
  return true;
}

function evaluateLegacy(rule: VisibilityRule, ctx: DynamicContext): boolean {
  const when = rule.when ?? "always";
  if (when === "never") return false;
  if (when === "logged-in") return ctx.user.signedIn;
  if (when === "logged-out") return !ctx.user.signedIn;
  if (when === "query") {
    const key = rule.queryKey?.trim();
    if (!key) return false;
    const actual = ctx.query[key];
    if (rule.queryValue === undefined || rule.queryValue === "") {
      return actual !== undefined && actual !== "";
    }
    return actual === rule.queryValue;
  }
  return true;
}

/**
 * Is visible
 * Groups (AND/OR) win when present; otherwise the legacy single `when` rule runs.
 */
export function isVisible(
  rule: VisibilityRule | undefined,
  ctx: DynamicContext,
  breakpoint: Breakpoint,
): boolean {
  if (!rule) return true;
  if (rule.hideOn?.includes(breakpoint)) return false;
  if (rule.conditions && rule.conditions.length > 0) {
    const match = rule.match ?? "all";
    if (match === "any") {
      return rule.conditions.some((condition) => evaluateCondition(condition, ctx, breakpoint));
    }
    return rule.conditions.every((condition) => evaluateCondition(condition, ctx, breakpoint));
  }
  return evaluateLegacy(rule, ctx);
}

/**
 * Visibility fallback
 */
/**
 * Explain visibility
 * One line per condition for the editor inspector.
 */
export function explainVisibility(
  rule: VisibilityRule | undefined,
  ctx: DynamicContext,
  breakpoint: Breakpoint,
): { visible: boolean; lines: string[] } {
  const visible = isVisible(rule, ctx, breakpoint);
  if (!rule) return { visible: true, lines: ["No conditions"] };
  const lines: string[] = [];
  if (rule.hideOn?.length) {
    lines.push(
      `Hide on ${rule.hideOn.join(", ")} — ${rule.hideOn.includes(breakpoint) ? "hidden here" : "ok here"}`,
    );
  }
  if (rule.conditions && rule.conditions.length > 0) {
    lines.push(`Match ${rule.match ?? "all"}`);
    for (const condition of rule.conditions) {
      const pass = evaluateCondition(condition, ctx, breakpoint);
      const detail = [condition.op, condition.key, condition.compare, condition.value]
        .filter(Boolean)
        .join(" ");
      lines.push(`${pass ? "pass" : "fail"}: ${detail}`);
    }
  } else if (rule.when && rule.when !== "always") {
    lines.push(`Legacy ${rule.when}${rule.queryKey ? ` ${rule.queryKey}` : ""}`);
  }
  if (rule.fallback) lines.push("Fallback copy is set");
  if (lines.length === 0) lines.push("Always visible");
  return { visible, lines };
}

export function visibilityFallback(rule: VisibilityRule | undefined, ctx: DynamicContext): string {
  if (!rule?.fallback) return "";
  return resolveTokens(rule.fallback, ctx);
}

/**
 * Tokens for context
 * Built-in tokens plus this document's content fields.
 */
export function tokensForContext(fields?: { key: string; label: string }[]): DynamicToken[] {
  const extra: DynamicToken[] = (fields ?? []).flatMap((field) => [
    { token: `{{field.${field.key}}}`, label: field.label, group: "This type" },
    {
      token: `{{field.${field.key}|fallback:}}`,
      label: `${field.label} or fallback`,
      group: "This type",
    },
  ]);
  return [...DYNAMIC_TOKENS.filter((token) => !token.token.includes("*")), ...extra];
}

/**
 * Insert token
 * Appends a token to a field, with a leading space when needed.
 */
export function insertToken(current: string, token: string): string {
  if (!current) return token;
  if (current.endsWith(" ") || current.endsWith("\n")) return `${current}${token}`;
  return `${current} ${token}`;
}

export function emptyDynamicContext(): DynamicContext {
  return {
    site: null,
    document: null,
    user: { signedIn: false },
    query: {},
    now: new Date(0),
    cookies: {},
    referrer: "",
    cart: { count: 0, total: "" },
  };
}
