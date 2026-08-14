import { createContext, useContext, type ReactNode } from "react";
import type { BlockContent, Breakpoint } from "@/lib/content";

export type EditorRender = {
  editing: boolean;
  breakpoint: Breakpoint;
  selectedId: string | null;
  outlines: boolean;
  onInline: (id: string, patch: Partial<BlockContent>) => void;
};

const EditorRenderContext = createContext<EditorRender | null>(null);

export function EditorRenderProvider({
  value,
  children,
}: {
  value: EditorRender;
  children: ReactNode;
}) {
  return <EditorRenderContext.Provider value={value}>{children}</EditorRenderContext.Provider>;
}

export function useEditorRender(): EditorRender | null {
  return useContext(EditorRenderContext);
}
