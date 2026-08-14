import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/lib/convex-api";
import { isLive } from "@/lib/env";
import { toast } from "@/components/ui/lib";
import { normalizeContent, normalizeSlug, slugify, type PageContent } from "@/lib/content";
import {
  addBlueprint,
  addContentType,
  addEntry,
  addMedia,
  addPage,
  addPost,
  addProduct,
  addSubmission,
  addVariant,
  loadState,
  removeBlueprint,
  removeContentType,
  removeEntry,
  removeMedia,
  removePage,
  removePost,
  removeProduct,
  removeVariant,
  restoreRevision,
  saveState,
  seedState,
  updateBlueprint,
  updateContentType,
  updateEntry,
  updatePage,
  updatePost,
  updateProduct,
  updateSite,
  updateVariant,
  type HMSState,
  type StoredBlueprint,
  type StoredContentType,
  type StoredEntry,
  type StoredMedia,
  type StoredPage,
  type StoredPost,
  type StoredProduct,
  type StoredRevision,
  type StoredSite,
  type StoredSubmission,
  type StoredVariant,
} from "@/lib/store";
import type { BlueprintKind, ContentField, TemplateSurface } from "@/lib/blueprints";
import { useHMSAuth } from "@/hooks/use-hms-auth";

type PagePatch = Partial<Pick<StoredPage, "title" | "slug" | "status" | "content" | "meta">>;
type PostPatch = Partial<
  Pick<StoredPost, "title" | "slug" | "status" | "content" | "excerpt" | "coverImage" | "meta">
>;
type ProductPatch = Partial<
  Pick<
    StoredProduct,
    "name" | "slug" | "status" | "price" | "description" | "images" | "inventory" | "stripePriceId"
  >
>;

export type HMSContextValue = {
  ready: boolean;
  live: boolean;
  site: StoredSite | null;
  pages: StoredPage[];
  posts: StoredPost[];
  products: StoredProduct[];
  media: StoredMedia[];
  revisions: StoredRevision[];
  variants: StoredVariant[];
  blueprints: StoredBlueprint[];
  contentTypes: StoredContentType[];
  entries: StoredEntry[];
  submissions: StoredSubmission[];
  createPage: (input: { title: string; slug?: string; content?: PageContent }) => Promise<string>;
  updatePage: (id: string, patch: PagePatch, options?: { snapshot?: boolean }) => Promise<void>;
  removePage: (id: string) => Promise<void>;
  createPost: (input: {
    title: string;
    slug?: string;
    excerpt?: string;
    content?: PageContent;
  }) => Promise<string>;
  updatePost: (id: string, patch: PostPatch, options?: { snapshot?: boolean }) => Promise<void>;
  removePost: (id: string) => Promise<void>;
  createProduct: (input: {
    name: string;
    type: StoredProduct["type"];
    price: number;
    slug?: string;
  }) => Promise<string>;
  updateProduct: (id: string, patch: ProductPatch) => Promise<void>;
  removeProduct: (id: string) => Promise<void>;
  uploadMedia: (files: File[]) => Promise<void>;
  removeMedia: (id: string) => Promise<void>;
  updateSite: (
    patch: Partial<Pick<StoredSite, "name" | "domain" | "description" | "logo" | "settings">>,
  ) => Promise<void>;
  restoreRevision: (id: string) => Promise<void>;
  createVariant: (input: {
    entityType: "page" | "post";
    entityId: string;
    name: string;
    content: PageContent;
    traffic: number;
  }) => Promise<string>;
  updateVariant: (
    id: string,
    patch: Partial<Pick<StoredVariant, "name" | "content" | "traffic" | "isWinner">>,
  ) => Promise<void>;
  removeVariant: (id: string) => Promise<void>;
  createBlueprint: (input: {
    name: string;
    kind: BlueprintKind;
    appliesTo?: TemplateSurface;
    contentTypeId?: string;
    content?: PageContent;
  }) => Promise<string>;
  updateBlueprint: (
    id: string,
    patch: Partial<Pick<StoredBlueprint, "name" | "content" | "appliesTo" | "contentTypeId">>,
  ) => Promise<void>;
  removeBlueprint: (id: string) => Promise<void>;
  createContentType: (input: {
    name: string;
    slug?: string;
    plural?: string;
    fields?: ContentField[];
  }) => Promise<string>;
  updateContentType: (
    id: string,
    patch: Partial<Pick<StoredContentType, "name" | "slug" | "plural" | "fields">>,
  ) => Promise<void>;
  removeContentType: (id: string) => Promise<void>;
  createEntry: (input: {
    contentTypeId: string;
    title: string;
    slug?: string;
    fields?: Record<string, string>;
    content?: PageContent;
  }) => Promise<string>;
  updateEntry: (
    id: string,
    patch: Partial<Pick<StoredEntry, "title" | "slug" | "status" | "fields" | "content">>,
  ) => Promise<void>;
  removeEntry: (id: string) => Promise<void>;
  submitForm: (formId: string, values: Record<string, string>) => Promise<void>;
};

const HMSContext = createContext<HMSContextValue | null>(null);

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asPage(doc: Record<string, unknown>): StoredPage {
  return {
    _id: asString(doc._id),
    _creationTime: Number(doc._creationTime ?? Date.now()),
    siteId: asString(doc.siteId),
    title: asString(doc.title),
    slug: normalizeSlug(asString(doc.slug, "home")),
    status: doc.status === "published" ? "published" : "draft",
    content: normalizeContent(doc.content),
    meta: doc.meta as StoredPage["meta"],
    createdBy: asString(doc.createdBy),
    updatedAt: Number(doc.updatedAt ?? Date.now()),
  };
}

function asPost(doc: Record<string, unknown>): StoredPost {
  return {
    _id: asString(doc._id),
    _creationTime: Number(doc._creationTime ?? Date.now()),
    siteId: asString(doc.siteId),
    title: asString(doc.title),
    slug: normalizeSlug(asString(doc.slug, "untitled")),
    status: doc.status === "published" ? "published" : "draft",
    content: normalizeContent(doc.content),
    excerpt: typeof doc.excerpt === "string" ? doc.excerpt : undefined,
    coverImage: typeof doc.coverImage === "string" ? doc.coverImage : undefined,
    publishedAt: typeof doc.publishedAt === "number" ? doc.publishedAt : undefined,
    meta: doc.meta as StoredPost["meta"],
    createdBy: asString(doc.createdBy),
    updatedAt: Number(doc.updatedAt ?? Date.now()),
  };
}

function asProduct(doc: Record<string, unknown>): StoredProduct {
  const type =
    doc.type === "physical" || doc.type === "subscription" || doc.type === "digital"
      ? doc.type
      : "digital";
  const status =
    doc.status === "active" || doc.status === "archived" || doc.status === "draft"
      ? doc.status
      : "draft";
  return {
    _id: asString(doc._id),
    _creationTime: Number(doc._creationTime ?? Date.now()),
    siteId: asString(doc.siteId),
    name: asString(doc.name),
    slug: slugify(asString(doc.slug, asString(doc.name, "item"))),
    status,
    type,
    price: Number(doc.price ?? 0),
    description: doc.description ? normalizeContent(doc.description) : undefined,
    images: Array.isArray(doc.images) ? doc.images.map(String) : undefined,
    inventory: typeof doc.inventory === "number" ? doc.inventory : undefined,
    stripePriceId: typeof doc.stripePriceId === "string" ? doc.stripePriceId : undefined,
    createdBy: asString(doc.createdBy),
    updatedAt: Number(doc.updatedAt ?? Date.now()),
  };
}

function asMedia(doc: Record<string, unknown>): StoredMedia {
  return {
    _id: asString(doc._id),
    _creationTime: Number(doc._creationTime ?? Date.now()),
    siteId: asString(doc.siteId),
    storageId: asString(doc.storageId),
    name: asString(doc.name),
    mimeType: asString(doc.mimeType),
    size: Number(doc.size ?? 0),
    url: typeof doc.url === "string" ? doc.url : undefined,
    uploadedBy: asString(doc.uploadedBy),
    createdAt: Number(doc.createdAt ?? Date.now()),
  };
}

function asRevision(doc: Record<string, unknown>): StoredRevision {
  const entityType =
    doc.entityType === "post" || doc.entityType === "product" || doc.entityType === "page"
      ? doc.entityType
      : "page";
  return {
    _id: asString(doc._id),
    _creationTime: Number(doc._creationTime ?? Date.now()),
    entityType,
    entityId: asString(doc.entityId),
    content: doc.content,
    createdBy: asString(doc.createdBy),
    createdAt: Number(doc.createdAt ?? Date.now()),
  };
}

function asVariant(doc: Record<string, unknown>): StoredVariant {
  return {
    _id: asString(doc._id),
    _creationTime: Number(doc._creationTime ?? Date.now()),
    entityType: doc.entityType === "post" ? "post" : "page",
    entityId: asString(doc.entityId),
    name: asString(doc.name, "Variant"),
    content: normalizeContent(doc.content),
    traffic: Number(doc.traffic ?? 0),
    isWinner: Boolean(doc.isWinner),
    createdBy: asString(doc.createdBy),
  };
}

function asBlueprint(doc: Record<string, unknown>): StoredBlueprint {
  const kind =
    doc.kind === "form" || doc.kind === "loop-item" || doc.kind === "template"
      ? doc.kind
      : "component";
  return {
    _id: asString(doc._id),
    _creationTime: Number(doc._creationTime ?? Date.now()),
    siteId: asString(doc.siteId),
    name: asString(doc.name, "Untitled"),
    kind,
    appliesTo: doc.appliesTo as StoredBlueprint["appliesTo"],
    contentTypeId: typeof doc.contentTypeId === "string" ? doc.contentTypeId : undefined,
    content: normalizeContent(doc.content),
    createdBy: asString(doc.createdBy),
    updatedAt: Number(doc.updatedAt ?? Date.now()),
  };
}

function asContentType(doc: Record<string, unknown>): StoredContentType {
  return {
    _id: asString(doc._id),
    _creationTime: Number(doc._creationTime ?? Date.now()),
    siteId: asString(doc.siteId),
    name: asString(doc.name),
    slug: normalizeSlug(asString(doc.slug, asString(doc.name))),
    plural: asString(doc.plural, `${asString(doc.name)}s`),
    fields: Array.isArray(doc.fields) ? (doc.fields as StoredContentType["fields"]) : [],
    createdBy: asString(doc.createdBy),
    updatedAt: Number(doc.updatedAt ?? Date.now()),
  };
}

function asEntry(doc: Record<string, unknown>): StoredEntry {
  return {
    _id: asString(doc._id),
    _creationTime: Number(doc._creationTime ?? Date.now()),
    siteId: asString(doc.siteId),
    contentTypeId: asString(doc.contentTypeId),
    title: asString(doc.title),
    slug: normalizeSlug(asString(doc.slug, asString(doc.title))),
    status: doc.status === "published" ? "published" : "draft",
    fields:
      doc.fields && typeof doc.fields === "object" ? (doc.fields as Record<string, string>) : {},
    content: normalizeContent(doc.content),
    createdBy: asString(doc.createdBy),
    updatedAt: Number(doc.updatedAt ?? Date.now()),
  };
}

function asSite(doc: Record<string, unknown>): StoredSite {
  return {
    _id: asString(doc._id),
    _creationTime: Number(doc._creationTime ?? Date.now()),
    name: asString(doc.name, "Site"),
    domain: typeof doc.domain === "string" ? doc.domain : undefined,
    description: typeof doc.description === "string" ? doc.description : undefined,
    logo: typeof doc.logo === "string" ? doc.logo : undefined,
    ownerId: asString(doc.ownerId),
    settings: (doc.settings as StoredSite["settings"]) ?? {},
  };
}

function reportError(error: unknown, fallback: string) {
  const message = error instanceof Error ? error.message : fallback;
  toast.add({ title: message, type: "error" });
}

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function LocalDataProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<HMSState>(() => {
    if (typeof window === "undefined") return seedState();
    return loadState(window.localStorage);
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    saveState(window.localStorage, state);
  }, [state]);

  const value = useMemo<HMSContextValue>(() => {
    return {
      ready: true,
      live: false,
      site: state.site,
      pages: state.pages,
      posts: state.posts,
      products: state.products,
      media: state.media,
      revisions: state.revisions,
      variants: state.variants,
      blueprints: state.blueprints,
      contentTypes: state.contentTypes,
      entries: state.entries,
      submissions: state.submissions,
      createPage: async (input) => {
        let id = "";
        setState((prev) => {
          const result = addPage(prev, input);
          id = result.id;
          return result.next;
        });
        return id;
      },
      updatePage: async (id, patch, options) => {
        setState((prev) => updatePage(prev, id, patch, options));
      },
      removePage: async (id) => {
        setState((prev) => removePage(prev, id));
      },
      createPost: async (input) => {
        let id = "";
        setState((prev) => {
          const result = addPost(prev, input);
          id = result.id;
          return result.next;
        });
        return id;
      },
      updatePost: async (id, patch, options) => {
        setState((prev) => updatePost(prev, id, patch, options));
      },
      removePost: async (id) => {
        setState((prev) => removePost(prev, id));
      },
      createProduct: async (input) => {
        let id = "";
        setState((prev) => {
          const result = addProduct(prev, input);
          id = result.id;
          return result.next;
        });
        return id;
      },
      updateProduct: async (id, patch) => {
        setState((prev) => updateProduct(prev, id, patch));
      },
      removeProduct: async (id) => {
        setState((prev) => removeProduct(prev, id));
      },
      uploadMedia: async (files) => {
        for (const file of files) {
          const url =
            file.size <= 2_000_000 ? await fileToDataUrl(file) : URL.createObjectURL(file);
          setState(
            (prev) =>
              addMedia(prev, {
                name: file.name,
                mimeType: file.type,
                size: file.size,
                url,
              }).next,
          );
        }
      },
      removeMedia: async (id) => {
        setState((prev) => removeMedia(prev, id));
      },
      updateSite: async (patch) => {
        setState((prev) => updateSite(prev, patch));
      },
      restoreRevision: async (id) => {
        setState((prev) => restoreRevision(prev, id));
      },
      createVariant: async (input) => {
        let id = "";
        setState((prev) => {
          const result = addVariant(prev, input);
          id = result.id;
          return result.next;
        });
        return id;
      },
      updateVariant: async (id, patch) => {
        setState((prev) => updateVariant(prev, id, patch));
      },
      removeVariant: async (id) => {
        setState((prev) => removeVariant(prev, id));
      },
      createBlueprint: async (input) => {
        let id = "";
        setState((prev) => {
          const result = addBlueprint(prev, input);
          id = result.id;
          return result.next;
        });
        return id;
      },
      updateBlueprint: async (id, patch) => {
        setState((prev) => updateBlueprint(prev, id, patch));
      },
      removeBlueprint: async (id) => {
        setState((prev) => removeBlueprint(prev, id));
      },
      createContentType: async (input) => {
        let id = "";
        setState((prev) => {
          const result = addContentType(prev, input);
          id = result.id;
          return result.next;
        });
        return id;
      },
      updateContentType: async (id, patch) => {
        setState((prev) => updateContentType(prev, id, patch));
      },
      removeContentType: async (id) => {
        setState((prev) => removeContentType(prev, id));
      },
      createEntry: async (input) => {
        let id = "";
        setState((prev) => {
          const result = addEntry(prev, input);
          id = result.id;
          return result.next;
        });
        return id;
      },
      updateEntry: async (id, patch) => {
        setState((prev) => updateEntry(prev, id, patch));
      },
      removeEntry: async (id) => {
        setState((prev) => removeEntry(prev, id));
      },
      submitForm: async (formId, values) => {
        setState((prev) => addSubmission(prev, { formId, values }).next);
      },
    };
  }, [state]);

  return <HMSContext.Provider value={value}>{children}</HMSContext.Provider>;
}

function LiveDataProvider({ children }: { children: ReactNode }) {
  const { isSignedIn, isLoaded } = useHMSAuth();
  const ensureUser = useMutation(api.users.ensure);
  const getOrCreate = useMutation(api.sites.getOrCreate);
  const siteDoc = useQuery(api.sites.publicSite);
  const siteId = siteDoc?._id;

  const pageArgs = siteId ? { siteId } : "skip";
  const rawPages = useQuery(isSignedIn ? api.pages.list : api.pages.published, pageArgs);
  const rawPosts = useQuery(isSignedIn ? api.posts.list : api.posts.published, pageArgs);
  const rawProducts = useQuery(isSignedIn ? api.products.list : api.products.published, pageArgs);
  const rawMedia = useQuery(api.media.list, isSignedIn && siteId ? { siteId } : "skip");
  const rawRevisions = useQuery(api.revisions.recent, isSignedIn ? {} : "skip");
  const rawVariants = useQuery(api.variants.all, {});
  const rawBlueprints = useQuery(api.blueprints.list, pageArgs);
  const rawTypes = useQuery(api.contentTypes.list, pageArgs);
  const rawEntries = useQuery(isSignedIn ? api.entries.list : api.entries.published, pageArgs);

  const createPageMut = useMutation(api.pages.create);
  const updatePageMut = useMutation(api.pages.update);
  const removePageMut = useMutation(api.pages.remove);
  const createPostMut = useMutation(api.posts.create);
  const updatePostMut = useMutation(api.posts.update);
  const removePostMut = useMutation(api.posts.remove);
  const createProductMut = useMutation(api.products.create);
  const updateProductMut = useMutation(api.products.update);
  const removeProductMut = useMutation(api.products.remove);
  const generateUploadUrl = useMutation(api.media.generateUploadUrl);
  const recordMedia = useMutation(api.media.record);
  const removeMediaMut = useMutation(api.media.remove);
  const updateSiteMut = useMutation(api.sites.update);
  const restoreRevisionMut = useMutation(api.revisions.restore);
  const createVariantMut = useMutation(api.variants.create);
  const updateVariantMut = useMutation(api.variants.update);
  const removeVariantMut = useMutation(api.variants.remove);
  const createBlueprintMut = useMutation(api.blueprints.create);
  const updateBlueprintMut = useMutation(api.blueprints.update);
  const removeBlueprintMut = useMutation(api.blueprints.remove);
  const createTypeMut = useMutation(api.contentTypes.create);
  const updateTypeMut = useMutation(api.contentTypes.update);
  const removeTypeMut = useMutation(api.contentTypes.remove);
  const createEntryMut = useMutation(api.entries.create);
  const updateEntryMut = useMutation(api.entries.update);
  const removeEntryMut = useMutation(api.entries.remove);
  const submitFormMut = useMutation(api.submissions.create);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    void ensureUser({}).catch((error) => reportError(error, "Could not sync user"));
    void getOrCreate({ name: "My Site" }).catch((error) =>
      reportError(error, "Could not open site"),
    );
  }, [ensureUser, getOrCreate, isLoaded, isSignedIn]);

  const site = siteDoc ? asSite(siteDoc as Record<string, unknown>) : null;
  const pages = ((rawPages ?? []) as unknown[]).map((doc) =>
    asPage(doc as Record<string, unknown>),
  );
  const posts = ((rawPosts ?? []) as unknown[]).map((doc) =>
    asPost(doc as Record<string, unknown>),
  );
  const products = ((rawProducts ?? []) as unknown[]).map((doc) =>
    asProduct(doc as Record<string, unknown>),
  );
  const media = ((rawMedia ?? []) as unknown[]).map((doc) =>
    asMedia(doc as Record<string, unknown>),
  );
  const revisions = ((rawRevisions ?? []) as unknown[]).map((doc) =>
    asRevision(doc as Record<string, unknown>),
  );
  const variants = ((rawVariants ?? []) as unknown[]).map((doc) =>
    asVariant(doc as Record<string, unknown>),
  );
  const blueprints = ((rawBlueprints ?? []) as unknown[]).map((doc) =>
    asBlueprint(doc as Record<string, unknown>),
  );
  const contentTypes = ((rawTypes ?? []) as unknown[]).map((doc) =>
    asContentType(doc as Record<string, unknown>),
  );
  const entries = ((rawEntries ?? []) as unknown[]).map((doc) =>
    asEntry(doc as Record<string, unknown>),
  );

  const ready =
    isLoaded && siteDoc !== undefined && rawPages !== undefined && rawPosts !== undefined;

  const createPageFn = useCallback(
    async (input: { title: string; slug?: string; content?: PageContent }) => {
      if (!site) throw new Error("No site");
      const slug = normalizeSlug(input.slug ?? input.title);
      const id = await createPageMut({ siteId: site._id, title: input.title, slug });
      if (input.content) {
        await updatePageMut({ id, content: input.content });
      }
      return String(id);
    },
    [createPageMut, site, updatePageMut],
  );

  const value = useMemo<HMSContextValue>(() => {
    return {
      ready,
      live: true,
      site,
      pages,
      posts,
      products,
      media,
      revisions,
      variants,
      blueprints,
      contentTypes,
      entries,
      submissions: [],
      createPage: createPageFn,
      updatePage: async (id, patch, options) => {
        await updatePageMut({ id, ...patch, snapshot: options?.snapshot });
      },
      removePage: async (id) => {
        await removePageMut({ id });
      },
      createPost: async (input) => {
        if (!site) throw new Error("No site");
        const slug = normalizeSlug(input.slug ?? input.title);
        const id = await createPostMut({ siteId: site._id, title: input.title, slug });
        if (input.excerpt || input.content) {
          await updatePostMut({
            id,
            excerpt: input.excerpt,
            content: input.content,
          });
        }
        return String(id);
      },
      updatePost: async (id, patch, options) => {
        await updatePostMut({
          id,
          ...patch,
          snapshot: options?.snapshot,
          publishedAt: patch.status === "published" ? Date.now() : undefined,
        });
      },
      removePost: async (id) => {
        await removePostMut({ id });
      },
      createProduct: async (input) => {
        if (!site) throw new Error("No site");
        const slug = slugify(input.slug ?? input.name);
        const id = await createProductMut({
          siteId: site._id,
          name: input.name,
          slug,
          type: input.type,
          price: input.price,
        });
        return String(id);
      },
      updateProduct: async (id, patch) => {
        await updateProductMut({ id, ...patch });
      },
      removeProduct: async (id) => {
        await removeProductMut({ id });
      },
      uploadMedia: async (files) => {
        if (!site) throw new Error("No site");
        for (const file of files) {
          const uploadUrl = await generateUploadUrl({});
          const response = await fetch(uploadUrl, {
            method: "POST",
            headers: { "Content-Type": file.type || "application/octet-stream" },
            body: file,
          });
          if (!response.ok) throw new Error("Upload failed");
          const payload = (await response.json()) as { storageId: string };
          await recordMedia({
            siteId: site._id,
            storageId: payload.storageId,
            name: file.name,
            mimeType: file.type,
            size: file.size,
          });
        }
      },
      removeMedia: async (id) => {
        await removeMediaMut({ id });
      },
      updateSite: async (patch) => {
        if (!site) throw new Error("No site");
        await updateSiteMut({ id: site._id, ...patch });
      },
      restoreRevision: async (id) => {
        await restoreRevisionMut({ id });
      },
      createVariant: async (input) => {
        const id = await createVariantMut(input);
        return String(id);
      },
      updateVariant: async (id, patch) => {
        await updateVariantMut({ id, ...patch });
      },
      removeVariant: async (id) => {
        await removeVariantMut({ id });
      },
      createBlueprint: async (input) => {
        if (!site) throw new Error("No site");
        const id = await createBlueprintMut({
          siteId: site._id,
          name: input.name,
          kind: input.kind,
          appliesTo: input.appliesTo,
          contentTypeId: input.contentTypeId,
          content: input.content,
        });
        return String(id);
      },
      updateBlueprint: async (id, patch) => {
        await updateBlueprintMut({ id, ...patch });
      },
      removeBlueprint: async (id) => {
        await removeBlueprintMut({ id });
      },
      createContentType: async (input) => {
        if (!site) throw new Error("No site");
        const slug = normalizeSlug(input.slug ?? input.name);
        const id = await createTypeMut({
          siteId: site._id,
          name: input.name,
          slug,
          plural: input.plural ?? `${input.name}s`,
          fields: input.fields ?? [],
        });
        return String(id);
      },
      updateContentType: async (id, patch) => {
        await updateTypeMut({ id, ...patch });
      },
      removeContentType: async (id) => {
        await removeTypeMut({ id });
      },
      createEntry: async (input) => {
        if (!site) throw new Error("No site");
        const slug = normalizeSlug(input.slug ?? input.title);
        const id = await createEntryMut({
          siteId: site._id,
          contentTypeId: input.contentTypeId,
          title: input.title,
          slug,
          fields: input.fields,
          content: input.content,
        });
        return String(id);
      },
      updateEntry: async (id, patch) => {
        await updateEntryMut({ id, ...patch });
      },
      removeEntry: async (id) => {
        await removeEntryMut({ id });
      },
      submitForm: async (formId, values) => {
        await submitFormMut({ formId, values });
      },
    };
  }, [
    blueprints,
    contentTypes,
    createBlueprintMut,
    createEntryMut,
    createPageFn,
    createPostMut,
    createProductMut,
    createTypeMut,
    createVariantMut,
    entries,
    generateUploadUrl,
    media,
    pages,
    posts,
    products,
    ready,
    recordMedia,
    removeBlueprintMut,
    removeEntryMut,
    removeMediaMut,
    removePageMut,
    removePostMut,
    removeProductMut,
    removeTypeMut,
    removeVariantMut,
    restoreRevisionMut,
    revisions,
    site,
    submitFormMut,
    updateBlueprintMut,
    updateEntryMut,
    updatePageMut,
    updatePostMut,
    updateProductMut,
    updateSiteMut,
    updateTypeMut,
    updateVariantMut,
    variants,
  ]);

  return <HMSContext.Provider value={value}>{children}</HMSContext.Provider>;
}

export function HMSDataProvider({ children }: { children: ReactNode }) {
  if (isLive) return <LiveDataProvider>{children}</LiveDataProvider>;
  return <LocalDataProvider>{children}</LocalDataProvider>;
}

export function useHMS(): HMSContextValue {
  const ctx = useContext(HMSContext);
  if (!ctx) throw new Error("useHMS must be used inside HMSDataProvider");
  return ctx;
}
