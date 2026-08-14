import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BlockRenderer } from "@/components/builder/block-renderer";
import {
  createBlock,
  relativeTime,
  type Block,
  type BlockType,
  type PageContent,
} from "@/lib/content";
import type { StoredMedia, StoredRevision, StoredVariant } from "@/lib/store";
import {
  PlusIcon,
  Trash2Icon,
  MoveUpIcon,
  MoveDownIcon,
  EyeIcon,
  CodeIcon,
  HistoryIcon,
  SaveIcon,
  LayoutIcon,
  TypeIcon,
  GridIcon,
  SparklesIcon,
  ImageIcon,
  FlaskConicalIcon,
} from "lucide-react";

export type { Block };

export function PageBuilder({
  entityId,
  initialTitle = "Untitled Page",
  initialSlug = "",
  initialStatus = "draft",
  initialBlocks = [],
  revisions = [],
  variants = [],
  media = [],
  onSave,
  onPublish,
  onRestore,
  onCreateVariant,
  onUpdateVariant,
  onRemoveVariant,
}: {
  entityId: string;
  initialTitle?: string;
  initialSlug?: string;
  initialStatus?: "published" | "draft";
  initialBlocks?: Block[];
  revisions?: StoredRevision[];
  variants?: StoredVariant[];
  media?: StoredMedia[];
  onSave?: (
    payload: { title: string; slug: string; blocks: Block[] },
    options?: { snapshot?: boolean },
  ) => void;
  onPublish?: (status: "published" | "draft") => void;
  onRestore?: (revisionId: string) => void;
  onCreateVariant?: (input: { name: string; traffic: number; content: PageContent }) => void;
  onUpdateVariant?: (id: string, patch: { isWinner?: boolean; traffic?: number }) => void;
  onRemoveVariant?: (id: string) => void;
}) {
  const [title, setTitle] = useState(initialTitle);
  const [slug, setSlug] = useState(initialSlug);
  const [blocks, setBlocks] = useState<Block[]>(initialBlocks);
  const [activeTab, setActiveTab] = useState<"visual" | "preview" | "json" | "variants">("visual");
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [variantName, setVariantName] = useState("B");
  const [variantTraffic, setVariantTraffic] = useState("50");
  const skipSave = useRef(true);
  const boot = useRef({ initialTitle, initialSlug, initialBlocks });
  boot.current = { initialTitle, initialSlug, initialBlocks };

  useEffect(() => {
    setTitle(boot.current.initialTitle);
    setSlug(boot.current.initialSlug);
    setBlocks(boot.current.initialBlocks);
    skipSave.current = true;
  }, [entityId]);

  useEffect(() => {
    if (skipSave.current) {
      skipSave.current = false;
      return;
    }
    const timer = window.setTimeout(() => {
      onSave?.({ title, slug, blocks }, { snapshot: false });
    }, 800);
    return () => window.clearTimeout(timer);
  }, [blocks, onSave, slug, title]);

  const json = useMemo(
    () => JSON.stringify({ title, slug, blocks }, null, 2),
    [blocks, slug, title],
  );

  const addBlock = (type: BlockType) => {
    setBlocks((prev) => [...prev, createBlock(type)]);
  };

  const updateBlock = (id: string, field: keyof Block["content"], value: string | string[]) => {
    setBlocks((prev) =>
      prev.map((block) =>
        block.id === id ? { ...block, content: { ...block.content, [field]: value } } : block,
      ),
    );
  };

  const removeBlock = (id: string) => {
    setBlocks((prev) => prev.filter((block) => block.id !== id));
  };

  const moveBlock = (index: number, direction: "up" | "down") => {
    const target = direction === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= blocks.length) return;
    const next = [...blocks];
    const [moved] = next.splice(index, 1);
    next.splice(target, 0, moved);
    setBlocks(next);
  };

  const onDrop = (index: number) => {
    if (dragIndex === null || dragIndex === index) return;
    const next = [...blocks];
    const [moved] = next.splice(dragIndex, 1);
    next.splice(index, 0, moved);
    setBlocks(next);
    setDragIndex(null);
  };

  return (
    <div className="flex flex-col gap-4 rounded-xl border bg-card p-6 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
        <div className="flex flex-wrap items-center gap-3">
          <Input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="h-9 w-64 text-base font-semibold tracking-tight"
            placeholder="Page Title"
          />
          <Input
            value={slug}
            onChange={(event) => setSlug(event.target.value)}
            className="h-9 w-40 font-mono text-xs"
            placeholder="slug"
          />
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
              initialStatus === "published"
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {initialStatus}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center rounded-lg border bg-muted p-1 text-xs">
            {(
              [
                ["visual", LayoutIcon, "Editor"],
                ["preview", EyeIcon, "Preview"],
                ["json", CodeIcon, "JSON"],
                ["variants", FlaskConicalIcon, "Split test"],
              ] as const
            ).map(([tab, Icon, label]) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 font-medium transition-colors ${
                  activeTab === tab
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="size-3.5" />
                {label}
              </button>
            ))}
          </div>

          {onPublish && (
            <Button
              size="sm"
              variant={initialStatus === "published" ? "outline" : "default"}
              onClick={() => onPublish(initialStatus === "published" ? "draft" : "published")}
            >
              {initialStatus === "published" ? "Unpublish" : "Publish"}
            </Button>
          )}
          <Button
            size="sm"
            onClick={() => onSave?.({ title, slug, blocks }, { snapshot: true })}
            className="gap-1.5"
          >
            <SaveIcon className="size-3.5" />
            Save
          </Button>
        </div>
      </div>

      {activeTab === "visual" && (
        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => addBlock("hero")}
              className="gap-1 text-xs"
            >
              <SparklesIcon className="size-3" /> + Hero
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => addBlock("heading")}
              className="gap-1 text-xs"
            >
              <TypeIcon className="size-3" /> + Heading
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => addBlock("text")}
              className="gap-1 text-xs"
            >
              <TypeIcon className="size-3" /> + Text Body
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => addBlock("features")}
              className="gap-1 text-xs"
            >
              <GridIcon className="size-3" /> + Features
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => addBlock("cta")}
              className="gap-1 text-xs"
            >
              <PlusIcon className="size-3" /> + CTA Section
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => addBlock("image")}
              className="gap-1 text-xs"
            >
              <ImageIcon className="size-3" /> + Image
            </Button>
          </div>

          <div className="flex flex-col gap-3">
            {blocks.map((block, index) => (
              <div
                key={block.id}
                draggable
                onDragStart={() => setDragIndex(index)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => onDrop(index)}
                className="group relative flex cursor-grab flex-col gap-3 rounded-lg border bg-muted/40 p-4 transition-all hover:border-foreground/20 active:cursor-grabbing"
              >
                <div className="flex items-center justify-between border-b pb-2">
                  <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                    {block.type} Block
                  </span>
                  <div className="flex items-center gap-1">
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      onClick={() => moveBlock(index, "up")}
                      disabled={index === 0}
                    >
                      <MoveUpIcon className="size-3.5" />
                    </Button>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      onClick={() => moveBlock(index, "down")}
                      disabled={index === blocks.length - 1}
                    >
                      <MoveDownIcon className="size-3.5" />
                    </Button>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      onClick={() => removeBlock(block.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2Icon className="size-3.5" />
                    </Button>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  {block.content.title !== undefined && (
                    <Input
                      value={block.content.title}
                      onChange={(event) => updateBlock(block.id, "title", event.target.value)}
                      placeholder="Title"
                      className="text-sm font-medium"
                    />
                  )}
                  {block.content.subtitle !== undefined && (
                    <Input
                      value={block.content.subtitle}
                      onChange={(event) => updateBlock(block.id, "subtitle", event.target.value)}
                      placeholder="Subtitle"
                      className="text-xs text-muted-foreground"
                    />
                  )}
                  {block.content.body !== undefined && (
                    <textarea
                      value={block.content.body}
                      onChange={(event) => updateBlock(block.id, "body", event.target.value)}
                      placeholder="Body text"
                      rows={3}
                      className="w-full rounded-md border bg-background p-2 text-xs"
                    />
                  )}
                  {block.content.buttonText !== undefined && (
                    <Input
                      value={block.content.buttonText}
                      onChange={(event) => updateBlock(block.id, "buttonText", event.target.value)}
                      placeholder="Button Label"
                      className="w-48 text-xs"
                    />
                  )}
                  {block.type === "features" && (
                    <textarea
                      value={(block.content.items ?? []).join("\n")}
                      onChange={(event) =>
                        updateBlock(
                          block.id,
                          "items",
                          event.target.value.split("\n").filter((line) => line.trim().length > 0),
                        )
                      }
                      placeholder="One feature per line"
                      rows={4}
                      className="w-full rounded-md border bg-background p-2 text-xs"
                    />
                  )}
                  {block.type === "image" && (
                    <>
                      <Input
                        value={block.content.url ?? ""}
                        onChange={(event) => updateBlock(block.id, "url", event.target.value)}
                        placeholder="Image URL"
                        className="text-xs"
                      />
                      {media.length > 0 && (
                        <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                          {media
                            .filter((item) => item.url)
                            .map((item) => (
                              <button
                                key={item._id}
                                type="button"
                                onClick={() => updateBlock(block.id, "url", item.url ?? "")}
                                className="overflow-hidden rounded-md border"
                              >
                                <img
                                  src={item.url}
                                  alt={item.name}
                                  className="aspect-square object-cover"
                                />
                              </button>
                            ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "preview" && (
        <div className="rounded-lg border bg-background p-8">
          <BlockRenderer blocks={blocks} />
        </div>
      )}

      {activeTab === "json" && (
        <pre className="max-h-96 overflow-auto rounded-lg border bg-muted p-4 font-mono text-xs text-foreground">
          {json}
        </pre>
      )}

      {activeTab === "variants" && (
        <div className="flex flex-col gap-4">
          <p className="text-xs text-muted-foreground">
            Split traffic across page variants. A winner locks the public page to that version.
          </p>
          <div className="flex flex-wrap items-end gap-2">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                Name
              </span>
              <Input
                value={variantName}
                onChange={(event) => setVariantName(event.target.value)}
                className="w-28"
              />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                Traffic %
              </span>
              <Input
                value={variantTraffic}
                onChange={(event) => setVariantTraffic(event.target.value)}
                className="w-24"
                type="number"
              />
            </div>
            <Button
              size="sm"
              onClick={() =>
                onCreateVariant?.({
                  name: variantName || "B",
                  traffic: Number(variantTraffic) || 50,
                  content: { blocks },
                })
              }
            >
              Snapshot current as variant
            </Button>
          </div>
          {variants.length === 0 ? (
            <span className="text-xs text-muted-foreground">No variants yet.</span>
          ) : (
            <div className="flex flex-col divide-y rounded-lg border">
              {variants.map((variant) => (
                <div
                  key={variant._id}
                  className="flex items-center justify-between gap-3 px-3 py-2"
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{variant.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {variant.traffic}% traffic
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant={variant.isWinner ? "default" : "outline"}
                      onClick={() =>
                        onUpdateVariant?.(variant._id, { isWinner: !variant.isWinner })
                      }
                    >
                      {variant.isWinner ? "Winner" : "Make winner"}
                    </Button>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => onRemoveVariant?.(variant._id)}
                    >
                      <Trash2Icon className="size-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {revisions.length > 0 && (
        <div className="mt-2 flex flex-col gap-2 border-t pt-4">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
            <HistoryIcon className="size-3.5" /> Revisions ({revisions.length})
          </div>
          <div className="flex flex-wrap gap-2">
            {revisions.map((revision) => (
              <button
                key={revision._id}
                onClick={() => {
                  const content = revision.content as PageContent | undefined;
                  if (content?.blocks) setBlocks(content.blocks);
                  onRestore?.(revision._id);
                }}
                className="rounded-md border bg-muted/60 px-2.5 py-1 text-xs hover:bg-muted"
              >
                Rollback {relativeTime(revision.createdAt)}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
