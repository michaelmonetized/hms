import { useState } from "react";
import { GlobeIcon, SearchIcon, CreditCardIcon, KeyIcon, CheckIcon, SaveIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function Settings() {
  const [activeTab, setActiveTab] = useState<"general" | "seo" | "commerce" | "integrations">(
    "general",
  );
  const [isSaved, setIsSaved] = useState(false);

  // Form states
  const [general, setGeneral] = useState({
    siteName: "HMS Demo Site",
    description: "Full-featured TanStack Start core with Convex & real-time JSON page builder.",
    domain: "hms.app",
    language: "en-US",
  });

  const [seo, setSeo] = useState({
    metaTitle: "%s | HMS System",
    metaDescription: "Move fast, break stuff, and hustle hard with HMS.",
    ogImage: "https://hms.app/og.png",
    twitterHandle: "@hms_app",
  });

  const [commerce, setCommerce] = useState({
    currency: "USD",
    stripeKey: "pk_test_hms_stripe_12345",
    taxRate: "8.5",
    shippingFee: "5.00",
  });

  const [integrations, setIntegrations] = useState({
    resendApiKey: "re_123456789_hms",
    convexUrl: import.meta.env.VITE_CONVEX_URL || "https://demo.convex.cloud",
    clerkKey: import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || "pk_test_demo_clerk",
  });

  const handleSave = () => {
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Configure site properties, SEO defaults, commerce, and API keys.
          </p>
        </div>

        <Button size="sm" onClick={handleSave} className="gap-1.5">
          {isSaved ? (
            <>
              <CheckIcon className="size-3.5 text-emerald-400" /> Saved!
            </>
          ) : (
            <>
              <SaveIcon className="size-3.5" /> Save Changes
            </>
          )}
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex border-b text-sm font-medium">
        <button
          onClick={() => setActiveTab("general")}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 transition-colors ${
            activeTab === "general"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <GlobeIcon className="size-4" /> General
        </button>
        <button
          onClick={() => setActiveTab("seo")}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 transition-colors ${
            activeTab === "seo"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <SearchIcon className="size-4" /> SEO
        </button>
        <button
          onClick={() => setActiveTab("commerce")}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 transition-colors ${
            activeTab === "commerce"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <CreditCardIcon className="size-4" /> Commerce
        </button>
        <button
          onClick={() => setActiveTab("integrations")}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 transition-colors ${
            activeTab === "integrations"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <KeyIcon className="size-4" /> Integrations
        </button>
      </div>

      {/* General Settings */}
      {activeTab === "general" && (
        <div className="flex max-w-2xl flex-col gap-4 rounded-xl border bg-card p-6 shadow-xs">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Site Name
            </label>
            <Input
              value={general.siteName}
              onChange={(e) => setGeneral({ ...general, siteName: e.target.value })}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Site Description
            </label>
            <textarea
              value={general.description}
              onChange={(e) => setGeneral({ ...general, description: e.target.value })}
              rows={3}
              className="w-full rounded-md border bg-background p-2.5 text-sm"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Custom Domain
              </label>
              <Input
                value={general.domain}
                onChange={(e) => setGeneral({ ...general, domain: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Language
              </label>
              <Input
                value={general.language}
                onChange={(e) => setGeneral({ ...general, language: e.target.value })}
              />
            </div>
          </div>
        </div>
      )}

      {/* SEO Settings */}
      {activeTab === "seo" && (
        <div className="flex max-w-2xl flex-col gap-4 rounded-xl border bg-card p-6 shadow-xs">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Meta Title Format
            </label>
            <Input
              value={seo.metaTitle}
              onChange={(e) => setSeo({ ...seo, metaTitle: e.target.value })}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Default Meta Description
            </label>
            <textarea
              value={seo.metaDescription}
              onChange={(e) => setSeo({ ...seo, metaDescription: e.target.value })}
              rows={3}
              className="w-full rounded-md border bg-background p-2.5 text-sm"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                OpenGraph Image URL
              </label>
              <Input
                value={seo.ogImage}
                onChange={(e) => setSeo({ ...seo, ogImage: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Twitter / X Handle
              </label>
              <Input
                value={seo.twitterHandle}
                onChange={(e) => setSeo({ ...seo, twitterHandle: e.target.value })}
              />
            </div>
          </div>
        </div>
      )}

      {/* Commerce Settings */}
      {activeTab === "commerce" && (
        <div className="flex max-w-2xl flex-col gap-4 rounded-xl border bg-card p-6 shadow-xs">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Currency
              </label>
              <select
                value={commerce.currency}
                onChange={(e) => setCommerce({ ...commerce, currency: e.target.value })}
                className="rounded-md border bg-background px-3 py-2 text-sm"
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="CAD">CAD ($)</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Tax Rate (%)
              </label>
              <Input
                value={commerce.taxRate}
                onChange={(e) => setCommerce({ ...commerce, taxRate: e.target.value })}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Stripe Publishable Key
            </label>
            <Input
              value={commerce.stripeKey}
              onChange={(e) => setCommerce({ ...commerce, stripeKey: e.target.value })}
              type="password"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Default Shipping Fee ($)
            </label>
            <Input
              value={commerce.shippingFee}
              onChange={(e) => setCommerce({ ...commerce, shippingFee: e.target.value })}
            />
          </div>
        </div>
      )}

      {/* Integrations Settings */}
      {activeTab === "integrations" && (
        <div className="flex max-w-2xl flex-col gap-4 rounded-xl border bg-card p-6 shadow-xs">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Resend Email API Key
            </label>
            <Input
              value={integrations.resendApiKey}
              onChange={(e) =>
                setIntegrations({
                  ...integrations,
                  resendApiKey: e.target.value,
                })
              }
              type="password"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Convex Deployment URL
            </label>
            <Input
              value={integrations.convexUrl}
              onChange={(e) => setIntegrations({ ...integrations, convexUrl: e.target.value })}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Clerk Publishable Key
            </label>
            <Input
              value={integrations.clerkKey}
              onChange={(e) => setIntegrations({ ...integrations, clerkKey: e.target.value })}
            />
          </div>
        </div>
      )}
    </div>
  );
}
