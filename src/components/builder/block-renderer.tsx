import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useCollectionData } from "@/components/site/collection-data";
import {
  DynamicDocumentOverride,
  useDocumentBody,
  useDynamicContext,
} from "@/components/builder/dynamic-context";
import { useEditorRender } from "@/components/builder/editor-context";
import { useCart } from "@/components/site/cart";
import { useHMS } from "@/hooks/use-hms";
import { toast } from "@/components/ui/lib";
import type { DynamicDocument } from "@/lib/dynamic";
import {
  formatPrice,
  publicPath,
  relativeTime,
  type Block,
  type BlockContent,
  type CollectionLayout,
  type CollectionSource,
} from "@/lib/content";
import { applyBindings, explainVisibility, isVisible, visibilityFallback } from "@/lib/dynamic";
import { queryItems } from "@/lib/query";
import { decorateEntryFields, parseRepeater } from "@/lib/blueprints";
import { alignClass, hideOnClass, styleToCss } from "@/lib/style";
import { cn } from "@/lib/utils";

function LoopGrid({
  items,
  blocks,
  layout,
  columns,
}: {
  items: LoopCard[];
  blocks: Block[];
  layout: CollectionLayout;
  columns: number;
}) {
  const paint = (item: LoopCard) => (
    <DynamicDocumentOverride document={item.document}>
      <Link to={item.href} className="flex h-full flex-col gap-3 rounded-xl border p-4">
        {blocks.map((block) => (
          <BlockView key={`${item.id}-${block.id}`} block={block} />
        ))}
      </Link>
    </DynamicDocumentOverride>
  );

  if (layout === "list" || layout === "table") {
    return <div className="flex flex-col gap-3">{items.map((item) => paint(item))}</div>;
  }
  if (layout === "carousel") {
    return (
      <Carousel className="w-full">
        <CarouselContent>
          {items.map((item) => (
            <CarouselItem key={item.id} className="basis-full sm:basis-1/2 lg:basis-1/3">
              {paint(item)}
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    );
  }
  return (
    <div
      className={cn(
        "grid gap-4",
        columns >= 4 ? "sm:grid-cols-4" : columns === 2 ? "sm:grid-cols-2" : "sm:grid-cols-3",
      )}
    >
      {items.map((item) => (
        <div key={item.id}>{paint(item)}</div>
      ))}
    </div>
  );
}

function FieldControl({ content }: { content: BlockContent }) {
  const name = content.title || "field";
  const type = content.fieldType ?? "text";
  if (type === "textarea") {
    return (
      <label className="flex flex-col gap-1.5 text-sm">
        {content.title}
        <Textarea
          name={name}
          rows={4}
          placeholder={content.placeholder}
          required={content.required}
        />
      </label>
    );
  }
  if (type === "select") {
    return (
      <label className="flex flex-col gap-1.5 text-sm">
        {content.title}
        <select
          name={name}
          required={content.required}
          className="h-8 rounded-md border bg-background px-2 text-sm"
        >
          {(content.items ?? ["Option"]).map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </label>
    );
  }
  if (type === "checkbox") {
    return (
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name={name} />
        {content.title}
      </label>
    );
  }
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      {content.title}
      <Input
        name={name}
        type={
          type === "number"
            ? "number"
            : type === "email"
              ? "email"
              : type === "url"
                ? "url"
                : "text"
        }
        placeholder={content.placeholder}
        required={content.required}
      />
    </label>
  );
}

function FormBlock({ block, content }: { block: Block; content: BlockContent }) {
  const hms = useHMS();
  const navigate = useNavigate();
  const [values, setValues] = useState<Record<string, string>>({});
  const fields = (block.children ?? []).filter((child) => child.type === "field");
  const legacy = fields.length === 0 ? (content.items ?? []) : [];

  const visibleFields = fields.filter((field) => {
    const when = field.content.showWhenField;
    if (!when) return true;
    return (values[when] ?? "") === (field.content.showWhenValue ?? "");
  });

  return (
    <form
      className="flex max-w-md flex-col gap-3 rounded-2xl border p-6"
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const next: Record<string, string> = {};
        data.forEach((value, key) => {
          next[key] = typeof value === "string" ? value : "";
        });
        void (async () => {
          await hms.submitForm(block.id, next);
          if (content.formAction === "create-entry" && content.formTarget) {
            const type = hms.contentTypes.find((item) => item.slug === content.formTarget);
            if (type) {
              await hms.createEntry({
                contentTypeId: type._id,
                title: next.Name || next.Title || next.title || "Submission",
                fields: next,
              });
            }
          }
          toast.add({
            title:
              content.formAction === "email"
                ? `Saved. Email ${content.formTarget || "queued"}`
                : "Sent",
            type: "success",
          });
          const dest =
            content.formAction === "redirect" ? content.formTarget : content.formRedirect;
          if (dest) {
            void navigate(dest);
            return;
          }
          event.currentTarget.reset();
          setValues({});
        })();
      }}
    >
      {content.title && <h2 className="text-2xl font-semibold tracking-tight">{content.title}</h2>}
      {content.subtitle && <p className="text-sm text-muted-foreground">{content.subtitle}</p>}
      {visibleFields.map((field) => (
        <div
          key={field.id}
          onChange={(event) => {
            const target = event.target as
              | HTMLInputElement
              | HTMLTextAreaElement
              | HTMLSelectElement;
            if (target.name) setValues((current) => ({ ...current, [target.name]: target.value }));
          }}
        >
          <BlockView block={field} />
        </div>
      ))}
      {legacy.map((item) => (
        <label key={item} className="flex flex-col gap-1.5 text-sm">
          {item}
          {item.toLowerCase().includes("message") ? (
            <Textarea rows={4} name={item} />
          ) : (
            <Input name={item} />
          )}
        </label>
      ))}
      <Button type="submit">{content.buttonText || "Send"}</Button>
    </form>
  );
}

function ComponentBlock({ blueprintId }: { blueprintId?: string }) {
  const data = useCollectionData();
  const blueprint = data.blueprints.find(
    (item) => item._id === blueprintId && item.kind === "component",
  );
  if (!blueprint || blueprint.content.blocks.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
        Pick a component in the inspector.
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-6">
      {blueprint.content.blocks.map((child) => (
        <BlockView key={child.id} block={child} />
      ))}
    </div>
  );
}

function DocumentContentSlot() {
  const body = useDocumentBody();
  const editor = useEditorRender();
  if (!body || body.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-8 text-sm text-muted-foreground">
        {editor?.editing
          ? "Document body — the entry or post blocks land here."
          : "Nothing in this document yet."}
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-8">
      {body.map((child) => (
        <BlockView key={child.id} block={child} />
      ))}
    </div>
  );
}

function splitFaq(item: string): [string, string] {
  const parts = item.split(/\s+[—–-]\s+|:\s+/);
  if (parts.length >= 2) return [parts[0], parts.slice(1).join(" — ")];
  return [item, ""];
}

function embedUrl(url: string): string | null {
  const youtube = url.match(/(?:youtu\.be\/|v=)([\w-]{11})/);
  if (youtube) return `https://www.youtube.com/embed/${youtube[1]}`;
  const vimeo = url.match(/vimeo\.com\/(\d+)/);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;
  return null;
}

function VideoFrame({ url, title }: { url: string; title?: string }) {
  const embed = embedUrl(url);
  if (embed) {
    return (
      <iframe
        src={embed}
        title={title || "Video"}
        className="aspect-video w-full rounded-xl border"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    );
  }
  if (!url) {
    return (
      <div className="flex aspect-video items-center justify-center rounded-xl border border-dashed text-sm text-muted-foreground">
        Add a video URL
      </div>
    );
  }
  return (
    <video
      src={url}
      controls
      className="aspect-video w-full rounded-xl border bg-black"
      title={title}
    >
      <track kind="captions" />
    </video>
  );
}

type LoopCard = {
  id: string;
  title: string;
  meta: string;
  href: string;
  image?: string;
  updatedAt?: number;
  fields?: Record<string, string>;
  document: DynamicDocument;
};

function collectionItems(
  data: ReturnType<typeof useCollectionData>,
  source: CollectionSource,
): LoopCard[] {
  if (source === "pages") {
    return data.pages
      .filter((page) => page.status === "published")
      .map((page) => ({
        id: page._id,
        title: page.title,
        meta: page.slug,
        href: publicPath("page", page.slug),
        image: undefined,
        updatedAt: page.updatedAt,
        document: {
          kind: "page",
          id: page._id,
          title: page.title,
          slug: page.slug,
          href: publicPath("page", page.slug),
        },
      }));
  }
  if (source === "posts") {
    return data.posts
      .filter((post) => post.status === "published")
      .map((post) => ({
        id: post._id,
        title: post.title,
        meta: post.excerpt || relativeTime(post.updatedAt),
        href: publicPath("post", post.slug),
        image: post.coverImage,
        updatedAt: post.updatedAt,
        fields: { excerpt: post.excerpt ?? "" },
        document: {
          kind: "post",
          id: post._id,
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt,
          href: publicPath("post", post.slug),
          image: post.coverImage,
        },
      }));
  }
  if (source === "products") {
    const currency = data.site?.settings?.commerce?.currency ?? "USD";
    return data.products
      .filter((product) => product.status === "active")
      .map((product) => ({
        id: product._id,
        title: product.name,
        meta: formatPrice(product.price, currency),
        href: publicPath("product", product.slug),
        image: product.images?.[0],
        updatedAt: product.updatedAt,
        fields: { price: String(product.price) },
        document: {
          kind: "product",
          id: product._id,
          title: product.name,
          slug: product.slug,
          price: formatPrice(product.price, currency),
          href: publicPath("product", product.slug),
          image: product.images?.[0],
        },
      }));
  }
  if (source === "media") {
    return data.media.map((item) => ({
      id: item._id,
      title: item.name,
      meta: item.mimeType,
      href: item.url ?? "#",
      image: item.mimeType.startsWith("image/") ? item.url : undefined,
      updatedAt: item.createdAt,
      document: {
        kind: "page",
        id: item._id,
        title: item.name,
        slug: item.name,
        href: item.url ?? "#",
        image: item.mimeType.startsWith("image/") ? item.url : undefined,
      },
    }));
  }
  const type = data.contentTypes.find((item) => item.slug === source);
  if (!type) return [];
  return data.entries
    .filter((entry) => entry.contentTypeId === type._id && entry.status === "published")
    .map((entry) => {
      const decorated = decorateEntryFields(entry.fields, type.fields, (id) => {
        const related = data.entries.find((item) => item._id === id);
        if (!related) return undefined;
        const relatedType = data.contentTypes.find((item) => item._id === related.contentTypeId);
        return {
          id,
          title: related.title,
          slug: related.slug,
          href: publicPath("entry", related.slug, relatedType?.slug),
        };
      });
      return {
        id: entry._id,
        title: entry.title,
        meta: entry.fields.client || entry.slug,
        href: publicPath("entry", entry.slug, type.slug),
        image: entry.fields.image,
        updatedAt: entry.updatedAt,
        fields: entry.fields,
        document: {
          kind: "entry" as const,
          id: entry._id,
          title: entry.title,
          slug: entry.slug,
          excerpt: entry.fields.outcome || entry.fields.excerpt,
          href: publicPath("entry", entry.slug, type.slug),
          image: entry.fields.image,
          fields: entry.fields,
          ...decorated,
        },
      };
    });
}

function CollectionView({
  source,
  layout,
  limit,
  columns,
  loopItemId,
  query,
}: {
  source: CollectionSource;
  layout: CollectionLayout;
  limit: number;
  columns: number;
  loopItemId?: string;
  query: {
    sort?: BlockContent["sort"];
    sortField?: string;
    filterField?: string;
    filterCompare?: BlockContent["filterCompare"];
    filterValue?: string;
    excludeCurrent?: boolean;
    relatedField?: string;
    offset?: number;
    paginate?: boolean;
    searchParam?: string;
    emptyTitle?: string;
    emptyBody?: string;
    loadMore?: boolean;
    facetField?: string;
  };
}) {
  const data = useCollectionData();
  const dynamic = useDynamicContext();
  const [params] = useSearchParams();
  const [extra, setExtra] = useState(0);
  const raw = source.startsWith("repeater:")
    ? (
        dynamic.document?.repeaters?.[source.slice(9)] ??
        parseRepeater(dynamic.document?.fields?.[source.slice(9)])
      ).map((row, index) => ({
        id: `${source}-${index}`,
        title: Object.values(row)[0] || `Row ${index + 1}`,
        meta: Object.values(row).slice(1).join(" · "),
        href: dynamic.document?.href ?? "#",
        fields: row,
        document: {
          kind: "entry" as const,
          title: Object.values(row)[0] || `Row ${index + 1}`,
          slug: `${dynamic.document?.slug ?? "row"}-${index}`,
          fields: row,
        },
      }))
    : collectionItems(data, source);
  const result = queryItems(
    raw,
    {
      ...query,
      limit: query.loadMore ? limit + extra : limit,
      paginate: query.loadMore ? false : query.paginate,
      page: Number(params.get("page") || "1"),
      facetField: query.facetField,
    },
    dynamic,
  );
  const items = result.items;
  const loop = loopItemId
    ? data.blueprints.find((item) => item._id === loopItemId && item.kind === "loop-item")
    : undefined;

  const searchKey = query.searchParam || "q";
  const tools = (
    <div className="flex flex-col gap-3">
      {query.searchParam && (
        <form method="get" className="flex gap-2">
          <Input name={searchKey} defaultValue={params.get(searchKey) ?? ""} placeholder="Search" />
          <Button type="submit" size="sm">
            Search
          </Button>
        </form>
      )}
      {query.facetField && (
        <div className="flex flex-wrap gap-2 text-xs">
          {[
            ...new Set(
              raw
                .map(
                  (item) =>
                    item.fields?.[query.facetField ?? ""] ??
                    item.document.fields?.[query.facetField ?? ""] ??
                    "",
                )
                .flatMap((value) => value.split(",").map((part) => part.trim()))
                .filter(Boolean),
            ),
          ].map((facet) => {
            const next = new URLSearchParams(params);
            const active = params.get(query.facetField ?? "") === facet;
            if (active) next.delete(query.facetField ?? "");
            else next.set(query.facetField ?? "", facet);
            return (
              <Link
                key={facet}
                to={`?${next.toString()}`}
                className={cn("rounded border px-2 py-1", active && "bg-muted")}
              >
                {facet}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );

  if (items.length === 0) {
    return (
      <div className="flex flex-col gap-3">
        {tools}
        <p className="text-sm font-medium">{query.emptyTitle || "Nothing here yet."}</p>
        {query.emptyBody && <p className="text-sm text-muted-foreground">{query.emptyBody}</p>}
      </div>
    );
  }

  const pager =
    query.paginate && result.pages > 1 ? (
      <CollectionPager page={result.page} pages={result.pages} />
    ) : null;

  const more =
    query.loadMore && result.total > items.length ? (
      <Button size="sm" variant="outline" onClick={() => setExtra((value) => value + limit)}>
        Load more
      </Button>
    ) : null;

  if (loop) {
    return (
      <div className="flex flex-col gap-4">
        {tools}
        <LoopGrid items={items} blocks={loop.content.blocks} layout={layout} columns={columns} />
        {pager}
        {more}
      </div>
    );
  }

  if (layout === "table") {
    return (
      <div className="overflow-hidden rounded-xl border">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-2 font-medium">Title</th>
              <th className="px-4 py-2 font-medium">Detail</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {items.map((item) => (
              <tr key={item.id}>
                <td className="px-4 py-3">
                  <Link to={item.href} className="font-medium hover:underline">
                    {item.title}
                  </Link>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{item.meta}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (layout === "list") {
    return (
      <div className="flex flex-col divide-y rounded-xl border">
        {items.map((item) => (
          <Link
            key={item.id}
            to={item.href}
            className="flex flex-col gap-1 px-4 py-4 hover:bg-muted/40"
          >
            <span className="font-medium">{item.title}</span>
            <span className="text-sm text-muted-foreground">{item.meta}</span>
          </Link>
        ))}
      </div>
    );
  }

  if (layout === "carousel") {
    return (
      <Carousel className="w-full">
        <CarouselContent>
          {items.map((item) => (
            <CarouselItem key={item.id} className="basis-full sm:basis-1/2 lg:basis-1/3">
              <Link to={item.href} className="flex h-full flex-col gap-2 rounded-xl border p-4">
                {item.image && (
                  <img
                    src={item.image}
                    alt=""
                    className="aspect-video w-full rounded-lg object-cover"
                  />
                )}
                <span className="font-medium">{item.title}</span>
                <span className="text-sm text-muted-foreground">{item.meta}</span>
              </Link>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    );
  }

  if (layout === "gallery") {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {items.map((item) => (
          <Link key={item.id} to={item.href} className="group overflow-hidden rounded-xl border">
            {item.image ? (
              <img
                src={item.image}
                alt={item.title}
                className="aspect-square w-full object-cover"
              />
            ) : (
              <div className="flex aspect-square items-center justify-center bg-muted px-3 text-center text-sm">
                {item.title}
              </div>
            )}
          </Link>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {tools}
      <div
        className={cn(
          "grid gap-4",
          columns >= 4 ? "sm:grid-cols-4" : columns === 2 ? "sm:grid-cols-2" : "sm:grid-cols-3",
        )}
      >
        {items.map((item) => (
          <Link
            key={item.id}
            to={item.href}
            className="flex flex-col gap-2 rounded-xl border p-4 hover:bg-muted/30"
          >
            {item.image && (
              <img
                src={item.image}
                alt=""
                className="aspect-video w-full rounded-lg object-cover"
              />
            )}
            <span className="font-medium">{item.title}</span>
            <span className="text-sm text-muted-foreground">{item.meta}</span>
          </Link>
        ))}
      </div>
      {pager}
      {more}
    </div>
  );
}

function SiteMenu() {
  const data = useCollectionData();
  const links = [
    { href: "/", label: data.site?.name || "Home" },
    ...data.pages
      .filter((page) => page.status === "published" && page.slug !== "home")
      .map((page) => ({ href: publicPath("page", page.slug), label: page.title })),
    ...(data.posts.some((post) => post.status === "published")
      ? [{ href: "/blog", label: "Blog" }]
      : []),
    ...(data.products.some((product) => product.status === "active")
      ? [{ href: "/shop", label: "Shop" }]
      : []),
    ...data.contentTypes.map((type) => ({ href: `/${type.slug}`, label: type.plural })),
    { href: "/search", label: "Search" },
  ];
  return (
    <nav className="flex flex-wrap items-center gap-4 text-sm">
      {links.map((link) => (
        <Link
          key={link.href}
          to={link.href}
          className="text-muted-foreground hover:text-foreground"
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}

function SearchBox({ placeholder }: { placeholder?: string }) {
  const [params] = useSearchParams();
  return (
    <form action="/search" method="get" className="flex max-w-md gap-2">
      <Input name="q" defaultValue={params.get("q") ?? ""} placeholder={placeholder || "Search"} />
      <Button type="submit" size="sm">
        Search
      </Button>
    </form>
  );
}

function AddToCartButton({ label }: { label?: string }) {
  const cart = useCart();
  const dynamic = useDynamicContext();
  const doc = dynamic.document;
  const price = Number((doc?.price ?? "").replace(/[^0-9.]/g, "")) * 100;
  const cents = Number.isFinite(price) ? Math.round(price) : 0;
  return (
    <Button
      type="button"
      disabled={!doc || doc.kind !== "product"}
      onClick={() => {
        if (!doc) return;
        cart.add({
          id: doc.id || doc.slug,
          title: doc.title,
          href: doc.href || `/shop/${doc.slug}`,
          priceCents: cents || Number(doc.fields?.price ?? 0),
        });
      }}
    >
      {label || "Add to cart"}
    </Button>
  );
}

function CartPanel({ title }: { title?: string }) {
  const cart = useCart();
  const currency = useCollectionData().site?.settings?.commerce?.currency ?? "USD";
  if (cart.lines.length === 0) {
    return <p className="text-sm text-muted-foreground">{title || "Cart"} is empty.</p>;
  }
  return (
    <div className="flex flex-col gap-3">
      {title && <h2 className="text-lg font-semibold">{title}</h2>}
      {cart.lines.map((line) => (
        <div key={line.id} className="flex items-center justify-between gap-3 text-sm">
          <Link to={line.href} className="font-medium hover:underline">
            {line.title}
          </Link>
          <span className="text-muted-foreground">
            {line.qty} × {formatPrice(line.priceCents, currency)}
          </span>
          <button
            type="button"
            className="text-xs text-destructive"
            onClick={() => cart.setQty(line.id, 0)}
          >
            Remove
          </button>
        </div>
      ))}
      <p className="text-sm font-medium">Total {formatPrice(cart.totalCents, currency)}</p>
    </div>
  );
}

function CollectionPager({ page, pages }: { page: number; pages: number }) {
  const [params] = useSearchParams();
  const hrefFor = (nextPage: number) => {
    const next = new URLSearchParams(params);
    next.set("page", String(nextPage));
    return `?${next.toString()}`;
  };
  return (
    <div className="flex items-center gap-3 text-sm">
      {page > 1 && (
        <Link to={hrefFor(page - 1)} className="underline">
          Previous
        </Link>
      )}
      <span className="text-muted-foreground">
        {page} / {pages}
      </span>
      {page < pages && (
        <Link to={hrefFor(page + 1)} className="underline">
          Next
        </Link>
      )}
    </div>
  );
}

function EditableText({
  id,
  field,
  value,
  as: Tag,
  className,
  bound,
}: {
  id: string;
  field: keyof BlockContent;
  value?: string;
  as: "h1" | "h2" | "h3" | "p" | "span" | "footer";
  className?: string;
  bound?: boolean;
}) {
  const editor = useEditorRender();
  const live = Boolean(editor?.editing && editor.selectedId === id && !bound);
  if (!live) {
    return <Tag className={className}>{value}</Tag>;
  }
  return (
    <Tag
      className={cn(className, "rounded-sm outline-none focus:ring-1 focus:ring-foreground/30")}
      contentEditable
      suppressContentEditableWarning
      onBlur={(event) => editor?.onInline(id, { [field]: event.currentTarget.textContent ?? "" })}
      onClick={(event) => event.stopPropagation()}
    >
      {value}
    </Tag>
  );
}

export function BlockView({ block }: { block: Block }) {
  const dynamic = useDynamicContext();
  const editor = useEditorRender();
  const breakpoint = editor?.breakpoint ?? "desktop";
  const content = applyBindings(block.content, block.bindings, dynamic);
  const visible = isVisible(block.visibility, dynamic, breakpoint);

  if (block.hidden && !editor?.editing) return null;
  if (!visible && !editor?.editing) {
    const fallback = visibilityFallback(block.visibility, dynamic);
    if (!fallback) return null;
    return <p className="text-sm text-muted-foreground">{fallback}</p>;
  }

  const rendered = { ...block, content };
  const align = content.align ?? block.style?.align ?? (block.type === "hero" ? "center" : "left");

  return (
    <div
      id={block.htmlId || undefined}
      className={cn(
        block.cssClass,
        hideOnClass(block.visibility?.hideOn),
        !visible && "relative opacity-60",
      )}
      style={styleToCss(block.style)}
      data-block={block.type}
    >
      {!visible && editor?.editing && (
        <div className="mb-2 flex flex-col gap-1">
          <span className="inline-block w-fit rounded border px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
            Hidden by condition
          </span>
          {explainVisibility(block.visibility, dynamic, breakpoint).lines.map((line) => (
            <span key={line} className="text-[10px] text-muted-foreground">
              {line}
            </span>
          ))}
        </div>
      )}
      <BlockInner block={rendered} align={align} />
    </div>
  );
}

function BlockInner({ block, align }: { block: Block; align: "left" | "center" | "right" }) {
  const content = block.content;
  const stack = alignClass(align);

  if (block.type === "heading") {
    const Tag = content.level === 1 ? "h1" : content.level === 3 ? "h3" : "h2";
    const size =
      content.level === 1
        ? "text-5xl font-semibold tracking-tight"
        : content.level === 3
          ? "text-xl font-semibold"
          : "text-3xl font-semibold tracking-tight";
    return (
      <EditableText
        id={block.id}
        field="title"
        value={content.title}
        as={Tag}
        className={size}
        bound={Boolean(block.bindings?.title)}
      />
    );
  }

  if (block.type === "text") {
    return (
      <EditableText
        id={block.id}
        field="body"
        value={content.body}
        as="p"
        className="max-w-3xl text-base leading-relaxed text-muted-foreground"
        bound={Boolean(block.bindings?.body)}
      />
    );
  }

  if (block.type === "button") {
    return (
      <Button nativeButton={false} render={<Link to={content.buttonHref || "/"} />}>
        {content.buttonText}
      </Button>
    );
  }

  if (block.type === "divider") {
    return <hr className="border-border" />;
  }

  if (block.type === "spacer") {
    return <div className="h-12" />;
  }

  if (block.type === "html") {
    return (
      <div
        className="prose prose-neutral dark:prose-invert max-w-none"
        dangerouslySetInnerHTML={{ __html: content.body ?? "" }}
      />
    );
  }

  if (block.type === "form") {
    return <FormBlock block={block} content={content} />;
  }

  if (block.type === "field") {
    return <FieldControl content={content} />;
  }

  if (block.type === "component") {
    return <ComponentBlock blueprintId={content.blueprintId} />;
  }

  if (block.type === "document-content") {
    return <DocumentContentSlot />;
  }

  if (block.type === "quote") {
    return (
      <blockquote className="max-w-2xl border-l-2 pl-5">
        <EditableText
          id={block.id}
          field="body"
          value={content.body}
          as="p"
          className="text-xl leading-snug"
          bound={Boolean(block.bindings?.body)}
        />
        {content.title && (
          <EditableText
            id={block.id}
            field="title"
            value={content.title}
            as="footer"
            className="mt-3 text-sm text-muted-foreground"
            bound={Boolean(block.bindings?.title)}
          />
        )}
      </blockquote>
    );
  }

  if (block.type === "image") {
    return content.url ? (
      <figure className="flex flex-col gap-2">
        <img
          src={content.url}
          alt={content.title || ""}
          className="w-full rounded-xl object-cover"
        />
        {content.title && (
          <figcaption className="text-sm text-muted-foreground">{content.title}</figcaption>
        )}
      </figure>
    ) : (
      <div className="flex aspect-video items-center justify-center rounded-xl border border-dashed text-sm text-muted-foreground">
        Add an image
      </div>
    );
  }

  if (block.type === "video") {
    return <VideoFrame url={content.url ?? ""} title={content.title} />;
  }

  if (block.type === "gallery") {
    const urls = content.urls?.filter(Boolean) ?? [];
    if (urls.length === 0) {
      return (
        <div className="flex aspect-video items-center justify-center rounded-xl border border-dashed text-sm text-muted-foreground">
          Add image URLs, one per line
        </div>
      );
    }
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {urls.map((url) => (
          <img
            key={url}
            src={url}
            alt=""
            className="aspect-square w-full rounded-xl object-cover"
          />
        ))}
      </div>
    );
  }

  if (block.type === "video-gallery") {
    const urls = content.urls?.filter(Boolean) ?? [];
    if (urls.length === 0) {
      return (
        <div className="flex aspect-video items-center justify-center rounded-xl border border-dashed text-sm text-muted-foreground">
          Add video URLs, one per line
        </div>
      );
    }
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        {urls.map((url) => (
          <VideoFrame key={url} url={url} />
        ))}
      </div>
    );
  }

  if (block.type === "hero") {
    return (
      <div className={cn("flex flex-col gap-5 py-16", stack)}>
        <EditableText
          id={block.id}
          field="title"
          value={content.title}
          as="h1"
          className="max-w-4xl text-5xl font-semibold tracking-tight sm:text-6xl"
          bound={Boolean(block.bindings?.title)}
        />
        <EditableText
          id={block.id}
          field="subtitle"
          value={content.subtitle}
          as="p"
          className="max-w-xl text-lg text-muted-foreground"
          bound={Boolean(block.bindings?.subtitle)}
        />
        {content.buttonText && (
          <Button size="lg" nativeButton={false} render={<Link to={content.buttonHref || "/"} />}>
            {content.buttonText}
          </Button>
        )}
      </div>
    );
  }

  if (block.type === "cta") {
    return (
      <div className="flex flex-col items-start justify-between gap-6 rounded-2xl border bg-muted/40 px-8 py-10 sm:flex-row sm:items-center">
        <div className="flex flex-col gap-2">
          <EditableText
            id={block.id}
            field="title"
            value={content.title}
            as="h2"
            className="text-2xl font-semibold tracking-tight"
            bound={Boolean(block.bindings?.title)}
          />
          <EditableText
            id={block.id}
            field="subtitle"
            value={content.subtitle}
            as="p"
            className="text-sm text-muted-foreground"
            bound={Boolean(block.bindings?.subtitle)}
          />
        </div>
        {content.buttonText && (
          <Button nativeButton={false} render={<Link to={content.buttonHref || "/"} />}>
            {content.buttonText}
          </Button>
        )}
      </div>
    );
  }

  if (
    block.type === "features" ||
    block.type === "stats" ||
    block.type === "logos" ||
    block.type === "pricing"
  ) {
    return (
      <div className="flex flex-col gap-6">
        {content.title && (
          <h2 className="text-2xl font-semibold tracking-tight">{content.title}</h2>
        )}
        <div className="grid gap-3 sm:grid-cols-3">
          {(content.items ?? []).map((item) => (
            <div key={item} className="rounded-xl border p-5 text-sm font-medium">
              {item}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (block.type === "testimonials") {
    return (
      <div className="flex flex-col gap-6">
        {content.title && (
          <h2 className="text-2xl font-semibold tracking-tight">{content.title}</h2>
        )}
        <div className="flex flex-col gap-3">
          {(content.items ?? []).map((item) => (
            <div key={item} className="rounded-xl border p-5 text-sm leading-relaxed">
              {item}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (block.type === "faq") {
    return (
      <div className="flex flex-col gap-6">
        {content.title && (
          <h2 className="text-2xl font-semibold tracking-tight">{content.title}</h2>
        )}
        <Accordion>
          {(content.items ?? []).map((item, index) => {
            const [question, answer] = splitFaq(item);
            return (
              <AccordionItem key={`${item}-${index}`} value={`faq-${index}`}>
                <AccordionTrigger>{question}</AccordionTrigger>
                {answer && <AccordionContent>{answer}</AccordionContent>}
              </AccordionItem>
            );
          })}
        </Accordion>
      </div>
    );
  }

  if (block.type === "section") {
    return (
      <div className={cn("flex flex-col gap-8", stack)}>
        {content.title && (
          <h2 className="text-2xl font-semibold tracking-tight">{content.title}</h2>
        )}
        {(block.children ?? []).map((child) => (
          <BlockView key={child.id} block={child} />
        ))}
      </div>
    );
  }

  if (block.type === "columns" || block.type === "column") {
    const count = block.children?.length || content.columns || 1;
    return (
      <div
        className={cn(
          "grid gap-6",
          count >= 4 ? "md:grid-cols-4" : count === 2 ? "md:grid-cols-2" : "md:grid-cols-3",
        )}
      >
        {(block.children ?? []).map((child) => (
          <div key={child.id} className="flex min-h-16 flex-col gap-4">
            {child.type === "column" ? (
              child.children?.length ? (
                child.children.map((nested) => <BlockView key={nested.id} block={nested} />)
              ) : (
                <div className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
                  Empty column
                </div>
              )
            ) : (
              <BlockView block={child} />
            )}
          </div>
        ))}
      </div>
    );
  }

  if (block.type === "menu") {
    return <SiteMenu />;
  }

  if (block.type === "search") {
    return <SearchBox placeholder={content.placeholder} />;
  }

  if (block.type === "add-to-cart") {
    return <AddToCartButton label={content.buttonText} />;
  }

  if (block.type === "cart") {
    return <CartPanel title={content.title} />;
  }

  if (block.type === "collection") {
    return (
      <div className="flex flex-col gap-6">
        {content.title && (
          <h2 className="text-2xl font-semibold tracking-tight">{content.title}</h2>
        )}
        <CollectionView
          source={content.source ?? "posts"}
          layout={content.layout ?? "grid"}
          limit={content.limit ?? 6}
          columns={content.columns ?? 3}
          loopItemId={content.loopItemId}
          query={{
            sort: content.sort,
            sortField: content.sortField,
            filterField: content.filterField,
            filterCompare: content.filterCompare,
            filterValue: content.filterValue,
            excludeCurrent: content.excludeCurrent,
            relatedField: content.relatedField,
            offset: content.offset,
            paginate: content.paginate,
            searchParam: content.searchParam,
            emptyTitle: content.emptyTitle,
            emptyBody: content.emptyBody,
            loadMore: content.loadMore,
            facetField: content.facetField,
          }}
        />
      </div>
    );
  }

  return null;
}

export function BlockRenderer({ blocks, tight }: { blocks: Block[]; tight?: boolean }) {
  if (blocks.length === 0) {
    if (tight) return null;
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-24 text-center">
        <span className="text-sm font-medium">This page is empty</span>
        <span className="text-sm text-muted-foreground">Edit it and drop a block in.</span>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col", tight ? "gap-4" : "gap-16")}>
      {blocks.map((block) => (
        <section key={block.id}>
          <BlockView block={block} />
        </section>
      ))}
    </div>
  );
}
