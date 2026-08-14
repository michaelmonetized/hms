import { Link, Outlet, useLocation, useSearchParams } from "react-router-dom";
import { BlockRenderer } from "@/components/builder/block-renderer";
import { DynamicProvider } from "@/components/builder/dynamic-context";
import { AdminToolbar } from "@/components/site/toolbar";
import { CartProvider } from "@/components/site/cart";
import { CollectionProvider } from "@/components/site/collection-data";
import { EditDocProvider, useEditDoc } from "@/components/site/edit-doc";
import { useHMS } from "@/hooks/use-hms";
import { useHMSAuth } from "@/hooks/use-hms-auth";
import { pickTemplate } from "@/lib/blueprints";
import { normalizeSlug, publicPath } from "@/lib/content";
import { cn } from "@/lib/utils";

export function SiteFrame() {
  const { isLoaded, isSignedIn } = useHMSAuth();
  const { site, pages, posts, products, blueprints } = useHMS();
  const location = useLocation();
  const [params, setParams] = useSearchParams();
  const editing = params.get("edit") === "1";
  const managing = location.pathname.startsWith("/manage");
  const libraryEditor = /^\/manage\/library\/[^/]+$/.test(location.pathname);

  const publishedPages = pages.filter((page) => page.status === "published");
  const showBlog = posts.some((post) => post.status === "published") || Boolean(isSignedIn);
  const showShop = products.some((product) => product.status === "active") || Boolean(isSignedIn);

  const canEdit = Boolean(isSignedIn) && !managing;
  const editable =
    canEdit &&
    (location.pathname === "/" ||
      location.pathname.startsWith("/blog/") ||
      location.pathname.startsWith("/shop/") ||
      (!RESERVED(location.pathname) &&
        location.pathname !== "/blog" &&
        location.pathname !== "/shop"));

  return (
    <CollectionProvider>
      <CartProvider>
        <DynamicProvider>
          <EditDocProvider>
            <SiteChrome
              isLoaded={isLoaded}
              isSignedIn={Boolean(isSignedIn)}
              editing={editing || libraryEditor}
              editable={editable}
              siteName={site?.name ?? "HMS"}
              publishedPages={publishedPages}
              showBlog={showBlog}
              showShop={showShop}
              headerBlocks={pickTemplate(blueprints, "header")?.content.blocks}
              footerBlocks={pickTemplate(blueprints, "footer")?.content.blocks}
              onToggleEdit={() => {
                const next = new URLSearchParams(params);
                if (editing) next.delete("edit");
                else next.set("edit", "1");
                setParams(next, { replace: true });
              }}
            />
          </EditDocProvider>
        </DynamicProvider>
      </CartProvider>
    </CollectionProvider>
  );
}

function SiteChrome({
  isLoaded,
  isSignedIn,
  editing,
  editable,
  siteName,
  publishedPages,
  showBlog,
  showShop,
  headerBlocks,
  footerBlocks,
  onToggleEdit,
}: {
  isLoaded: boolean;
  isSignedIn: boolean;
  editing: boolean;
  editable: boolean;
  siteName: string;
  publishedPages: { _id: string; slug: string; title: string }[];
  showBlog: boolean;
  showShop: boolean;
  headerBlocks?: import("@/lib/content").Block[];
  footerBlocks?: import("@/lib/content").Block[];
  onToggleEdit: () => void;
}) {
  const editDoc = useEditDoc();

  return (
    <div className={cn("min-h-svh bg-background text-foreground", isSignedIn && "pt-12")}>
      {isLoaded && isSignedIn && (
        <AdminToolbar
          editing={editing}
          canEdit={editable}
          published={editDoc.published}
          onPublish={editDoc.publish}
          onToggleEdit={onToggleEdit}
        />
      )}

      {!editing && (
        <header className="border-b">
          <div className="mx-auto max-w-6xl px-6 py-4">
            {headerBlocks && headerBlocks.length > 0 ? (
              <BlockRenderer blocks={headerBlocks} tight />
            ) : (
              <div className="flex items-center justify-between gap-4">
                <Link to="/" className="text-sm font-semibold tracking-tight">
                  {siteName}
                </Link>
                <nav className="flex flex-wrap items-center gap-5 text-sm">
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
                  {showBlog && (
                    <Link to="/blog" className="text-muted-foreground hover:text-foreground">
                      Blog
                    </Link>
                  )}
                  {showShop && (
                    <Link to="/shop" className="text-muted-foreground hover:text-foreground">
                      Shop
                    </Link>
                  )}
                </nav>
              </div>
            )}
          </div>
        </header>
      )}

      <main className={cn(editing ? "w-full" : "mx-auto w-full max-w-6xl px-6 py-10")}>
        <Outlet />
      </main>

      {!editing && footerBlocks && footerBlocks.length > 0 && (
        <footer className="border-t">
          <div className="mx-auto max-w-6xl px-6 py-8">
            <BlockRenderer blocks={footerBlocks} tight />
          </div>
        </footer>
      )}
    </div>
  );
}

function RESERVED(pathname: string): boolean {
  return (
    pathname.startsWith("/sign-in") ||
    pathname.startsWith("/manage") ||
    pathname.startsWith("/blog") ||
    pathname.startsWith("/shop") ||
    pathname.startsWith("/search")
  );
}
