import { createContext, useContext, type ReactNode } from "react";
import { useHMS } from "@/hooks/use-hms";
import type {
  StoredBlueprint,
  StoredContentType,
  StoredEntry,
  StoredMedia,
  StoredPage,
  StoredPost,
  StoredProduct,
  StoredSite,
} from "@/lib/store";

export type CollectionData = {
  site: StoredSite | null;
  pages: StoredPage[];
  posts: StoredPost[];
  products: StoredProduct[];
  media: StoredMedia[];
  blueprints: StoredBlueprint[];
  contentTypes: StoredContentType[];
  entries: StoredEntry[];
};

const CollectionContext = createContext<CollectionData | null>(null);

export function CollectionProvider({ children }: { children: ReactNode }) {
  const hms = useHMS();
  return (
    <CollectionContext.Provider
      value={{
        site: hms.site,
        pages: hms.pages,
        posts: hms.posts,
        products: hms.products,
        media: hms.media,
        blueprints: hms.blueprints,
        contentTypes: hms.contentTypes,
        entries: hms.entries,
      }}
    >
      {children}
    </CollectionContext.Provider>
  );
}

export function useCollectionData(): CollectionData {
  return (
    useContext(CollectionContext) ?? {
      site: null,
      pages: [],
      posts: [],
      products: [],
      media: [],
      blueprints: [],
      contentTypes: [],
      entries: [],
    }
  );
}
