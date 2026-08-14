import { useState, type DragEvent } from "react";
import { CopyIcon, GripVerticalIcon, LockIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { BlockView } from "@/components/builder/block-renderer";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { ID_MIME, TYPE_MIME } from "@/lib/builder";
import { PAGE_TEMPLATES } from "@/lib/templates";
import { type Block, type BlockType, type Breakpoint } from "@/lib/content";
import { styleToCss } from "@/lib/style";
import { cn } from "@/lib/utils";

const DEVICE_WIDTH: Record<Breakpoint, number | "100%"> = {
  desktop: "100%",
  tablet: 768,
  mobile: 390,
};

export function DropLine({
  onDropAt,
}: {
  onDropAt: (type: BlockType | null, id: string | null) => void;
}) {
  const [over, setOver] = useState(false);
  return (
    <div
      onDragOver={(event) => {
        event.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(event) => {
        event.preventDefault();
        setOver(false);
        const type = event.dataTransfer.getData(TYPE_MIME) as BlockType | "";
        const id = event.dataTransfer.getData(ID_MIME);
        onDropAt(type || null, id || null);
      }}
      className={cn(
        "relative h-3 rounded-full transition-colors",
        over ? "bg-foreground/40" : "bg-transparent",
      )}
    >
      {over && (
        <span className="absolute inset-x-8 top-1/2 h-0.5 -translate-y-1/2 rounded bg-foreground" />
      )}
    </div>
  );
}

export function Canvas({
  blocks,
  selectedId,
  breakpoint,
  outlines,
  onSelect,
  onDrop,
  onAdd,
  onDuplicate,
  onRemove,
  onCopy,
  onCopyStyle,
  onPaste,
  onPasteStyle,
  onWrapSection,
  onWrapColumns,
  onSaveSection,
  onApplyTemplate,
}: {
  blocks: Block[];
  selectedId: string | null;
  breakpoint: Breakpoint;
  outlines: boolean;
  onSelect: (id: string | null) => void;
  onDrop: (
    parentId: string | null,
    index: number,
    type: BlockType | null,
    id: string | null,
  ) => void;
  onAdd: (type: BlockType, parentId: string | null, index: number) => void;
  onDuplicate: (id: string) => void;
  onRemove: (id: string) => void;
  onCopy: (id: string) => void;
  onCopyStyle: (id: string) => void;
  onPaste: () => void;
  onPasteStyle: (id: string) => void;
  onWrapSection: (id: string) => void;
  onWrapColumns: (id: string) => void;
  onSaveSection: (id: string) => void;
  onApplyTemplate: (id: string) => void;
}) {
  const width = DEVICE_WIDTH[breakpoint];

  return (
    <div className="min-h-0 flex-1 overflow-auto bg-muted/40" onClick={() => onSelect(null)}>
      <div
        className={cn(
          "mx-auto min-h-full bg-background transition-[max-width] duration-200",
          breakpoint !== "desktop" && "my-6 min-h-[80%] rounded-xl border shadow-sm",
        )}
        style={{ maxWidth: width }}
      >
        <div className="px-6 py-8">
          <DropLine onDropAt={(type, id) => onDrop(null, 0, type, id)} />
          {blocks.map((block, index) => (
            <div key={block.id} className="py-2">
              <CanvasBlock
                block={block}
                selectedId={selectedId}
                outlines={outlines}
                onSelect={onSelect}
                onDrop={onDrop}
                onDuplicate={onDuplicate}
                onRemove={onRemove}
                onCopy={onCopy}
                onCopyStyle={onCopyStyle}
                onPaste={onPaste}
                onPasteStyle={onPasteStyle}
                onWrapSection={onWrapSection}
                onWrapColumns={onWrapColumns}
                onSaveSection={onSaveSection}
              />
              <div className="group/add relative">
                <DropLine onDropAt={(type, id) => onDrop(null, index + 1, type, id)} />
                <button
                  type="button"
                  className="absolute top-1/2 left-1/2 z-10 hidden -translate-x-1/2 -translate-y-1/2 rounded-full border bg-background p-1 shadow-sm group-hover/add:flex"
                  aria-label="Add block here"
                  onClick={(event) => {
                    event.stopPropagation();
                    onAdd("heading", null, index + 1);
                  }}
                >
                  <PlusIcon className="size-3" />
                </button>
              </div>
            </div>
          ))}
          {blocks.length === 0 && (
            <EmptyCanvas onAdd={onAdd} onApplyTemplate={onApplyTemplate} onDrop={onDrop} />
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyCanvas({
  onAdd,
  onApplyTemplate,
  onDrop,
}: {
  onAdd: (type: BlockType, parentId: string | null, index: number) => void;
  onApplyTemplate: (id: string) => void;
  onDrop: (
    parentId: string | null,
    index: number,
    type: BlockType | null,
    id: string | null,
  ) => void;
}) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-6 rounded-2xl border border-dashed py-20 text-center"
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        const type = event.dataTransfer.getData(TYPE_MIME) as BlockType | "";
        onDrop(null, 0, type || null, event.dataTransfer.getData(ID_MIME) || null);
      }}
    >
      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium">Empty page</span>
        <span className="text-sm text-muted-foreground">
          Drop a widget, start from a layout, or press ⌘K.
        </span>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        {PAGE_TEMPLATES.map((template) => (
          <button
            key={template.id}
            type="button"
            onClick={() => onApplyTemplate(template.id)}
            className="rounded-lg border bg-background px-3 py-2 text-left hover:bg-muted/50"
          >
            <div className="text-xs font-medium">{template.label}</div>
            <div className="text-[10px] text-muted-foreground">{template.hint}</div>
          </button>
        ))}
      </div>
      <button
        type="button"
        className="text-xs text-muted-foreground underline"
        onClick={() => onAdd("hero", null, 0)}
      >
        Or add a hero
      </button>
    </div>
  );
}

function CanvasBlock({
  block,
  selectedId,
  outlines,
  onSelect,
  onDrop,
  onDuplicate,
  onRemove,
  onCopy,
  onCopyStyle,
  onPaste,
  onPasteStyle,
  onWrapSection,
  onWrapColumns,
  onSaveSection,
}: {
  block: Block;
  selectedId: string | null;
  outlines: boolean;
  onSelect: (id: string) => void;
  onDrop: (
    parentId: string | null,
    index: number,
    type: BlockType | null,
    id: string | null,
  ) => void;
  onDuplicate: (id: string) => void;
  onRemove: (id: string) => void;
  onCopy: (id: string) => void;
  onCopyStyle: (id: string) => void;
  onPaste: () => void;
  onPasteStyle: (id: string) => void;
  onWrapSection: (id: string) => void;
  onWrapColumns: (id: string) => void;
  onSaveSection: (id: string) => void;
}) {
  const selected = selectedId === block.id;
  const style = styleToCss(block.style);

  if (block.type === "column") {
    return (
      <div
        className={cn(
          "flex min-h-24 flex-col gap-2 rounded-xl border border-dashed p-3",
          selected ? "border-foreground" : "border-border",
          outlines && "outline outline-1 outline-dashed outline-foreground/20",
        )}
        style={style}
        onClick={(event) => {
          event.stopPropagation();
          onSelect(block.id);
        }}
      >
        <DropLine onDropAt={(type, id) => onDrop(block.id, 0, type, id)} />
        {(block.children ?? []).map((child, index) => (
          <div key={child.id}>
            <CanvasBlock
              block={child}
              selectedId={selectedId}
              outlines={outlines}
              onSelect={onSelect}
              onDrop={onDrop}
              onDuplicate={onDuplicate}
              onRemove={onRemove}
              onCopy={onCopy}
              onCopyStyle={onCopyStyle}
              onPaste={onPaste}
              onPasteStyle={onPasteStyle}
              onWrapSection={onWrapSection}
              onWrapColumns={onWrapColumns}
              onSaveSection={onSaveSection}
            />
            <DropLine onDropAt={(type, id) => onDrop(block.id, index + 1, type, id)} />
          </div>
        ))}
        {(block.children ?? []).length === 0 && (
          <p className="py-6 text-center text-xs text-muted-foreground">Drop a block here</p>
        )}
      </div>
    );
  }

  const chrome = (
    <div
      draggable={!block.locked}
      onDragStart={(event: DragEvent) => {
        event.dataTransfer.setData(ID_MIME, block.id);
        event.dataTransfer.effectAllowed = "move";
      }}
      onClick={(event) => {
        event.stopPropagation();
        onSelect(block.id);
      }}
      className={cn(
        "group relative rounded-xl",
        selected ? "ring-2 ring-foreground" : "hover:ring-1 hover:ring-foreground/30",
        outlines && "outline outline-1 outline-dashed outline-foreground/20",
        block.hidden && "opacity-50",
      )}
      style={
        block.type === "section" || block.type === "columns" || block.type === "form"
          ? style
          : undefined
      }
    >
      <div className="absolute -top-3 left-2 z-10 hidden items-center gap-1 rounded-md border bg-background px-1.5 py-0.5 text-[10px] font-medium uppercase shadow-sm group-hover:flex">
        {block.type.replaceAll("-", " ")}
        {block.locked && <LockIcon className="size-3" />}
      </div>
      <div className="absolute top-2 right-2 z-10 hidden items-center gap-1 group-hover:flex">
        <span className="rounded bg-background/90 p-1 text-muted-foreground">
          <GripVerticalIcon className="size-3.5" />
        </span>
        <button
          type="button"
          className="rounded bg-background/90 p-1"
          aria-label="Duplicate block"
          onClick={(event) => {
            event.stopPropagation();
            onDuplicate(block.id);
          }}
        >
          <CopyIcon className="size-3.5" />
        </button>
        <button
          type="button"
          className="rounded bg-background/90 p-1 text-destructive"
          aria-label="Delete block"
          disabled={block.locked}
          onClick={(event) => {
            event.stopPropagation();
            onRemove(block.id);
          }}
        >
          <Trash2Icon className="size-3.5" />
        </button>
      </div>
      {block.type === "columns" ? (
        <div
          className={cn(
            "grid gap-4",
            (block.children?.length ?? 3) >= 4
              ? "md:grid-cols-4"
              : (block.children?.length ?? 3) === 2
                ? "md:grid-cols-2"
                : "md:grid-cols-3",
          )}
        >
          {(block.children ?? []).map((child) => (
            <CanvasBlock
              key={child.id}
              block={child}
              selectedId={selectedId}
              outlines={outlines}
              onSelect={onSelect}
              onDrop={onDrop}
              onDuplicate={onDuplicate}
              onRemove={onRemove}
              onCopy={onCopy}
              onCopyStyle={onCopyStyle}
              onPaste={onPaste}
              onPasteStyle={onPasteStyle}
              onWrapSection={onWrapSection}
              onWrapColumns={onWrapColumns}
              onSaveSection={onSaveSection}
            />
          ))}
        </div>
      ) : block.type === "section" || block.type === "form" ? (
        <div className="flex min-h-20 flex-col gap-2 rounded-xl border border-dashed p-4">
          <DropLine onDropAt={(type, id) => onDrop(block.id, 0, type, id)} />
          {(block.children ?? []).map((child, index) => (
            <div key={child.id}>
              <CanvasBlock
                block={child}
                selectedId={selectedId}
                outlines={outlines}
                onSelect={onSelect}
                onDrop={onDrop}
                onDuplicate={onDuplicate}
                onRemove={onRemove}
                onCopy={onCopy}
                onCopyStyle={onCopyStyle}
                onPaste={onPaste}
                onPasteStyle={onPasteStyle}
                onWrapSection={onWrapSection}
                onWrapColumns={onWrapColumns}
                onSaveSection={onSaveSection}
              />
              <DropLine onDropAt={(type, id) => onDrop(block.id, index + 1, type, id)} />
            </div>
          ))}
          {(block.children ?? []).length === 0 && (
            <p className="py-8 text-center text-xs text-muted-foreground">
              {block.type === "form"
                ? "Form — drop fields here"
                : "Section — drop blocks or click +"}
            </p>
          )}
        </div>
      ) : (
        <BlockView block={block} />
      )}
    </div>
  );

  return (
    <ContextMenu>
      <ContextMenuTrigger>{chrome}</ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onClick={() => onSelect(block.id)}>Edit</ContextMenuItem>
        <ContextMenuItem onClick={() => onDuplicate(block.id)}>
          Duplicate
          <ContextMenuShortcut>⌘D</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem onClick={() => onCopy(block.id)}>
          Copy
          <ContextMenuShortcut>⌘C</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem onClick={onPaste}>
          Paste
          <ContextMenuShortcut>⌘V</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={() => onCopyStyle(block.id)}>Copy style</ContextMenuItem>
        <ContextMenuItem onClick={() => onPasteStyle(block.id)}>Paste style</ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={() => onWrapSection(block.id)}>Wrap in section</ContextMenuItem>
        <ContextMenuItem onClick={() => onWrapColumns(block.id)}>Wrap in columns</ContextMenuItem>
        <ContextMenuItem onClick={() => onSaveSection(block.id)}>Save as section</ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem
          variant="destructive"
          disabled={block.locked}
          onClick={() => onRemove(block.id)}
        >
          Delete
          <ContextMenuShortcut>⌫</ContextMenuShortcut>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
