import {
  cloneBlock,
  CONTAINER_TYPES,
  createBlock,
  findBlock,
  insertBlockTree,
  locateBlock,
  moveBlockTree,
  newId,
  patchBlock,
  removeBlockTree,
  type Block,
  type BlockStyle,
  type BlockType,
} from "./content";

export type History = {
  past: Block[][];
  present: Block[];
  future: Block[][];
};

export type ClipboardPayload =
  | { kind: "block"; block: Block }
  | { kind: "style"; style: BlockStyle };

export const TYPE_MIME = "application/x-hms-block-type";
export const ID_MIME = "application/x-hms-block-id";

const CLIPBOARD_KEY = "hms.builder.clipboard";
const HISTORY_LIMIT = 80;

/**
 * Create history
 * Starts an undo stack with the given tree as present.
 */
export function createHistory(blocks: Block[]): History {
  return { past: [], present: blocks, future: [] };
}

/**
 * Commit
 * Pushes present onto past unless `replace` is set (coalesced typing).
 */
export function commit(history: History, next: Block[], options?: { replace?: boolean }): History {
  if (history.present === next) return history;
  if (options?.replace) {
    return { ...history, present: next };
  }
  return {
    past: [...history.past, history.present].slice(-HISTORY_LIMIT),
    present: next,
    future: [],
  };
}

/**
 * Undo
 */
export function undo(history: History): History {
  const previous = history.past[history.past.length - 1];
  if (!previous) return history;
  return {
    past: history.past.slice(0, -1),
    present: previous,
    future: [history.present, ...history.future],
  };
}

/**
 * Redo
 */
export function redo(history: History): History {
  const [next, ...rest] = history.future;
  if (!next) return history;
  return {
    past: [...history.past, history.present],
    present: next,
    future: rest,
  };
}

export function canUndo(history: History): boolean {
  return history.past.length > 0;
}

export function canRedo(history: History): boolean {
  return history.future.length > 0;
}

/**
 * Duplicate block
 * Inserts a clone with new ids immediately after the original.
 */
export function duplicateBlock(blocks: Block[], id: string): Block[] {
  const location = locateBlock(blocks, id);
  if (!location) return blocks;
  return insertBlockTree(blocks, location.parentId, location.index + 1, cloneBlock(location.block));
}

/**
 * Move by offset
 * Moves a block among its siblings. No-op at the ends or when locked.
 */
export function moveByOffset(blocks: Block[], id: string, delta: number): Block[] {
  if (delta === 0) return blocks;
  const location = locateBlock(blocks, id);
  if (!location || location.block.locked) return blocks;
  const siblings = location.parentId
    ? (findBlock(blocks, location.parentId)?.children ?? [])
    : blocks;
  const target = location.index + delta;
  if (target < 0 || target >= siblings.length) return blocks;
  return moveBlockTree(blocks, id, location.parentId, location.index + (delta > 0 ? 1 : -1));
}

/**
 * Wrap in section
 * Places the block inside a new section at the same location.
 */
export function wrapInSection(blocks: Block[], id: string): Block[] {
  const location = locateBlock(blocks, id);
  if (!location || location.block.type === "column") return blocks;
  const section = createBlock("section");
  section.children = [location.block];
  const without = removeBlockTree(blocks, id);
  return insertBlockTree(without, location.parentId, location.index, section);
}

/**
 * Wrap in columns
 * Places the block in the first column of a new columns row.
 */
export function wrapInColumns(blocks: Block[], id: string, count = 2): Block[] {
  const location = locateBlock(blocks, id);
  if (!location || location.block.type === "column") return blocks;
  const columns = createBlock("columns");
  const safe = Math.max(1, Math.min(4, count));
  columns.content = { ...columns.content, columns: safe };
  columns.children = Array.from({ length: safe }, (_, index) => ({
    id: newId(),
    type: "column" as const,
    content: {},
    children: index === 0 ? [location.block] : [],
  }));
  const without = removeBlockTree(blocks, id);
  return insertBlockTree(without, location.parentId, location.index, columns);
}

/**
 * Set column count
 * Adds empty columns or folds overflow children into the last remaining column.
 */
export function setColumnCount(blocks: Block[], id: string, count: number): Block[] {
  const block = findBlock(blocks, id);
  if (!block || block.type !== "columns") return blocks;
  const nextCount = Math.max(1, Math.min(4, Math.round(count)));
  const current = block.children ?? [];
  let children = current.slice();
  if (nextCount > children.length) {
    while (children.length < nextCount) {
      children.push({ id: newId(), type: "column", content: {}, children: [] });
    }
  } else if (nextCount < children.length) {
    const kept = children.slice(0, nextCount);
    const overflow = children.slice(nextCount).flatMap((column) => column.children ?? []);
    const last = kept[kept.length - 1];
    kept[kept.length - 1] = {
      ...last,
      children: [...(last.children ?? []), ...overflow],
    };
    children = kept;
  }
  return patchBlock(blocks, id, { content: { columns: nextCount }, children });
}

/**
 * Delete block
 * No-op when the block is locked or missing.
 */
export function deleteBlock(blocks: Block[], id: string): Block[] {
  const block = findBlock(blocks, id);
  if (!block || block.locked) return blocks;
  return removeBlockTree(blocks, id);
}

/**
 * Paste block
 * Clones the clipboard block after the selection, or into a container.
 */
export function pasteBlock(
  blocks: Block[],
  selectedId: string | null,
  incoming: Block,
): { blocks: Block[]; id: string } {
  const clone = cloneBlock(incoming);
  if (clone.type === "column") {
    return { blocks, id: selectedId ?? clone.id };
  }
  if (!selectedId) {
    return { blocks: insertBlockTree(blocks, null, blocks.length, clone), id: clone.id };
  }
  const location = locateBlock(blocks, selectedId);
  if (!location) {
    return { blocks: insertBlockTree(blocks, null, blocks.length, clone), id: clone.id };
  }
  if (CONTAINER_TYPES.has(location.block.type)) {
    const index = location.block.children?.length ?? 0;
    return { blocks: insertBlockTree(blocks, location.block.id, index, clone), id: clone.id };
  }
  return {
    blocks: insertBlockTree(blocks, location.parentId, location.index + 1, clone),
    id: clone.id,
  };
}

/**
 * Paste style
 */
export function pasteStyle(blocks: Block[], id: string, style: BlockStyle): Block[] {
  return patchBlock(blocks, id, { style: { ...style } });
}

/**
 * Insert type
 * Creates a block of `type` after the selection or into a container.
 */
export function insertType(
  blocks: Block[],
  selectedId: string | null,
  type: BlockType,
  parentId: string | null = null,
  index?: number,
): { blocks: Block[]; id: string } {
  const incoming = createBlock(type);
  if (parentId !== null || index !== undefined) {
    const next = insertBlockTree(blocks, parentId, index ?? 0, incoming);
    return { blocks: next, id: incoming.id };
  }
  return pasteBlock(blocks, selectedId, incoming);
}

/**
 * Write clipboard
 * Stores a payload in memory-compatible localStorage.
 */
export function writeClipboard(payload: ClipboardPayload): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(CLIPBOARD_KEY, JSON.stringify(payload));
  } catch {
    // private mode
  }
}

/**
 * Read clipboard
 */
export function readClipboard(): ClipboardPayload | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(CLIPBOARD_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ClipboardPayload;
    if (parsed.kind === "block" && parsed.block && typeof parsed.block.id === "string") {
      return parsed;
    }
    if (parsed.kind === "style" && parsed.style && typeof parsed.style === "object") {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export function isContainer(type: BlockType): boolean {
  return CONTAINER_TYPES.has(type);
}
