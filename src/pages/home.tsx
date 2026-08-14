import { useState } from "react";
import { Link } from "react-router-dom";
import {
  FileTextIcon,
  RssIcon,
  PackageIcon,
  ImageIcon,
  TrendingUpIcon,
  EyeIcon,
  LayoutDashboardIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { BlockRenderer } from "@/components/builder/block-renderer";
import { useHMS } from "@/hooks/use-hms";
import {
  normalizeContent,
  normalizeSlug,
  pickVariant,
  publicPath,
  relativeTime,
} from "@/lib/content";

export default function Home() {
  const hms = useHMS();
  const [mode, setMode] = useState<"live" | "overview">("live");

  const stats = [
    { label: "Pages", value: String(hms.pages.length), icon: FileTextIcon, href: "/pages" },
    { label: "Posts", value: String(hms.posts.length), icon: RssIcon, href: "/blog" },
    { label: "Products", value: String(hms.products.length), icon: PackageIcon, href: "/products" },
    { label: "Assets", value: String(hms.media.length), icon: ImageIcon, href: "/media" },
  ];

  const homePage =
    hms.pages.find((page) => normalizeSlug(page.slug) === "home" && page.status === "published") ??
    hms.pages.find((page) => page.status === "published");

  const homeVariants = homePage
    ? hms.variants.filter(
        (variant) => variant.entityType === "page" && variant.entityId === homePage._id,
      )
    : [];
  const liveContent = normalizeContent(
    pickVariant(homeVariants, homePage?.content ?? { blocks: [] }),
  );

  const activity = [
    ...hms.pages.map((page) => ({
      id: page._id,
      label: `Page · ${page.title}`,
      at: page.updatedAt,
      href: `/pages?edit=${page._id}`,
    })),
    ...hms.posts.map((post) => ({
      id: post._id,
      label: `Post · ${post.title}`,
      at: post.updatedAt,
      href: `/blog?edit=${post._id}`,
    })),
    ...hms.products.map((product) => ({
      id: product._id,
      label: `Product · ${product.name}`,
      at: product.updatedAt,
      href: `/products?edit=${product._id}`,
    })),
  ]
    .sort((a, b) => b.at - a.at)
    .slice(0, 8);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {mode === "live" ? "Home Page (Live)" : "System Overview"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "live"
              ? "Live visitor view of your published home page."
              : "System metrics, activity log, and quick stats."}
          </p>
        </div>

        <div className="flex items-center rounded-lg border bg-muted p-1 text-xs">
          <button
            onClick={() => setMode("live")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 font-medium transition-colors ${
              mode === "live"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <EyeIcon className="size-3.5" /> Live Home Page
          </button>
          <button
            onClick={() => setMode("overview")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 font-medium transition-colors ${
              mode === "overview"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <LayoutDashboardIcon className="size-3.5" /> System Metrics
          </button>
        </div>
      </div>

      {mode === "live" ? (
        <div className="flex flex-col gap-8 rounded-xl border bg-background p-8 shadow-xs">
          {homePage ? (
            <>
              <BlockRenderer blocks={liveContent.blocks} />
              <div className="flex justify-end">
                <Button
                  size="sm"
                  variant="outline"
                  nativeButton={false}
                  render={<Link to={publicPath("page", homePage.slug)} />}
                >
                  Open public URL
                </Button>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <span className="text-sm font-medium">No published home page</span>
              <span className="text-xs text-muted-foreground">
                Publish a page with the slug `home` and it will render here.
              </span>
              <Button size="sm" nativeButton={false} render={<Link to="/pages" />}>
                Go to Pages
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {stats.map(({ label, value, icon: Icon, href }) => (
              <Link
                key={label}
                to={href}
                className="flex flex-col gap-3 rounded-xl border bg-card p-4"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">{label}</span>
                  <Icon className="size-4 text-muted-foreground" />
                </div>
                <span className="text-3xl font-semibold tracking-tight">{value}</span>
              </Link>
            ))}
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <TrendingUpIcon className="size-4 text-muted-foreground" />
              <span className="text-sm font-medium">Activity Log</span>
            </div>
            <div className="rounded-xl border bg-card">
              {activity.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
                  <span className="text-sm font-medium">System Active</span>
                  <span className="text-xs text-muted-foreground">
                    Changes made across pages, blog, and products will stream here.
                  </span>
                </div>
              ) : (
                <div className="flex flex-col divide-y">
                  {activity.map((item) => (
                    <Link
                      key={item.id}
                      to={item.href}
                      className="flex items-center justify-between px-4 py-3 text-sm hover:bg-muted/40"
                    >
                      <span>{item.label}</span>
                      <span className="text-xs text-muted-foreground">{relativeTime(item.at)}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
