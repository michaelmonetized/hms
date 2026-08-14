import type { DragEvent } from "react";
import { EyeIcon, EyeOffIcon, LockIcon, UnlockIcon } from "lucide-react";
import { flattenTree, type Block } from "@/lib/content";
import { ID_MIME } from "@/lib/builder";
import { cn } from "@/lib/utils";

export function Navigator({
  blocks,
  selectedId,
  onSelect,
  onToggleHidden,
  onToggleLocked,
}: {
  blocks: Block[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onToggleHidden: (id: string) => void;
  onToggleLocked: (id: string) => void;
}) {
  const nodes = flattenTree(blocks);

  if (nodes.length === 0) {
    return <p className="px-1 text-sm text-muted-foreground">Nothing on the page yet.</p>;
  }

  return (
    <div className="flex flex-col gap-0.5" role="tree" aria-label="Page structure">
      {nodes.map((node) => {
        const selected = selectedId === node.id;
        return (
          <div
            key={node.id}
            role="treeitem"
            aria-selected={selected}
            draggable={!node.locked}
            onDragStart={(event: DragEvent) => {
              event.dataTransfer.setData(ID_MIME, node.id);
              event.dataTransfer.effectAllowed = "move";
            }}
            onClick={() => onSelect(node.id)}
            style={{ paddingLeft: 8 + node.depth * 12 }}
            className={cn(
              "group flex cursor-pointer items-center gap-1 rounded-md py-1 pr-1 text-xs",
              selected ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/60",
              node.hidden && "opacity-50",
            )}
          >
            <span className="min-w-0 flex-1 truncate">
              <span className="font-medium capitalize">{node.type.replaceAll("-", " ")}</span>
              {node.label !== node.type.replaceAll("-", " ") && (
                <span className="text-muted-foreground"> · {node.label}</span>
              )}
            </span>
            <button
              type="button"
              className="rounded p-0.5 opacity-0 hover:bg-background group-hover:opacity-100"
              aria-label={node.hidden ? "Show block" : "Hide block"}
              onClick={(event) => {
                event.stopPropagation();
                onToggleHidden(node.id);
              }}
            >
              {node.hidden ? <EyeOffIcon className="size-3" /> : <EyeIcon className="size-3" />}
            </button>
            <button
              type="button"
              className={cn(
                "rounded p-0.5 hover:bg-background",
                node.locked ? "opacity-100" : "opacity-0 group-hover:opacity-100",
              )}
              aria-label={node.locked ? "Unlock block" : "Lock block"}
              onClick={(event) => {
                event.stopPropagation();
                onToggleLocked(node.id);
              }}
            >
              {node.locked ? <LockIcon className="size-3" /> : <UnlockIcon className="size-3" />}
            </button>
          </div>
        );
      })}
    </div>
  );
}
