import { useState, type ReactNode } from "react";
import { useAction } from "convex/react";
import { GlobeIcon, SearchIcon, CreditCardIcon, KeyIcon, CheckIcon, SaveIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useHMS } from "@/hooks/use-hms";
import { api } from "@/lib/convex-api";
import { hasClerk, hasConvex, isLive } from "@/lib/env";
import { toast } from "@/components/ui/lib";

export default function Settings() {
  const hms = useHMS();
  const [activeTab, setActiveTab] = useState<"general" | "seo" | "commerce" | "integrations">(
    "general",
  );
  const [isSaved, setIsSaved] = useState(false);

  const site = hms.site;
  const settings = site?.settings ?? {};

  const [general, setGeneral] = useState({
    siteName: site?.name ?? "",
    description: site?.description ?? "",
    domain: site?.domain ?? "",
    language: settings.language ?? "en-US",
  });

  const [seo, setSeo] = useState({
    metaTitle: settings.seo?.metaTitle ?? "%s | HMS",
    metaDescription: settings.seo?.metaDescription ?? "",
    ogImage: settings.seo?.ogImage ?? "",
    twitterHandle: settings.seo?.twitterHandle ?? "",
  });

  const [commerce, setCommerce] = useState({
    currency: settings.commerce?.currency ?? "USD",
    stripeKey: settings.commerce?.stripeKey ?? "",
    taxRate: settings.commerce?.taxRate ?? "0",
    shippingFee: settings.commerce?.shippingFee ?? "0",
  });

  const handleSave = async () => {
    await hms.updateSite({
      name: general.siteName,
      description: general.description,
      domain: general.domain,
      settings: {
        language: general.language,
        seo,
        commerce,
      },
    });
    setIsSaved(true);
    toast.add({ title: "Settings saved", type: "success" });
    window.setTimeout(() => setIsSaved(false), 2000);
  };

  if (!hms.ready || !site) {
    return <div className="text-sm text-muted-foreground">Loading settings…</div>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Configure site properties, SEO defaults, commerce, and API keys.
          </p>
        </div>

        <Button size="sm" onClick={() => void handleSave()} className="gap-1.5">
          {isSaved ? (
            <>
              <CheckIcon className="size-3.5 text-emerald-400" /> Saved
            </>
          ) : (
            <>
              <SaveIcon className="size-3.5" /> Save Changes
            </>
          )}
        </Button>
      </div>

      <div className="flex border-b text-sm font-medium">
        {(
          [
            ["general", GlobeIcon, "General"],
            ["seo", SearchIcon, "SEO"],
            ["commerce", CreditCardIcon, "Commerce"],
            ["integrations", KeyIcon, "Integrations"],
          ] as const
        ).map(([tab, Icon, label]) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 transition-colors ${
              activeTab === tab
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="size-4" /> {label}
          </button>
        ))}
      </div>

      {activeTab === "general" && (
        <div className="flex max-w-2xl flex-col gap-4 rounded-xl border bg-card p-6 shadow-xs">
          <Field label="Site Name">
            <Input
              value={general.siteName}
              onChange={(event) => setGeneral({ ...general, siteName: event.target.value })}
            />
          </Field>
          <Field label="Site Description">
            <textarea
              value={general.description}
              onChange={(event) => setGeneral({ ...general, description: event.target.value })}
              rows={3}
              className="w-full rounded-md border bg-background p-2.5 text-sm"
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Custom Domain">
              <Input
                value={general.domain}
                onChange={(event) => setGeneral({ ...general, domain: event.target.value })}
              />
            </Field>
            <Field label="Language">
              <Input
                value={general.language}
                onChange={(event) => setGeneral({ ...general, language: event.target.value })}
              />
            </Field>
          </div>
        </div>
      )}

      {activeTab === "seo" && (
        <div className="flex max-w-2xl flex-col gap-4 rounded-xl border bg-card p-6 shadow-xs">
          <Field label="Meta Title Format">
            <Input
              value={seo.metaTitle}
              onChange={(event) => setSeo({ ...seo, metaTitle: event.target.value })}
            />
          </Field>
          <Field label="Default Meta Description">
            <textarea
              value={seo.metaDescription}
              onChange={(event) => setSeo({ ...seo, metaDescription: event.target.value })}
              rows={3}
              className="w-full rounded-md border bg-background p-2.5 text-sm"
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="OpenGraph Image URL">
              <Input
                value={seo.ogImage}
                onChange={(event) => setSeo({ ...seo, ogImage: event.target.value })}
              />
            </Field>
            <Field label="Twitter / X Handle">
              <Input
                value={seo.twitterHandle}
                onChange={(event) => setSeo({ ...seo, twitterHandle: event.target.value })}
              />
            </Field>
          </div>
        </div>
      )}

      {activeTab === "commerce" && (
        <div className="flex max-w-2xl flex-col gap-4 rounded-xl border bg-card p-6 shadow-xs">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Currency">
              <select
                value={commerce.currency}
                onChange={(event) => setCommerce({ ...commerce, currency: event.target.value })}
                className="rounded-md border bg-background px-3 py-2 text-sm"
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="CAD">CAD ($)</option>
              </select>
            </Field>
            <Field label="Tax Rate (%)">
              <Input
                value={commerce.taxRate}
                onChange={(event) => setCommerce({ ...commerce, taxRate: event.target.value })}
              />
            </Field>
          </div>
          <Field label="Stripe Publishable Key">
            <Input
              value={commerce.stripeKey}
              onChange={(event) => setCommerce({ ...commerce, stripeKey: event.target.value })}
              type="password"
            />
          </Field>
          <Field label="Default Shipping Fee ($)">
            <Input
              value={commerce.shippingFee}
              onChange={(event) => setCommerce({ ...commerce, shippingFee: event.target.value })}
            />
          </Field>
        </div>
      )}

      {activeTab === "integrations" && (
        <div className="flex max-w-2xl flex-col gap-4 rounded-xl border bg-card p-6 shadow-xs">
          <div className="rounded-lg border bg-muted/40 p-4 text-xs text-muted-foreground">
            Convex is {hasConvex ? "connected" : "not configured"}. Clerk is{" "}
            {hasClerk ? "connected" : "not configured"}. Resend is configured on the Convex
            deployment. Keys live in environment variables, not this form.
          </div>
          {isLive ? <SendTestEmail /> : null}
        </div>
      )}
    </div>
  );
}

function SendTestEmail() {
  const sendTest = useAction(api.email.sendTest);
  const [sending, setSending] = useState(false);

  return (
    <Button
      size="sm"
      disabled={sending}
      onClick={() => {
        setSending(true);
        void sendTest({})
          .then((result) => {
            toast.add({ title: `Test email sent to ${result.to}`, type: "success" });
          })
          .catch((error: unknown) => {
            toast.add({
              title: error instanceof Error ? error.message : "Could not send test email",
              type: "error",
            });
          })
          .finally(() => setSending(false));
      }}
    >
      {sending ? "Sending…" : "Send test email"}
    </Button>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
        {label}
      </label>
      {children}
    </div>
  );
}
