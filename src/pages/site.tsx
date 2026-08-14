import { useEffect, useMemo, useRef } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { BlockRenderer } from "@/components/builder/block-renderer";
import { DocumentBodyProvider, useSetDynamicDocument } from "@/components/builder/dynamic-context";
import {
  decorateEntryFields,
  defaultBlueprintTree,
  encodeRelationIds,
  encodeRepeater,
  encodeTerms,
  parseRelationIds,
  parseRepeater,
  parseTerms,
  pickTemplate,
} from "@/lib/blueprints";
import { LiveEditor, useDebouncedBlocks } from "@/components/builder/live-editor";
import type { DynamicDocument } from "@/lib/dynamic";
import { Button } from "@/components/ui/button";
import { useEditDoc } from "@/components/site/edit-doc";
import { useHMS } from "@/hooks/use-hms";
import { useHMSAuth } from "@/hooks/use-hms-auth";
import {
  createBlock,
  formatPrice,
  normalizeContent,
  normalizeSlug,
  pickVariant,
  publicPath,
  relativeTime,
  type Block,
} from "@/lib/content";
import { toast } from "@/components/ui/lib";

function useEditing() {
  const [params] = useSearchParams();
  const { isSignedIn } = useHMSAuth();
  return Boolean(isSignedIn) && params.get("edit") === "1";
}

function EditableDocument({
  entityId,
  blocks: initialBlocks,
  published,
  document,
  onSave,
  onPublish,
}: {
  entityId: string;
  blocks: Block[];
  published: boolean;
  document: DynamicDocument;
  onSave: (blocks: Block[], snapshot?: boolean) => void;
  onPublish: () => void;
}) {
  const editing = useEditing();
  const { setDoc } = useEditDoc();
  const setDocument = useSetDynamicDocument();
  const publishRef = useRef(onPublish);
  publishRef.current = onPublish;
  const [blocks, setBlocks] = useDebouncedBlocks(entityId, initialBlocks, (next) =>
    onSave(next, false),
  );

  useEffect(() => {
    setDoc({ published, publish: () => publishRef.current() });
    return () => setDoc({});
  }, [published, setDoc]);

  const resolvedDocument = useMemo<DynamicDocument>(
    () => ({
      kind: document.kind,
      title: document.title,
      slug: document.slug,
      excerpt: document.excerpt,
      price: document.price,
    }),
    [document.excerpt, document.kind, document.price, document.slug, document.title],
  );

  useEffect(() => {
    setDocument(resolvedDocument);
    return () => setDocument(null);
  }, [resolvedDocument, setDocument]);

  if (editing) {
    return <LiveEditor key={entityId} blocks={blocks} onChange={setBlocks} />;
  }
  return <BlockRenderer blocks={blocks} />;
}

export function SiteSlug() {
  const { slug } = useParams();
  const hms = useHMS();
  const type = hms.contentTypes.find((item) => item.slug === normalizeSlug(slug ?? ""));
  if (type) return <SiteTypeArchive typeId={type._id} />;
  return <SitePage />;
}

export function SiteTypeArchive({ typeId }: { typeId: string }) {
  const hms = useHMS();
  const type = hms.contentTypes.find((item) => item._id === typeId);
  const setDocument = useSetDynamicDocument();
  const template = type ? pickTemplate(hms.blueprints, "entry-archive", type._id) : undefined;

  useEffect(() => {
    if (!type) return;
    setDocument({ kind: "entry", title: type.plural, slug: type.slug });
    return () => setDocument(null);
  }, [setDocument, type]);

  if (!type) return <Missing label="Type" />;
  if (template) {
    return <BlockRenderer blocks={template.content.blocks} />;
  }
  const live = hms.entries.filter(
    (entry) => entry.contentTypeId === type._id && entry.status === "published",
  );
  if (live.length === 0) return <Missing label={type.plural} />;
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-4xl font-semibold tracking-tight">{type.plural}</h1>
      <div className="flex flex-col divide-y rounded-xl border">
        {live.map((entry) => (
          <Link
            key={entry._id}
            to={publicPath("entry", entry.slug, type.slug)}
            className="flex flex-col gap-1 px-5 py-5 hover:bg-muted/40"
          >
            <span className="text-lg font-medium">{entry.title}</span>
            <span className="text-sm text-muted-foreground">
              {entry.fields.client || entry.slug}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function SiteEntry() {
  const { typeSlug, entrySlug } = useParams();
  const { isSignedIn } = useHMSAuth();
  const hms = useHMS();
  const editing = useEditing();
  const type = hms.contentTypes.find((item) => item.slug === normalizeSlug(typeSlug ?? ""));
  const entry = hms.entries.find(
    (item) =>
      item.contentTypeId === type?._id &&
      normalizeSlug(item.slug) === normalizeSlug(entrySlug ?? ""),
  );
  const visible = entry && (entry.status === "published" || isSignedIn);
  if (!type || !visible || !entry) return <Missing label="Entry" />;

  const decorated = decorateEntryFields(entry.fields, type.fields, (relatedId) => {
    const related = hms.entries.find((item) => item._id === relatedId);
    if (!related) return undefined;
    const relatedType = hms.contentTypes.find((item) => item._id === related.contentTypeId);
    return {
      id: relatedId,
      title: related.title,
      slug: related.slug,
      href: publicPath("entry", related.slug, relatedType?.slug),
    };
  });
  const document: DynamicDocument = {
    kind: "entry",
    id: entry._id,
    title: entry.title,
    slug: entry.slug,
    excerpt: entry.fields.outcome || entry.fields.excerpt,
    href: publicPath("entry", entry.slug, type.slug),
    image: entry.fields.image,
    fields: entry.fields,
    ...decorated,
  };
  const template = pickTemplate(hms.blueprints, "entry-single", type._id);

  if (template && !editing) {
    return (
      <TemplatedDocument
        document={document}
        template={template.content.blocks}
        body={entry.content.blocks}
      />
    );
  }

  return (
    <article className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-4xl font-semibold tracking-tight">{entry.title}</h1>
        {entry.fields.client && (
          <p className="text-muted-foreground">
            {entry.fields.client}
            {entry.fields.year ? ` · ${entry.fields.year}` : ""}
          </p>
        )}
      </header>
      {editing && (
        <div className="grid gap-3 rounded-xl border p-4 sm:grid-cols-2">
          {type.fields.map((field) => (
            <label key={field.id} className="flex flex-col gap-1 text-sm sm:col-span-2">
              {field.label}
              {field.type === "relation" ? (
                <select
                  multiple
                  className="min-h-24 rounded-md border bg-background px-2 py-1"
                  value={parseRelationIds(entry.fields[field.key])}
                  onChange={(event) => {
                    const ids = [...event.target.selectedOptions].map((option) => option.value);
                    void hms.updateEntry(entry._id, {
                      fields: { ...entry.fields, [field.key]: encodeRelationIds(ids) },
                    });
                  }}
                >
                  {hms.entries
                    .filter((item) => item.contentTypeId === field.relationTypeId)
                    .map((item) => (
                      <option key={item._id} value={item._id}>
                        {item.title}
                      </option>
                    ))}
                </select>
              ) : field.type === "repeater" ? (
                <RepeaterEditor
                  rows={parseRepeater(entry.fields[field.key])}
                  subfields={field.repeaterFields ?? []}
                  onChange={(rows) =>
                    void hms.updateEntry(entry._id, {
                      fields: { ...entry.fields, [field.key]: encodeRepeater(rows) },
                    })
                  }
                />
              ) : field.type === "terms" ? (
                <TermsEditor
                  value={parseTerms(entry.fields[field.key])}
                  options={field.options ?? []}
                  onChange={(terms) =>
                    void hms.updateEntry(entry._id, {
                      fields: { ...entry.fields, [field.key]: encodeTerms(terms) },
                    })
                  }
                />
              ) : (
                <input
                  className="h-8 rounded-md border bg-background px-2"
                  value={entry.fields[field.key] ?? ""}
                  onChange={(event) =>
                    void hms.updateEntry(entry._id, {
                      fields: { ...entry.fields, [field.key]: event.target.value },
                    })
                  }
                />
              )}
            </label>
          ))}
        </div>
      )}
      <EditableDocument
        entityId={entry._id}
        blocks={entry.content.blocks}
        published={entry.status === "published"}
        document={document}
        onSave={(blocks) => {
          void hms.updateEntry(entry._id, { content: { blocks } });
        }}
        onPublish={() => {
          const next = entry.status === "published" ? "draft" : "published";
          void hms.updateEntry(entry._id, { status: next });
          toast.add({ title: next === "published" ? "Published" : "Unpublished", type: "success" });
        }}
      />
    </article>
  );
}

function TemplatedDocument({
  document,
  template,
  body,
}: {
  document: DynamicDocument;
  template: Block[];
  body: Block[];
}) {
  const setDocument = useSetDynamicDocument();
  const { kind, title, slug, excerpt, href, image, fields, id, price, repeaters, relations } =
    document;
  useEffect(() => {
    setDocument({
      kind,
      title,
      slug,
      excerpt,
      href,
      image,
      fields,
      id,
      price,
      repeaters,
      relations,
    });
    return () => setDocument(null);
  }, [
    excerpt,
    fields,
    href,
    id,
    image,
    kind,
    price,
    relations,
    repeaters,
    setDocument,
    slug,
    title,
  ]);
  return (
    <DocumentBodyProvider blocks={body}>
      <BlockRenderer blocks={template} />
    </DocumentBodyProvider>
  );
}

export function SitePage() {
  const { slug } = useParams();
  const [params] = useSearchParams();
  const { isSignedIn } = useHMSAuth();
  const hms = useHMS();
  const target = normalizeSlug(slug ?? "home");
  const page = hms.pages.find((item) => normalizeSlug(item.slug) === target);
  const visible = page && (page.status === "published" || isSignedIn);

  if (!visible || !page) {
    return <Missing label="Page" />;
  }

  const content = normalizeContent(
    pickVariant(
      hms.variants.filter(
        (variant) => variant.entityType === "page" && variant.entityId === page._id,
      ),
      page.content,
      params.get("v") ?? undefined,
    ),
  );

  return (
    <EditableDocument
      entityId={page._id}
      blocks={content.blocks}
      published={page.status === "published"}
      document={{ kind: "page", title: page.title, slug: page.slug }}
      onSave={(blocks, snapshot) => {
        void hms.updatePage(page._id, { content: { blocks } }, { snapshot: snapshot ?? false });
      }}
      onPublish={() => {
        const next = page.status === "published" ? "draft" : "published";
        void hms.updatePage(page._id, { status: next });
        toast.add({ title: next === "published" ? "Published" : "Unpublished", type: "success" });
      }}
    />
  );
}

export function SiteBlogIndex() {
  const { posts, blueprints } = useHMS();
  const published = posts.filter((post) => post.status === "published");
  const template = pickTemplate(blueprints, "post-archive");
  if (published.length === 0 && !template) return <Missing label="Posts" />;
  if (template) {
    return (
      <DocumentBodyProvider blocks={[]}>
        <BlockRenderer blocks={template.content.blocks} />
      </DocumentBodyProvider>
    );
  }
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-4xl font-semibold tracking-tight">Blog</h1>
      <div className="flex flex-col divide-y rounded-xl border">
        {published.map((post) => (
          <Link
            key={post._id}
            to={publicPath("post", post.slug)}
            className="flex flex-col gap-1 px-5 py-5 hover:bg-muted/40"
          >
            <span className="text-lg font-medium">{post.title}</span>
            <span className="text-sm text-muted-foreground">{post.excerpt}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function SitePost() {
  const { slug } = useParams();
  const [params] = useSearchParams();
  const { isSignedIn } = useHMSAuth();
  const hms = useHMS();
  const editing = useEditing();
  const post = hms.posts.find((item) => normalizeSlug(item.slug) === normalizeSlug(slug ?? ""));
  const visible = post && (post.status === "published" || isSignedIn);
  if (!visible || !post) return <Missing label="Post" />;

  const content = normalizeContent(
    pickVariant(
      hms.variants.filter(
        (variant) => variant.entityType === "post" && variant.entityId === post._id,
      ),
      post.content,
      params.get("v") ?? undefined,
    ),
  );

  const template = pickTemplate(hms.blueprints, "post-single");
  const document = {
    kind: "post" as const,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    href: publicPath("post", post.slug),
    image: post.coverImage,
  };

  if (template && !editing) {
    return (
      <TemplatedDocument
        document={document}
        template={template.content.blocks}
        body={content.blocks}
      />
    );
  }

  return (
    <article className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-4xl font-semibold tracking-tight">{post.title}</h1>
        {post.excerpt && <p className="text-muted-foreground">{post.excerpt}</p>}
        {post.publishedAt && (
          <span className="text-xs text-muted-foreground">{relativeTime(post.publishedAt)}</span>
        )}
      </header>
      <EditableDocument
        entityId={post._id}
        blocks={content.blocks}
        published={post.status === "published"}
        document={document}
        onSave={(blocks, snapshot) => {
          void hms.updatePost(post._id, { content: { blocks } }, { snapshot: snapshot ?? false });
        }}
        onPublish={() => {
          const next = post.status === "published" ? "draft" : "published";
          void hms.updatePost(post._id, { status: next });
          toast.add({ title: next === "published" ? "Published" : "Unpublished", type: "success" });
        }}
      />
    </article>
  );
}

export function SiteShop() {
  const { products, site, blueprints } = useHMS();
  const live = products.filter((product) => product.status === "active");
  const template = pickTemplate(blueprints, "product-archive");
  if (template) {
    return (
      <DocumentBodyProvider blocks={[]}>
        <BlockRenderer blocks={template.content.blocks} />
      </DocumentBodyProvider>
    );
  }
  if (live.length === 0) return <Missing label="Products" />;
  const currency = site?.settings?.commerce?.currency ?? "USD";
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-4xl font-semibold tracking-tight">Shop</h1>
      <div className="grid gap-4 sm:grid-cols-2">
        {live.map((product) => (
          <Link
            key={product._id}
            to={publicPath("product", product.slug)}
            className="flex flex-col gap-2 rounded-xl border p-5 hover:bg-muted/30"
          >
            <span className="text-lg font-medium">{product.name}</span>
            <span className="text-sm text-muted-foreground">
              {formatPrice(product.price, currency)}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function SiteProduct() {
  const { slug } = useParams();
  const { isSignedIn } = useHMSAuth();
  const { products, site, blueprints } = useHMS();
  const product = products.find((item) => item.slug === slug);
  const visible = product && (product.status === "active" || isSignedIn);
  if (!visible || !product) return <Missing label="Product" />;
  const currency = site?.settings?.commerce?.currency ?? "USD";
  const template = pickTemplate(blueprints, "product-single");
  const document: DynamicDocument = {
    kind: "product",
    id: product._id,
    title: product.name,
    slug: product.slug,
    price: formatPrice(product.price, currency),
    href: publicPath("product", product.slug),
    image: product.images?.[0],
    fields: { price: String(product.price) },
  };
  return (
    <TemplatedDocument
      document={document}
      template={template?.content.blocks ?? defaultBlueprintTree("template", "product-single")}
      body={product.description?.blocks ?? []}
    />
  );
}

export function SiteSearch() {
  const { blueprints } = useHMS();
  const template = pickTemplate(blueprints, "search");
  if (template) return <BlockRenderer blocks={template.content.blocks} />;
  const collection = createBlock("collection");
  collection.content = {
    ...collection.content,
    source: "posts",
    layout: "list",
    searchParam: "q",
    limit: 12,
  };
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-4xl font-semibold tracking-tight">Search</h1>
      <BlockRenderer blocks={[collection]} />
    </div>
  );
}

function TermsEditor({
  value,
  options,
  onChange,
}: {
  value: string[];
  options: string[];
  onChange: (terms: string[]) => void;
}) {
  const choices = [...new Set([...options, ...value])];
  if (choices.length === 0) {
    return (
      <input
        className="h-8 rounded-md border bg-background px-2"
        placeholder="design, build"
        value={value.join(", ")}
        onChange={(event) =>
          onChange(
            event.target.value
              .split(",")
              .map((part) => part.trim())
              .filter(Boolean),
          )
        }
      />
    );
  }
  return (
    <div className="flex flex-wrap gap-2">
      {choices.map((term) => {
        const active = value.includes(term);
        return (
          <button
            key={term}
            type="button"
            className={`rounded border px-2 py-1 text-xs ${active ? "bg-muted" : ""}`}
            onClick={() =>
              onChange(active ? value.filter((item) => item !== term) : [...value, term])
            }
          >
            {term}
          </button>
        );
      })}
    </div>
  );
}

function RepeaterEditor({
  rows,
  subfields,
  onChange,
}: {
  rows: Record<string, string>[];
  subfields: { key: string; label: string }[];
  onChange: (rows: Record<string, string>[]) => void;
}) {
  const keys = subfields.length > 0 ? subfields : [{ key: "value", label: "Value" }];
  return (
    <div className="flex flex-col gap-2">
      {rows.map((row, index) => (
        <div key={index} className="flex flex-wrap gap-2">
          {keys.map((sub) => (
            <input
              key={sub.key}
              className="h-8 min-w-32 flex-1 rounded-md border bg-background px-2"
              placeholder={sub.label}
              value={row[sub.key] ?? ""}
              onChange={(event) => {
                const next = rows.map((item, i) =>
                  i === index ? { ...item, [sub.key]: event.target.value } : item,
                );
                onChange(next);
              }}
            />
          ))}
          <button
            type="button"
            className="text-xs text-destructive"
            onClick={() => onChange(rows.filter((_, i) => i !== index))}
          >
            Remove
          </button>
        </div>
      ))}
      <button
        type="button"
        className="self-start text-xs underline"
        onClick={() => onChange([...rows, {}])}
      >
        Add row
      </button>
    </div>
  );
}

function Missing({ label }: { label: string }) {
  const { blueprints } = useHMS();
  const template = pickTemplate(blueprints, "404");
  if (template) return <BlockRenderer blocks={template.content.blocks} />;
  return (
    <div className="flex flex-col items-center gap-2 py-24 text-center">
      <span className="text-sm font-medium">{label} not found</span>
      <span className="text-sm text-muted-foreground">Publish it and it will appear here.</span>
      <Button size="sm" nativeButton={false} render={<Link to="/" />}>
        Home
      </Button>
    </div>
  );
}
