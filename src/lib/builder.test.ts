import { describe, expect, test } from "vite-plus/test";
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
  redo,
  setColumnCount,
  undo,
  wrapInColumns,
  wrapInSection,
} from "./builder";
import { createBlock, findBlock } from "./content";

describe("history", () => {
  test("undoes and redoes a commit", () => {
    const first = [createBlock("heading")];
    const second = [...first, createBlock("text")];
    let history = createHistory(first);
    history = commit(history, second);
    expect(history.present).toHaveLength(2);
    expect(canUndo(history)).toBe(true);
    history = undo(history);
    expect(history.present).toHaveLength(1);
    expect(canRedo(history)).toBe(true);
    history = redo(history);
    expect(history.present).toHaveLength(2);
  });

  test("replace does not push a new past entry", () => {
    const first = [createBlock("heading")];
    let history = createHistory(first);
    const typed = [{ ...first[0], content: { ...first[0].content, title: "A" } }];
    history = commit(history, typed);
    const typedMore = [{ ...typed[0], content: { ...typed[0].content, title: "AB" } }];
    history = commit(history, typedMore, { replace: true });
    expect(history.past).toHaveLength(1);
    history = undo(history);
    expect(history.present[0].content.title).toBe(first[0].content.title);
  });
});

describe("tree commands", () => {
  test("duplicates a block after the original with a new id", () => {
    const heading = createBlock("heading");
    const next = duplicateBlock([heading], heading.id);
    expect(next).toHaveLength(2);
    expect(next[1].type).toBe("heading");
    expect(next[1].id).not.toBe(heading.id);
  });

  test("does not delete a locked block", () => {
    const heading = { ...createBlock("heading"), locked: true };
    expect(deleteBlock([heading], heading.id)).toEqual([heading]);
  });

  test("deletes an unlocked block", () => {
    const heading = createBlock("heading");
    expect(deleteBlock([heading], heading.id)).toEqual([]);
  });

  test("moves a block down among siblings", () => {
    const a = createBlock("heading");
    const b = createBlock("text");
    const moved = moveByOffset([a, b], a.id, 1);
    expect(moved.map((block) => block.id)).toEqual([b.id, a.id]);
  });

  test("wraps a block in a section", () => {
    const heading = createBlock("heading");
    const next = wrapInSection([heading], heading.id);
    expect(next[0].type).toBe("section");
    expect(next[0].children?.[0].id).toBe(heading.id);
  });

  test("wraps a block in columns", () => {
    const heading = createBlock("heading");
    const next = wrapInColumns([heading], heading.id, 2);
    expect(next[0].type).toBe("columns");
    expect(next[0].children).toHaveLength(2);
    expect(next[0].children?.[0].children?.[0].id).toBe(heading.id);
  });

  test("folds overflow columns when the count shrinks", () => {
    const columns = createBlock("columns");
    const third = columns.children?.[2].id ?? "";
    const filled = insertType([columns], null, "image", third, 0);
    const shrunk = setColumnCount(filled.blocks, columns.id, 2);
    expect(shrunk[0].children).toHaveLength(2);
    expect(shrunk[0].content.columns).toBe(2);
    const lastChildren = shrunk[0].children?.[1].children ?? [];
    expect(lastChildren.some((child) => child.type === "image")).toBe(true);
  });

  test("pastes into a section as a child", () => {
    const section = createBlock("section");
    const text = createBlock("text");
    const result = pasteBlock([section], section.id, text);
    expect(result.blocks[0].children?.[0].type).toBe("text");
    expect(result.blocks[0].children?.[0].id).not.toBe(text.id);
  });

  test("pastes a style onto another block", () => {
    const heading = createBlock("heading");
    const next = pasteStyle([heading], heading.id, { background: "#111", paddingTop: 24 });
    expect(next[0].style?.background).toBe("#111");
    expect(next[0].style?.paddingTop).toBe(24);
  });
});

describe("insertType", () => {
  test("appends a block when nothing is selected", () => {
    const heading = createBlock("heading");
    const result = insertType([heading], null, "cta");
    expect(result.blocks.map((block) => block.type)).toEqual(["heading", "cta"]);
    expect(findBlock(result.blocks, result.id)?.type).toBe("cta");
  });
});
