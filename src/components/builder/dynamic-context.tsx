import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { useSearchParams } from "react-router-dom";
import { useCollectionData } from "@/components/site/collection-data";
import { useCart } from "@/components/site/cart";
import { useHMSAuth } from "@/hooks/use-hms-auth";
import { formatPrice } from "@/lib/content";
import { emptyDynamicContext, type DynamicContext, type DynamicDocument } from "@/lib/dynamic";

function readCookies(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const next: Record<string, string> = {};
  for (const part of window.document.cookie.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key) next[key] = decodeURIComponent(rest.join("="));
  }
  return next;
}

type DynamicBag = {
  context: DynamicContext;
  setDocument: (document: DynamicDocument | null) => void;
};

const DynamicReactContext = createContext<DynamicBag>({
  context: emptyDynamicContext(),
  setDocument: () => undefined,
});

export function DynamicProvider({ children }: { children: ReactNode }) {
  const [document, setDocument] = useState<DynamicDocument | null>(null);
  const data = useCollectionData();
  const auth = useHMSAuth();
  const cart = useCart();
  const [params] = useSearchParams();

  const query = useMemo(() => {
    const next: Record<string, string> = {};
    params.forEach((value, key) => {
      next[key] = value;
    });
    return next;
  }, [params]);

  const context = useMemo<DynamicContext>(
    () => ({
      site: data.site
        ? {
            name: data.site.name,
            domain: data.site.domain,
            description: data.site.description,
          }
        : null,
      document,
      user: {
        name: auth.isSignedIn ? "You" : "",
        signedIn: Boolean(auth.isSignedIn),
        role: auth.isSignedIn ? "admin" : undefined,
      },
      query,
      now: new Date(),
      referrer: typeof window === "undefined" ? "" : window.document.referrer,
      cookies: readCookies(),
      cart: {
        count: cart.count,
        total: formatPrice(cart.totalCents, data.site?.settings?.commerce?.currency ?? "USD"),
      },
    }),
    [auth.isSignedIn, cart.count, cart.totalCents, data.site, document, query],
  );

  const value = useMemo(() => ({ context, setDocument }), [context]);
  return <DynamicReactContext.Provider value={value}>{children}</DynamicReactContext.Provider>;
}

const DocumentOverrideContext = createContext<DynamicDocument | null>(null);
const BodyBlocksContext = createContext<import("@/lib/content").Block[] | null>(null);

export function useDynamicContext(): DynamicContext {
  const bag = useContext(DynamicReactContext);
  const override = useContext(DocumentOverrideContext);
  if (!override) return bag.context;
  return { ...bag.context, document: override };
}

export function useSetDynamicDocument() {
  return useContext(DynamicReactContext).setDocument;
}

export function DynamicDocumentOverride({
  document,
  children,
}: {
  document: DynamicDocument;
  children: ReactNode;
}) {
  return (
    <DocumentOverrideContext.Provider value={document}>{children}</DocumentOverrideContext.Provider>
  );
}

export function DocumentBodyProvider({
  blocks,
  children,
}: {
  blocks: import("@/lib/content").Block[];
  children: ReactNode;
}) {
  return <BodyBlocksContext.Provider value={blocks}>{children}</BodyBlocksContext.Provider>;
}

export function useDocumentBody() {
  return useContext(BodyBlocksContext);
}
