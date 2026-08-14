import type { ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { findBlock, type Block, type BlockContent } from "@/lib/content";

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </span>
      {children}
    </label>
  );
}

export function Inspector({
  blocks,
  selectedId,
  onChange,
}: {
  blocks: Block[];
  selectedId: string | null;
  onChange: (id: string, patch: Partial<BlockContent>) => void;
}) {
  const block = selectedId ? findBlock(blocks, selectedId) : null;
  if (!block || block.type === "column") {
    return (
      <p className="px-1 text-sm text-muted-foreground">
        Select a block on the page, or drag one from the library.
      </p>
    );
  }

  const set = (patch: Partial<BlockContent>) => onChange(block.id, patch);
  const content = block.content;

  return (
    <div className="flex flex-col gap-4">
      <div className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {block.type}
      </div>

      {content.title !== undefined && (
        <Field label="Title">
          <Input value={content.title} onChange={(event) => set({ title: event.target.value })} />
        </Field>
      )}
      {content.subtitle !== undefined && (
        <Field label="Subtitle">
          <Input
            value={content.subtitle}
            onChange={(event) => set({ subtitle: event.target.value })}
          />
        </Field>
      )}
      {content.body !== undefined && (
        <Field label="Body">
          <textarea
            value={content.body}
            onChange={(event) => set({ body: event.target.value })}
            rows={5}
            className="w-full rounded-md border bg-background p-2 text-sm"
          />
        </Field>
      )}
      {content.buttonText !== undefined && (
        <Field label="Button">
          <Input
            value={content.buttonText}
            onChange={(event) => set({ buttonText: event.target.value })}
          />
        </Field>
      )}
      {content.buttonHref !== undefined && (
        <Field label="Button link">
          <Input
            value={content.buttonHref}
            onChange={(event) => set({ buttonHref: event.target.value })}
          />
        </Field>
      )}
      {content.url !== undefined && (
        <Field label="URL">
          <Input value={content.url} onChange={(event) => set({ url: event.target.value })} />
        </Field>
      )}
      {content.urls !== undefined && (
        <Field label="URLs, one per line">
          <textarea
            value={(content.urls ?? []).join("\n")}
            onChange={(event) =>
              set({
                urls: event.target.value
                  .split("\n")
                  .map((line) => line.trim())
                  .filter(Boolean),
              })
            }
            rows={5}
            className="w-full rounded-md border bg-background p-2 font-mono text-xs"
          />
        </Field>
      )}
      {content.items !== undefined && (
        <Field label="Items, one per line">
          <textarea
            value={(content.items ?? []).join("\n")}
            onChange={(event) =>
              set({
                items: event.target.value.split("\n").filter((line) => line.trim().length > 0),
              })
            }
            rows={5}
            className="w-full rounded-md border bg-background p-2 text-sm"
          />
        </Field>
      )}
      {block.type === "heading" && (
        <Field label="Level">
          <select
            value={content.level ?? 2}
            onChange={(event) => set({ level: Number(event.target.value) as 1 | 2 | 3 })}
            className="h-8 rounded-md border bg-background px-2 text-sm"
          >
            <option value={1}>H1</option>
            <option value={2}>H2</option>
            <option value={3}>H3</option>
          </select>
        </Field>
      )}
      {block.type === "collection" && (
        <>
          <Field label="Source">
            <select
              value={content.source ?? "posts"}
              onChange={(event) => set({ source: event.target.value as BlockContent["source"] })}
              className="h-8 rounded-md border bg-background px-2 text-sm"
            >
              <option value="pages">Pages</option>
              <option value="posts">Posts</option>
              <option value="products">Products</option>
              <option value="media">Media</option>
            </select>
          </Field>
          <Field label="Layout">
            <select
              value={content.layout ?? "grid"}
              onChange={(event) => set({ layout: event.target.value as BlockContent["layout"] })}
              className="h-8 rounded-md border bg-background px-2 text-sm"
            >
              <option value="grid">Grid</option>
              <option value="table">Table</option>
              <option value="carousel">Carousel</option>
              <option value="gallery">Gallery</option>
              <option value="list">List</option>
            </select>
          </Field>
          <Field label="Limit">
            <Input
              type="number"
              value={content.limit ?? 6}
              onChange={(event) => set({ limit: Number(event.target.value) || 6 })}
            />
          </Field>
        </>
      )}
      {(block.type === "hero" || block.type === "heading") && (
        <Field label="Align">
          <select
            value={content.align ?? "left"}
            onChange={(event) => set({ align: event.target.value as BlockContent["align"] })}
            className="h-8 rounded-md border bg-background px-2 text-sm"
          >
            <option value="left">Left</option>
            <option value="center">Center</option>
            <option value="right">Right</option>
          </select>
        </Field>
      )}
    </div>
  );
}
