import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { useCollectionData } from "@/components/site/collection-data";
import {
  formatPrice,
  publicPath,
  relativeTime,
  type Block,
  type CollectionLayout,
  type CollectionSource,
} from "@/lib/content";
import { cn } from "@/lib/utils";

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

function CollectionView({
  source,
  layout,
  limit,
  columns,
}: {
  source: CollectionSource;
  layout: CollectionLayout;
  limit: number;
  columns: number;
}) {
  const data = useCollectionData();
  const items =
    source === "pages"
      ? data.pages
          .filter((page) => page.status === "published")
          .slice(0, limit)
          .map((page) => ({
            id: page._id,
            title: page.title,
            meta: page.slug,
            href: publicPath("page", page.slug),
            image: undefined as string | undefined,
          }))
      : source === "posts"
        ? data.posts
            .filter((post) => post.status === "published")
            .slice(0, limit)
            .map((post) => ({
              id: post._id,
              title: post.title,
              meta: post.excerpt || relativeTime(post.updatedAt),
              href: publicPath("post", post.slug),
              image: post.coverImage,
            }))
        : source === "products"
          ? data.products
              .filter((product) => product.status === "active")
              .slice(0, limit)
              .map((product) => ({
                id: product._id,
                title: product.name,
                meta: formatPrice(product.price, data.site?.settings?.commerce?.currency ?? "USD"),
                href: publicPath("product", product.slug),
                image: product.images?.[0],
              }))
          : data.media.slice(0, limit).map((item) => ({
              id: item._id,
              title: item.name,
              meta: item.mimeType,
              href: item.url ?? "#",
              image: item.mimeType.startsWith("image/") ? item.url : undefined,
            }));

  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">Nothing published in this collection yet.</p>
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
            <img src={item.image} alt="" className="aspect-video w-full rounded-lg object-cover" />
          )}
          <span className="font-medium">{item.title}</span>
          <span className="text-sm text-muted-foreground">{item.meta}</span>
        </Link>
      ))}
    </div>
  );
}

export function BlockView({ block }: { block: Block }) {
  const align = block.content.align ?? (block.type === "hero" ? "center" : "left");
  const alignClass =
    align === "center"
      ? "items-center text-center"
      : align === "right"
        ? "items-end text-right"
        : "items-start text-left";

  if (block.type === "heading") {
    const Tag = block.content.level === 1 ? "h1" : block.content.level === 3 ? "h3" : "h2";
    const size =
      block.content.level === 1
        ? "text-5xl font-semibold tracking-tight"
        : block.content.level === 3
          ? "text-xl font-semibold"
          : "text-3xl font-semibold tracking-tight";
    return <Tag className={size}>{block.content.title}</Tag>;
  }

  if (block.type === "text") {
    return (
      <p className="max-w-3xl text-base leading-relaxed text-muted-foreground">
        {block.content.body}
      </p>
    );
  }

  if (block.type === "button") {
    return (
      <Button nativeButton={false} render={<Link to={block.content.buttonHref || "/"} />}>
        {block.content.buttonText}
      </Button>
    );
  }

  if (block.type === "divider") {
    return <hr className="border-border" />;
  }

  if (block.type === "spacer") {
    return <div className="h-12" />;
  }

  if (block.type === "quote") {
    return (
      <blockquote className="max-w-2xl border-l-2 pl-5">
        <p className="text-xl leading-snug">{block.content.body}</p>
        {block.content.title && (
          <footer className="mt-3 text-sm text-muted-foreground">{block.content.title}</footer>
        )}
      </blockquote>
    );
  }

  if (block.type === "image") {
    return block.content.url ? (
      <figure className="flex flex-col gap-2">
        <img
          src={block.content.url}
          alt={block.content.title || ""}
          className="w-full rounded-xl object-cover"
        />
        {block.content.title && (
          <figcaption className="text-sm text-muted-foreground">{block.content.title}</figcaption>
        )}
      </figure>
    ) : (
      <div className="flex aspect-video items-center justify-center rounded-xl border border-dashed text-sm text-muted-foreground">
        Add an image
      </div>
    );
  }

  if (block.type === "video") {
    return <VideoFrame url={block.content.url ?? ""} title={block.content.title} />;
  }

  if (block.type === "gallery") {
    const urls = block.content.urls?.filter(Boolean) ?? [];
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
    const urls = block.content.urls?.filter(Boolean) ?? [];
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
      <div className={cn("flex flex-col gap-5 py-16", alignClass)}>
        <h1 className="max-w-4xl text-5xl font-semibold tracking-tight sm:text-6xl">
          {block.content.title}
        </h1>
        <p className="max-w-xl text-lg text-muted-foreground">{block.content.subtitle}</p>
        {block.content.buttonText && (
          <Button
            size="lg"
            nativeButton={false}
            render={<Link to={block.content.buttonHref || "/"} />}
          >
            {block.content.buttonText}
          </Button>
        )}
      </div>
    );
  }

  if (block.type === "cta") {
    return (
      <div className="flex flex-col items-start justify-between gap-6 rounded-2xl border bg-muted/40 px-8 py-10 sm:flex-row sm:items-center">
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-semibold tracking-tight">{block.content.title}</h2>
          <p className="text-sm text-muted-foreground">{block.content.subtitle}</p>
        </div>
        {block.content.buttonText && (
          <Button nativeButton={false} render={<Link to={block.content.buttonHref || "/"} />}>
            {block.content.buttonText}
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
        {block.content.title && (
          <h2 className="text-2xl font-semibold tracking-tight">{block.content.title}</h2>
        )}
        <div className="grid gap-3 sm:grid-cols-3">
          {(block.content.items ?? []).map((item) => (
            <div key={item} className="rounded-xl border p-5 text-sm font-medium">
              {item}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (block.type === "testimonials" || block.type === "faq") {
    return (
      <div className="flex flex-col gap-6">
        {block.content.title && (
          <h2 className="text-2xl font-semibold tracking-tight">{block.content.title}</h2>
        )}
        <div className="flex flex-col gap-3">
          {(block.content.items ?? []).map((item) => (
            <div key={item} className="rounded-xl border p-5 text-sm leading-relaxed">
              {item}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (block.type === "columns" || block.type === "column") {
    const count = block.children?.length || block.content.columns || 1;
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

  if (block.type === "collection") {
    return (
      <div className="flex flex-col gap-6">
        {block.content.title && (
          <h2 className="text-2xl font-semibold tracking-tight">{block.content.title}</h2>
        )}
        <CollectionView
          source={block.content.source ?? "posts"}
          layout={block.content.layout ?? "grid"}
          limit={block.content.limit ?? 6}
          columns={block.content.columns ?? 3}
        />
      </div>
    );
  }

  return null;
}

export function BlockRenderer({ blocks }: { blocks: Block[] }) {
  if (blocks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-24 text-center">
        <span className="text-sm font-medium">This page is empty</span>
        <span className="text-sm text-muted-foreground">Edit it and drop a block in.</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-16">
      {blocks.map((block) => (
        <section key={block.id}>
          <BlockView block={block} />
        </section>
      ))}
    </div>
  );
}
