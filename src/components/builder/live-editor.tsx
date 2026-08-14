import { useEffect, useRef, useState, type DragEvent } from "react";
import { GripVerticalIcon, Trash2Icon } from "lucide-react";
import { Inspector } from "@/components/builder/inspector";
import { BlockView } from "@/components/builder/block-renderer";
import { CATALOG } from "@/lib/catalog";
import {
  createBlock,
  insertBlockTree,
  moveBlockTree,
  removeBlockTree,
  updateBlockTree,
  type Block,
  type BlockContent,
  type BlockType,
} from "@/lib/content";
import { cn } from "@/lib/utils";

const TYPE_MIME = "application/x-hms-block-type";
const ID_MIME = "application/x-hms-block-id";

function DropLine({ onDropAt }: { onDropAt: (type: BlockType | null, id: string | null) => void }) {
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
        "h-3 rounded-full transition-colors",
        over ? "bg-foreground/40" : "bg-transparent",
      )}
    />
  );
}

function CanvasBlock({
  block,
  selectedId,
  onSelect,
  onRemove,
  onDropChild,
}: {
  block: Block;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
  onDropChild: (parentId: string, index: number, type: BlockType | null, id: string | null) => void;
}) {
  const selected = selectedId === block.id;

  if (block.type === "column") {
    return (
      <div
        className={cn(
          "flex min-h-24 flex-col gap-2 rounded-xl border border-dashed p-3",
          selected ? "border-foreground" : "border-border",
        )}
        onClick={(event) => {
          event.stopPropagation();
          onSelect(block.id);
        }}
      >
        <DropLine onDropAt={(type, id) => onDropChild(block.id, 0, type, id)} />
        {(block.children ?? []).map((child, index) => (
          <div key={child.id}>
            <CanvasBlock
              block={child}
              selectedId={selectedId}
              onSelect={onSelect}
              onRemove={onRemove}
              onDropChild={onDropChild}
            />
            <DropLine onDropAt={(type, id) => onDropChild(block.id, index + 1, type, id)} />
          </div>
        ))}
        {(block.children ?? []).length === 0 && (
          <p className="py-6 text-center text-xs text-muted-foreground">Drop a block here</p>
        )}
      </div>
    );
  }

  return (
    <div
      draggable
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
      )}
    >
      <div className="absolute top-2 right-2 z-10 hidden items-center gap-1 group-hover:flex">
        <span className="rounded bg-background/90 p-1 text-muted-foreground">
          <GripVerticalIcon className="size-3.5" />
        </span>
        <button
          type="button"
          className="rounded bg-background/90 p-1 text-destructive"
          onClick={(event) => {
            event.stopPropagation();
            onRemove(block.id);
          }}
        >
          <Trash2Icon className="size-3.5" />
        </button>
      </div>
      {block.type === "columns" ? (
        <div className="grid gap-4 md:grid-cols-3">
          {(block.children ?? []).map((child) => (
            <CanvasBlock
              key={child.id}
              block={child}
              selectedId={selectedId}
              onSelect={onSelect}
              onRemove={onRemove}
              onDropChild={onDropChild}
            />
          ))}
        </div>
      ) : (
        <BlockView block={block} />
      )}
    </div>
  );
}

export function LiveEditor({
  blocks,
  onChange,
}: {
  blocks: Block[];
  onChange: (blocks: Block[]) => void;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tab, setTab] = useState<"blocks" | "design">("blocks");

  const applyDrop = (
    parentId: string | null,
    index: number,
    type: BlockType | null,
    id: string | null,
  ) => {
    if (type) {
      const incoming = createBlock(type);
      onChange(insertBlockTree(blocks, parentId, index, incoming));
      setSelectedId(incoming.id);
      setTab("design");
      return;
    }
    if (id) {
      onChange(moveBlockTree(blocks, id, parentId, index));
      setSelectedId(id);
    }
  };

  return (
    <div className="flex gap-0">
      <div className="min-w-0 flex-1" onClick={() => setSelectedId(null)}>
        <DropLine onDropAt={(type, id) => applyDrop(null, 0, type, id)} />
        {blocks.map((block, index) => (
          <div key={block.id} className="py-4">
            <CanvasBlock
              block={block}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onRemove={(id) => {
                onChange(removeBlockTree(blocks, id));
                if (selectedId === id) setSelectedId(null);
              }}
              onDropChild={applyDrop}
            />
            <DropLine onDropAt={(type, id) => applyDrop(null, index + 1, type, id)} />
          </div>
        ))}
        {blocks.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-2 py-24 text-center">
            <span className="text-sm font-medium">Empty page</span>
            <span className="text-sm text-muted-foreground">Drag a block from the right.</span>
          </div>
        )}
      </div>

      <aside className="sticky top-12 h-[calc(100svh-3rem)] w-80 shrink-0 overflow-y-auto border-l bg-background p-4">
        <div className="mb-4 flex rounded-lg border p-1 text-xs">
          <button
            type="button"
            onClick={() => setTab("blocks")}
            className={cn(
              "flex-1 rounded-md px-2 py-1.5 font-medium",
              tab === "blocks" ? "bg-muted" : "text-muted-foreground",
            )}
          >
            Blocks
          </button>
          <button
            type="button"
            onClick={() => setTab("design")}
            className={cn(
              "flex-1 rounded-md px-2 py-1.5 font-medium",
              tab === "design" ? "bg-muted" : "text-muted-foreground",
            )}
          >
            Design
          </button>
        </div>

        {tab === "blocks" ? (
          <div className="flex flex-col gap-6">
            {CATALOG.map((group) => (
              <div key={group.id} className="flex flex-col gap-2">
                <div className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                  {group.label}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {group.items.map((item) => (
                    <button
                      key={item.type}
                      type="button"
                      draggable
                      onDragStart={(event) => {
                        event.dataTransfer.setData(TYPE_MIME, item.type);
                        event.dataTransfer.effectAllowed = "copy";
                      }}
                      onClick={() => {
                        const incoming = createBlock(item.type);
                        onChange(insertBlockTree(blocks, null, blocks.length, incoming));
                        setSelectedId(incoming.id);
                        setTab("design");
                      }}
                      className="rounded-lg border px-2 py-2 text-left hover:bg-muted/50"
                    >
                      <div className="text-xs font-medium">{item.label}</div>
                      <div className="text-[10px] text-muted-foreground">{item.hint}</div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Inspector
            blocks={blocks}
            selectedId={selectedId}
            onChange={(id, patch: Partial<BlockContent>) =>
              onChange(updateBlockTree(blocks, id, patch))
            }
          />
        )}
      </aside>
    </div>
  );
}

export function useDebouncedBlocks(
  entityId: string,
  initial: Block[],
  persist: (blocks: Block[]) => void,
): [Block[], (blocks: Block[]) => void] {
  const [blocks, setBlocks] = useState(initial);
  const skip = useRef(true);
  const persistRef = useRef(persist);
  persistRef.current = persist;
  const initialRef = useRef(initial);
  initialRef.current = initial;

  useEffect(() => {
    setBlocks(initialRef.current);
    skip.current = true;
  }, [entityId]);

  useEffect(() => {
    if (skip.current) {
      skip.current = false;
      return;
    }
    const timer = window.setTimeout(() => persistRef.current(blocks), 600);
    return () => window.clearTimeout(timer);
  }, [blocks]);

  return [blocks, setBlocks];
}
