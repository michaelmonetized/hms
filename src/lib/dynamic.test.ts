import { describe, expect, test } from "vite-plus/test";
import {
  applyBindings,
  emptyDynamicContext,
  explainVisibility,
  insertToken,
  isVisible,
  resolveTokens,
  type DynamicContext,
} from "./dynamic";

function ctx(patch: Partial<DynamicContext> = {}): DynamicContext {
  return {
    ...emptyDynamicContext(),
    site: { name: "HMS", domain: "hms.app", description: "Ship faster." },
    document: { kind: "post", title: "Why HMS", slug: "why-hms", excerpt: "Because." },
    user: { name: "Ada", email: "ada@hms.app", signedIn: true },
    query: { ref: "ad", utm: "" },
    now: new Date("2026-08-13T12:00:00Z"),
    ...patch,
  };
}

describe("resolveTokens", () => {
  test("replaces site, document, user, and date tokens", () => {
    const text = "Welcome to {{site.name}} — {{doc.title}} by {{user.name}} in {{year}}";
    expect(resolveTokens(text, ctx())).toBe("Welcome to HMS — Why HMS by Ada in 2026");
  });

  test("resolves entry fields", () => {
    expect(
      resolveTokens("{{field.client}} · {{entry.title}}", {
        ...ctx(),
        document: {
          kind: "entry",
          title: "Northwind",
          slug: "nw",
          fields: { client: "Ada" },
        },
      }),
    ).toBe("Ada · Northwind");
  });

  test("resolves query params and page-only aliases", () => {
    expect(resolveTokens("via {{query.ref}}", ctx())).toBe("via ad");
    expect(resolveTokens("{{page.title}}", ctx())).toBe("");
    expect(resolveTokens("{{post.title}}", ctx())).toBe("Why HMS");
  });

  test("unknown tokens become empty", () => {
    expect(resolveTokens("x{{missing.path}}y", ctx())).toBe("xy");
  });

  test("applies modifiers", () => {
    expect(resolveTokens("{{doc.title|upper}}", ctx())).toBe("WHY HMS");
    expect(resolveTokens("{{doc.excerpt|truncate:4}}", ctx())).toBe("Beca…");
    expect(resolveTokens("{{missing|fallback:Hi}}", ctx())).toBe("Hi");
    expect(resolveTokens("{{date|date:yyyy}}", ctx())).toBe("2026");
  });
});

describe("applyBindings", () => {
  test("bindings win when they resolve, otherwise tokens in the static value run", () => {
    const content = applyBindings(
      { title: "Hello {{site.name}}", subtitle: "fallback" },
      { subtitle: "{{doc.excerpt}}" },
      ctx(),
    );
    expect(content.title).toBe("Hello HMS");
    expect(content.subtitle).toBe("Because.");
  });

  test("empty binding falls back to the static field", () => {
    const content = applyBindings({ title: "Static" }, { title: "{{missing}}" }, ctx());
    expect(content.title).toBe("Static");
  });
});

describe("isVisible", () => {
  test("hides on the active breakpoint", () => {
    expect(isVisible({ hideOn: ["mobile"] }, ctx(), "mobile")).toBe(false);
    expect(isVisible({ hideOn: ["mobile"] }, ctx(), "desktop")).toBe(true);
  });

  test("respects logged-in and logged-out rules", () => {
    expect(isVisible({ when: "logged-in" }, ctx(), "desktop")).toBe(true);
    expect(isVisible({ when: "logged-out" }, ctx(), "desktop")).toBe(false);
    expect(isVisible({ when: "logged-in" }, ctx({ user: { signedIn: false } }), "desktop")).toBe(
      false,
    );
  });

  test("matches query presence and exact value", () => {
    expect(isVisible({ when: "query", queryKey: "ref" }, ctx(), "desktop")).toBe(true);
    expect(isVisible({ when: "query", queryKey: "ref", queryValue: "ad" }, ctx(), "desktop")).toBe(
      true,
    );
    expect(
      isVisible({ when: "query", queryKey: "ref", queryValue: "email" }, ctx(), "desktop"),
    ).toBe(false);
    expect(isVisible({ when: "query", queryKey: "missing" }, ctx(), "desktop")).toBe(false);
  });

  test("never is never visible", () => {
    expect(isVisible({ when: "never" }, ctx(), "desktop")).toBe(false);
  });

  test("AND/OR condition groups", () => {
    const signed = ctx();
    const ruleAll = {
      match: "all" as const,
      conditions: [{ op: "logged-in" as const }, { op: "query" as const, key: "ref", value: "ad" }],
    };
    expect(isVisible(ruleAll, signed, "desktop")).toBe(true);
    expect(isVisible(ruleAll, ctx({ query: {} }), "desktop")).toBe(false);
    const ruleAny = {
      match: "any" as const,
      conditions: [
        { op: "logged-out" as const },
        { op: "query" as const, key: "ref", value: "ad" },
      ],
    };
    expect(isVisible(ruleAny, signed, "desktop")).toBe(true);
  });

  test("field compare and schedule", () => {
    const withField = ctx({
      document: {
        kind: "entry",
        title: "Deal",
        slug: "deal",
        fields: { price: "40" },
      },
    });
    expect(
      isVisible(
        { conditions: [{ op: "field", key: "price", compare: "gt", value: "10" }] },
        withField,
        "desktop",
      ),
    ).toBe(true);
    expect(
      isVisible(
        { conditions: [{ op: "field", key: "price", compare: "lt", value: "10" }] },
        withField,
        "desktop",
      ),
    ).toBe(false);
    expect(
      isVisible(
        { conditions: [{ op: "schedule", from: "2026-01-01", to: "2026-12-31" }] },
        ctx(),
        "desktop",
      ),
    ).toBe(true);
    expect(
      isVisible({ conditions: [{ op: "schedule", from: "2027-01-01" }] }, ctx(), "desktop"),
    ).toBe(false);
  });
});

describe("explainVisibility", () => {
  test("lists pass and fail for each condition", () => {
    const result = explainVisibility(
      {
        match: "all",
        conditions: [{ op: "logged-in" }, { op: "query", key: "ref", value: "nope" }],
      },
      ctx(),
      "desktop",
    );
    expect(result.visible).toBe(false);
    expect(result.lines.some((line) => line.startsWith("pass:"))).toBe(true);
    expect(result.lines.some((line) => line.startsWith("fail:"))).toBe(true);
  });
});

describe("insertToken", () => {
  test("spaces a token when appending to existing copy", () => {
    expect(insertToken("Hello", "{{site.name}}")).toBe("Hello {{site.name}}");
    expect(insertToken("", "{{site.name}}")).toBe("{{site.name}}");
  });
});
