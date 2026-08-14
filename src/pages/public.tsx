import { Link, Outlet, useParams, useSearchParams } from "react-router-dom";
import { BlockRenderer } from "@/components/builder/block-renderer";
import { Button } from "@/components/ui/button";
import { useHMS } from "@/hooks/use-hms";
import {
  formatPrice,
  normalizeContent,
  normalizeSlug,
  pickVariant,
  publicPath,
  relativeTime,
} from "@/lib/content";

export function PublicLayout() {
  const { site, pages, posts, products } = useHMS();
  const publishedPages = pages.filter((page) => page.status === "published");
  const publishedPosts = posts.filter((post) => post.status === "published");
  const liveProducts = products.filter((product) => product.status === "active");

  return (
    <div className="min-h-svh bg-background text-foreground">
      <header className="border-b">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-4">
          <Link to="/view" className="text-sm font-semibold tracking-tight">
            {site?.name ?? "HMS"}
          </Link>
          <nav className="flex flex-wrap items-center gap-4 text-xs font-medium">
            {publishedPages
              .filter((page) => normalizeSlug(page.slug) !== "home")
              .map((page) => (
                <Link
                  key={page._id}
                  to={publicPath("page", page.slug)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  {page.title}
                </Link>
              ))}
            {publishedPosts.length > 0 && (
              <Link to="/view/blog" className="text-muted-foreground hover:text-foreground">
                Blog
              </Link>
            )}
            {liveProducts.length > 0 && (
              <Link to="/view/shop" className="text-muted-foreground hover:text-foreground">
                Shop
              </Link>
            )}
            <Link to="/" className="text-muted-foreground hover:text-foreground">
              Admin
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-10">
        <Outlet />
      </main>
    </div>
  );
}

export function PublicPage() {
  const { slug } = useParams();
  const { pages, variants } = useHMS();
  const [params] = useSearchParams();
  const target = normalizeSlug(slug ?? "home");
  const page = pages.find(
    (item) => normalizeSlug(item.slug) === target && item.status === "published",
  );

  if (!page) {
    return <Missing label="Page" />;
  }

  const content = normalizeContent(
    pickVariant(
      variants.filter((variant) => variant.entityType === "page" && variant.entityId === page._id),
      page.content,
      params.get("v") ?? undefined,
    ),
  );

  return (
    <article className="flex flex-col gap-8">
      <BlockRenderer blocks={content.blocks} />
    </article>
  );
}

export function PublicBlogIndex() {
  const { posts } = useHMS();
  const published = posts.filter((post) => post.status === "published");
  if (published.length === 0) return <Missing label="Posts" />;
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-3xl font-bold tracking-tight">Blog</h1>
      <div className="flex flex-col divide-y rounded-xl border">
        {published.map((post) => (
          <Link
            key={post._id}
            to={publicPath("post", post.slug)}
            className="flex flex-col gap-1 px-4 py-4 hover:bg-muted/40"
          >
            <span className="text-sm font-semibold">{post.title}</span>
            <span className="text-xs text-muted-foreground">{post.excerpt}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function PublicPost() {
  const { slug } = useParams();
  const { posts, variants } = useHMS();
  const [params] = useSearchParams();
  const post = posts.find(
    (item) => normalizeSlug(item.slug) === normalizeSlug(slug ?? "") && item.status === "published",
  );
  if (!post) return <Missing label="Post" />;
  const content = normalizeContent(
    pickVariant(
      variants.filter((variant) => variant.entityType === "post" && variant.entityId === post._id),
      post.content,
      params.get("v") ?? undefined,
    ),
  );
  return (
    <article className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">{post.title}</h1>
        {post.excerpt && <p className="text-sm text-muted-foreground">{post.excerpt}</p>}
        {post.publishedAt && (
          <span className="text-xs text-muted-foreground">{relativeTime(post.publishedAt)}</span>
        )}
      </div>
      <BlockRenderer blocks={content.blocks} />
    </article>
  );
}

export function PublicShop() {
  const { products, site } = useHMS();
  const live = products.filter((product) => product.status === "active");
  if (live.length === 0) return <Missing label="Products" />;
  const currency = site?.settings?.commerce?.currency ?? "USD";
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-3xl font-bold tracking-tight">Shop</h1>
      <div className="grid gap-4 sm:grid-cols-2">
        {live.map((product) => (
          <Link
            key={product._id}
            to={publicPath("product", product.slug)}
            className="flex flex-col gap-2 rounded-xl border p-4 hover:bg-muted/40"
          >
            <span className="text-sm font-semibold">{product.name}</span>
            <span className="text-xs text-muted-foreground">
              {formatPrice(product.price, currency)}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function PublicProduct() {
  const { slug } = useParams();
  const { products, site } = useHMS();
  const product = products.find(
    (item) => item.slug === slugifySafe(slug ?? "") && item.status === "active",
  );
  if (!product) return <Missing label="Product" />;
  const currency = site?.settings?.commerce?.currency ?? "USD";
  const stripeReady = Boolean(site?.settings?.commerce?.stripeKey);
  return (
    <article className="flex max-w-xl flex-col gap-4">
      <h1 className="text-3xl font-bold tracking-tight">{product.name}</h1>
      <p className="text-lg font-semibold">{formatPrice(product.price, currency)}</p>
      {product.description && <BlockRenderer blocks={product.description.blocks} />}
      <Button disabled={!stripeReady}>
        {stripeReady ? "Checkout" : "Checkout not configured"}
      </Button>
    </article>
  );
}

function slugifySafe(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function Missing({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center gap-2 py-20 text-center">
      <span className="text-sm font-medium">{label} not found</span>
      <span className="text-xs text-muted-foreground">
        Publish it from the admin and it will appear here.
      </span>
      <Button size="sm" nativeButton={false} render={<Link to="/" />}>
        Back to admin
      </Button>
    </div>
  );
}
