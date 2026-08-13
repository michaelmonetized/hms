import { useState } from "react";
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

const stats = [
  { label: "Pages", value: "2", icon: FileTextIcon, href: "/pages" },
  { label: "Posts", value: "1", icon: RssIcon, href: "/blog" },
  { label: "Products", value: "2", icon: PackageIcon, href: "/products" },
  { label: "Assets", value: "1", icon: ImageIcon, href: "/media" },
];

export default function Home() {
  const [mode, setMode] = useState<"live" | "overview">("live");

  return (
    <div className="flex flex-col gap-6">
      {/* View Switcher Top Bar */}
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {mode === "live" ? "Home Page (Live)" : "System Overview"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "live"
              ? "Live visitor view of your site's home page."
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
        /* Render Live Built Home Page */
        <div className="flex flex-col gap-12 rounded-xl border bg-background p-8 shadow-xs">
          {/* Hero Section */}
          <div className="flex flex-col items-center gap-4 py-12 text-center">
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              HMS v0.0.1 • Live Production
            </span>
            <h1 className="max-w-3xl text-4xl font-extrabold tracking-tight sm:text-5xl">
              Build, publish, and scale without legacy bloat.
            </h1>
            <p className="max-w-xl text-base text-muted-foreground">
              HMS replaces WordPress + Elementor + WooCommerce with a high-speed TanStack Start core
              and real-time JSON page builder.
            </p>
            <div className="flex gap-3">
              <Button size="lg">Explore System</Button>
              <Button size="lg" variant="outline">
                View Specs
              </Button>
            </div>
          </div>

          {/* Feature Grid */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="flex flex-col gap-2 rounded-xl border bg-card p-5">
              <span className="text-sm font-semibold">Realtime Edits</span>
              <p className="text-xs text-muted-foreground">
                Page structures and content stored as JSON for zero-latency updates.
              </p>
            </div>
            <div className="flex flex-col gap-2 rounded-xl border bg-card p-5">
              <span className="text-sm font-semibold">Timestamped Revisions</span>
              <p className="text-xs text-muted-foreground">
                Every edit snapshots history, allowing instant rollback anytime.
              </p>
            </div>
            <div className="flex flex-col gap-2 rounded-xl border bg-card p-5">
              <span className="text-sm font-semibold">Native Split Testing</span>
              <p className="text-xs text-muted-foreground">
                A/B variants baked into core tables for marketing speed.
              </p>
            </div>
          </div>

          {/* CTA Banner */}
          <div className="flex flex-col items-center justify-between gap-4 rounded-xl border bg-muted/40 p-8 sm:flex-row">
            <div className="flex flex-col gap-1">
              <h3 className="text-xl font-bold">Ready to replace WordPress?</h3>
              <p className="text-xs text-muted-foreground">
                Deploy HMS on Vercel or Cloudflare in under 60 seconds.
              </p>
            </div>
            <Button size="default">Deploy Now</Button>
          </div>
        </div>
      ) : (
        /* Render System Metrics Overview */
        <div className="flex flex-col gap-8">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {stats.map(({ label, value, icon: Icon }) => (
              <div key={label} className="flex flex-col gap-3 rounded-xl border bg-card p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">{label}</span>
                  <Icon className="size-4 text-muted-foreground" />
                </div>
                <span className="text-3xl font-semibold tracking-tight">{value}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <TrendingUpIcon className="size-4 text-muted-foreground" />
              <span className="text-sm font-medium">Activity Log</span>
            </div>
            <div className="rounded-xl border bg-card">
              <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
                <span className="text-sm font-medium">System Active</span>
                <span className="text-xs text-muted-foreground">
                  Changes made across pages, blog, and products will stream here.
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
