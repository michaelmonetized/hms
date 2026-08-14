import { useEffect, useRef } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { BlockRenderer } from "@/components/builder/block-renderer";
import { LiveEditor, useDebouncedBlocks } from "@/components/builder/live-editor";
import { Button } from "@/components/ui/button";
import { useEditDoc } from "@/components/site/edit-doc";
import { useHMS } from "@/hooks/use-hms";
import { useHMSAuth } from "@/hooks/use-hms-auth";
import {
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
  onSave,
  onPublish,
}: {
  entityId: string;
  blocks: Block[];
  published: boolean;
  onSave: (blocks: Block[], snapshot?: boolean) => void;
  onPublish: () => void;
}) {
  const editing = useEditing();
  const { setDoc } = useEditDoc();
  const publishRef = useRef(onPublish);
  publishRef.current = onPublish;
  const [blocks, setBlocks] = useDebouncedBlocks(entityId, initialBlocks, (next) =>
    onSave(next, false),
  );

  useEffect(() => {
    setDoc({ published, publish: () => publishRef.current() });
    return () => setDoc({});
  }, [published, setDoc]);

  if (editing) {
    return <LiveEditor blocks={blocks} onChange={setBlocks} />;
  }
  return <BlockRenderer blocks={blocks} />;
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
  const { posts } = useHMS();
  const published = posts.filter((post) => post.status === "published");
  if (published.length === 0) return <Missing label="Posts" />;
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
  const { products, site } = useHMS();
  const live = products.filter((product) => product.status === "active");
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
  const { products, site } = useHMS();
  const product = products.find((item) => item.slug === slug);
  const visible = product && (product.status === "active" || isSignedIn);
  if (!visible || !product) return <Missing label="Product" />;
  const currency = site?.settings?.commerce?.currency ?? "USD";
  const stripeReady = Boolean(site?.settings?.commerce?.stripeKey);
  return (
    <article className="flex max-w-xl flex-col gap-4">
      <h1 className="text-4xl font-semibold tracking-tight">{product.name}</h1>
      <p className="text-lg">{formatPrice(product.price, currency)}</p>
      {product.description && <BlockRenderer blocks={product.description.blocks} />}
      <Button disabled={!stripeReady}>
        {stripeReady ? "Checkout" : "Checkout not configured"}
      </Button>
    </article>
  );
}

function Missing({ label }: { label: string }) {
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
