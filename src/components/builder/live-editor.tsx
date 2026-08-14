import { useEffect, useRef, useState } from "react";
import {
  LayersIcon,
  MonitorIcon,
  PlusIcon,
  Redo2Icon,
  SearchIcon,
  SmartphoneIcon,
  SquareDashedIcon,
  TabletIcon,
  Undo2Icon,
} from "lucide-react";
import { Canvas } from "@/components/builder/canvas";
import { EditorRenderProvider } from "@/components/builder/editor-context";
import { Finder } from "@/components/builder/finder";
import { Inspector } from "@/components/builder/inspector";
import { Library } from "@/components/builder/library";
import { Navigator } from "@/components/builder/navigator";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import {
  canRedo,
  canUndo,
  commit,
  createHistory,
  deleteBlock,
  duplicateBlock,
  insertType,
  moveByOffset,
  pasteBlock,
  pasteStyle,
  readClipboard,
  redo,
  setColumnCount,
  undo,
  wrapInColumns,
  wrapInSection,
  writeClipboard,
} from "@/lib/builder";
import {
  createBlock,
  findBlock,
  findPath,
  flattenTree,
  locateBlock,
  insertBlockTree,
  moveBlockTree,
  patchBlock,
  updateBlockTree,
  type Block,
  type BlockContent,
  type BlockType,
  type Breakpoint,
} from "@/lib/content";
import { catalogFor } from "@/lib/catalog";
import { PAGE_TEMPLATES, saveSection } from "@/lib/templates";
import { cn } from "@/lib/utils";
import type { BuilderMode } from "@/lib/content";

export function LiveEditor({
  blocks,
  onChange,
  mode = "page",
}: {
  blocks: Block[];
  onChange: (blocks: Block[]) => void;
  mode?: BuilderMode;
}) {
  const catalog = catalogFor(mode);
  const [history, setHistory] = useState(() => createHistory(blocks));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [left, setLeft] = useState<"structure" | "add">("add");
  const [inspectTab, setInspectTab] = useState<"content" | "style" | "advanced" | "dynamic">(
    "content",
  );
  const [breakpoint, setBreakpoint] = useState<Breakpoint>("desktop");
  const [outlines, setOutlines] = useState(false);
  const [finderOpen, setFinderOpen] = useState(false);
  const coalesce = useRef<number | null>(null);
  const present = history.present;

  const apply = (next: Block[], options?: { coalesce?: boolean; select?: string | null }) => {
    const replace = Boolean(options?.coalesce && coalesce.current);
    setHistory((current) => commit(current, next, { replace }));
    onChange(next);
    if (options?.select !== undefined) setSelectedId(options.select);
    if (options?.coalesce) {
      if (coalesce.current) window.clearTimeout(coalesce.current);
      coalesce.current = window.setTimeout(() => {
        coalesce.current = null;
      }, 500);
    } else {
      coalesce.current = null;
    }
  };

  const applyUndo = () => {
    setHistory((current) => {
      const next = undo(current);
      onChange(next.present);
      return next;
    });
  };

  const applyRedo = () => {
    setHistory((current) => {
      const next = redo(current);
      onChange(next.present);
      return next;
    });
  };

  const add = (type: BlockType, parentId: string | null = null, index?: number) => {
    const result = insertType(present, selectedId, type, parentId, index);
    apply(result.blocks, { select: result.id });
    setInspectTab("content");
    setLeft("structure");
  };

  const drop = (
    parentId: string | null,
    index: number,
    type: BlockType | null,
    id: string | null,
  ) => {
    if (type) {
      const incoming = createBlock(type);
      apply(insertBlockTree(present, parentId, index, incoming), { select: incoming.id });
      setInspectTab("content");
      return;
    }
    if (id) {
      apply(moveBlockTree(present, id, parentId, index), { select: id });
    }
  };

  const patchContent = (id: string, patch: Partial<BlockContent>, coalesceEdit = true) => {
    apply(updateBlockTree(present, id, patch), { coalesce: coalesceEdit });
  };

  const patch = (id: string, next: Partial<Omit<Block, "id">>) => {
    apply(patchBlock(present, id, next));
  };

  const applyTemplate = (id: string) => {
    const template = PAGE_TEMPLATES.find((item) => item.id === id);
    if (!template) return;
    const next = template.blocks();
    apply(next, { select: next[0]?.id ?? null });
    setLeft("structure");
  };

  const applyRef = useRef(apply);
  const undoRef = useRef(applyUndo);
  const redoRef = useRef(applyRedo);
  applyRef.current = apply;
  undoRef.current = applyUndo;
  redoRef.current = applyRedo;

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable);
      const meta = event.metaKey || event.ctrlKey;

      if (meta && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setFinderOpen(true);
        return;
      }
      if (typing) return;

      if (meta && event.key.toLowerCase() === "z") {
        event.preventDefault();
        if (event.shiftKey) redoRef.current();
        else undoRef.current();
        return;
      }
      if (meta && event.key.toLowerCase() === "y") {
        event.preventDefault();
        redoRef.current();
        return;
      }
      if (meta && event.key.toLowerCase() === "d" && selectedId) {
        event.preventDefault();
        const location = locateBlock(present, selectedId);
        const next = duplicateBlock(present, selectedId);
        const siblings = location?.parentId
          ? (findBlock(next, location.parentId)?.children ?? [])
          : next;
        applyRef.current(next, {
          select: siblings[location ? location.index + 1 : 0]?.id ?? selectedId,
        });
        return;
      }
      if (meta && event.key.toLowerCase() === "c" && selectedId) {
        const block = findBlock(present, selectedId);
        if (!block) return;
        event.preventDefault();
        writeClipboard(
          event.shiftKey ? { kind: "style", style: block.style ?? {} } : { kind: "block", block },
        );
        return;
      }
      if (meta && event.key.toLowerCase() === "v") {
        const clip = readClipboard();
        if (!clip) return;
        event.preventDefault();
        if (clip.kind === "style" && selectedId) {
          applyRef.current(pasteStyle(present, selectedId, clip.style));
          return;
        }
        if (clip.kind === "block") {
          const result = pasteBlock(present, selectedId, clip.block);
          applyRef.current(result.blocks, { select: result.id });
        }
        return;
      }
      if ((event.key === "Delete" || event.key === "Backspace") && selectedId) {
        event.preventDefault();
        applyRef.current(deleteBlock(present, selectedId), { select: null });
        return;
      }
      if (event.key === "Escape") {
        setSelectedId(null);
        setFinderOpen(false);
        return;
      }
      if (event.key === "ArrowUp" || event.key === "ArrowDown") {
        event.preventDefault();
        const flat = flattenTree(present);
        if (flat.length === 0) return;
        const index = selectedId ? flat.findIndex((node) => node.id === selectedId) : -1;
        const nextIndex =
          event.key === "ArrowDown"
            ? Math.min(flat.length - 1, index + 1)
            : Math.max(0, index <= 0 ? 0 : index - 1);
        setSelectedId(flat[nextIndex].id);
        return;
      }
      if ((event.key === "[" || event.key === "]") && selectedId) {
        event.preventDefault();
        applyRef.current(moveByOffset(present, selectedId, event.key === "]" ? 1 : -1), {
          select: selectedId,
        });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [present, selectedId]);

  const path = selectedId ? findPath(present, selectedId) : [];
  const selected = selectedId ? findBlock(present, selectedId) : null;

  return (
    <EditorRenderProvider
      value={{
        editing: true,
        breakpoint,
        selectedId,
        outlines,
        onInline: (id: string, next: Partial<BlockContent>) => patchContent(id, next),
      }}
    >
      <div className="flex h-[calc(100svh-3rem)] flex-col bg-background">
        <div className="flex h-11 shrink-0 items-center justify-between gap-3 border-b px-3">
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant={left === "structure" ? "secondary" : "ghost"}
              onClick={() => setLeft("structure")}
              className="gap-1.5"
            >
              <LayersIcon className="size-3.5" />
              Structure
            </Button>
            <Button
              size="sm"
              variant={left === "add" ? "secondary" : "ghost"}
              onClick={() => setLeft("add")}
              className="gap-1.5"
            >
              <PlusIcon className="size-3.5" />
              Add
            </Button>
            <Button
              size="icon-sm"
              variant="ghost"
              onClick={applyUndo}
              disabled={!canUndo(history)}
              aria-label="Undo"
            >
              <Undo2Icon className="size-3.5" />
            </Button>
            <Button
              size="icon-sm"
              variant="ghost"
              onClick={applyRedo}
              disabled={!canRedo(history)}
              aria-label="Redo"
            >
              <Redo2Icon className="size-3.5" />
            </Button>
          </div>

          <div className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
            {path.length === 0 ? (
              <span className="capitalize">{mode.replace("-", " ")}</span>
            ) : (
              path.map((block, index) => (
                <button
                  key={block.id}
                  type="button"
                  className={cn(
                    "truncate capitalize hover:text-foreground",
                    index === path.length - 1 && "font-medium text-foreground",
                  )}
                  onClick={() => setSelectedId(block.id)}
                >
                  {index > 0 && <span className="mr-2 text-muted-foreground">/</span>}
                  {block.type.replaceAll("-", " ")}
                </button>
              ))
            )}
          </div>

          <div className="flex items-center gap-1">
            <Button
              size="icon-sm"
              variant={breakpoint === "desktop" ? "secondary" : "ghost"}
              aria-label="Desktop"
              onClick={() => setBreakpoint("desktop")}
            >
              <MonitorIcon className="size-3.5" />
            </Button>
            <Button
              size="icon-sm"
              variant={breakpoint === "tablet" ? "secondary" : "ghost"}
              aria-label="Tablet"
              onClick={() => setBreakpoint("tablet")}
            >
              <TabletIcon className="size-3.5" />
            </Button>
            <Button
              size="icon-sm"
              variant={breakpoint === "mobile" ? "secondary" : "ghost"}
              aria-label="Mobile"
              onClick={() => setBreakpoint("mobile")}
            >
              <SmartphoneIcon className="size-3.5" />
            </Button>
            <Button
              size="icon-sm"
              variant={outlines ? "secondary" : "ghost"}
              aria-label="Toggle outlines"
              onClick={() => setOutlines((value) => !value)}
            >
              <SquareDashedIcon className="size-3.5" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="gap-1.5"
              onClick={() => setFinderOpen(true)}
            >
              <SearchIcon className="size-3.5" />
              Finder
              <Kbd>⌘K</Kbd>
            </Button>
          </div>
        </div>

        <div className="flex min-h-0 flex-1">
          <aside className="flex w-64 shrink-0 flex-col overflow-y-auto border-r p-3">
            {left === "structure" ? (
              <Navigator
                blocks={present}
                selectedId={selectedId}
                onSelect={(id) => {
                  setSelectedId(id);
                  setInspectTab("content");
                }}
                onToggleHidden={(id) => {
                  const block = findBlock(present, id);
                  if (block) patch(id, { hidden: !block.hidden || undefined });
                }}
                onToggleLocked={(id) => {
                  const block = findBlock(present, id);
                  if (block) patch(id, { locked: !block.locked || undefined });
                }}
              />
            ) : (
              <Library
                catalog={catalog}
                showStarters={mode === "page"}
                onAdd={(type) => add(type)}
                onApplyTemplate={applyTemplate}
                onInsertSaved={(section) => {
                  const result = pasteBlock(present, selectedId, section.block);
                  apply(result.blocks, { select: result.id });
                  setLeft("structure");
                }}
              />
            )}
          </aside>

          <Canvas
            blocks={present}
            selectedId={selectedId}
            breakpoint={breakpoint}
            outlines={outlines}
            onSelect={(id) => {
              setSelectedId(id);
              if (id) setInspectTab("content");
            }}
            onDrop={drop}
            onAdd={add}
            onDuplicate={(id) => {
              const next = duplicateBlock(present, id);
              apply(next, { select: flattenTree(next).at(-1)?.id ?? id });
            }}
            onRemove={(id) => apply(deleteBlock(present, id), { select: null })}
            onCopy={(id) => {
              const block = findBlock(present, id);
              if (block) writeClipboard({ kind: "block", block });
            }}
            onCopyStyle={(id) => {
              const block = findBlock(present, id);
              if (block) writeClipboard({ kind: "style", style: block.style ?? {} });
            }}
            onPaste={() => {
              const clip = readClipboard();
              if (clip?.kind === "block") {
                const result = pasteBlock(present, selectedId, clip.block);
                apply(result.blocks, { select: result.id });
              }
            }}
            onPasteStyle={(id) => {
              const clip = readClipboard();
              if (clip?.kind === "style") apply(pasteStyle(present, id, clip.style));
            }}
            onWrapSection={(id) => {
              const next = wrapInSection(present, id);
              const section = flattenTree(next).find((node) => node.type === "section");
              apply(next, { select: section?.id ?? id });
            }}
            onWrapColumns={(id) => {
              const next = wrapInColumns(present, id, 2);
              apply(next, { select: id });
            }}
            onSaveSection={(id) => {
              const block = findBlock(present, id);
              if (!block) return;
              const name = window.prompt("Section name", block.type);
              if (name) saveSection(name, block);
            }}
            onApplyTemplate={applyTemplate}
          />

          <aside className="w-80 shrink-0 overflow-y-auto border-l p-4">
            {selected?.type === "columns" && inspectTab === "content" && (
              <div className="mb-4">
                <span className="mb-1.5 block text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                  Columns
                </span>
                <select
                  value={selected.content.columns ?? selected.children?.length ?? 3}
                  onChange={(event) =>
                    apply(setColumnCount(present, selected.id, Number(event.target.value)), {
                      select: selected.id,
                    })
                  }
                  className="h-8 w-full rounded-md border bg-background px-2 text-sm"
                >
                  <option value={1}>1</option>
                  <option value={2}>2</option>
                  <option value={3}>3</option>
                  <option value={4}>4</option>
                </select>
              </div>
            )}
            <Inspector
              blocks={present}
              selectedId={selectedId}
              tab={inspectTab}
              onTab={setInspectTab}
              onContent={(id, next) => patchContent(id, next)}
              onPatch={patch}
            />
          </aside>
        </div>

        <Finder
          open={finderOpen}
          onOpenChange={setFinderOpen}
          blocks={present}
          onAdd={(type) => add(type)}
          onSelect={(id) => {
            setSelectedId(id);
            setLeft("structure");
          }}
          onApplyTemplate={applyTemplate}
          onUndo={applyUndo}
          onRedo={applyRedo}
          onBreakpoint={setBreakpoint}
          onToggleOutlines={() => setOutlines((value) => !value)}
          catalog={catalog}
        />
      </div>
    </EditorRenderProvider>
  );
}

export function useDebouncedBlocks(
  entityId: string,
  initial: Block[],
  persist: (blocks: Block[]) => void,
): [Block[], (blocks: Block[]) => void] {
  const [held, setHeld] = useState({ id: entityId, blocks: initial });
  const skip = useRef(true);
  const persistRef = useRef(persist);
  persistRef.current = persist;

  if (held.id !== entityId) {
    setHeld({ id: entityId, blocks: initial });
    skip.current = true;
  }

  const blocks = held.id === entityId ? held.blocks : initial;

  useEffect(() => {
    if (skip.current) {
      skip.current = false;
      return;
    }
    const timer = window.setTimeout(() => persistRef.current(blocks), 600);
    return () => window.clearTimeout(timer);
  }, [blocks]);

  return [blocks, (next) => setHeld({ id: entityId, blocks: next })];
}
