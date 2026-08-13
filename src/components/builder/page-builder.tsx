import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
} from "lucide-react";

export interface Block {
  id: string;
  type: "hero" | "heading" | "text" | "features" | "cta";
  content: {
    title?: string;
    subtitle?: string;
    body?: string;
    buttonText?: string;
    items?: string[];
  };
}

export function PageBuilder({
  initialTitle = "Untitled Page",
  initialBlocks = [],
  onSave,
}: {
  initialTitle?: string;
  initialBlocks?: Block[];
  onSave?: (title: string, blocks: Block[]) => void;
}) {
  const [title, setTitle] = useState(initialTitle);
  const [blocks, setBlocks] = useState<Block[]>(
    initialBlocks.length > 0
      ? initialBlocks
      : [
          {
            id: "1",
            type: "hero",
            content: {
              title: "Build Systems That Scale",
              subtitle: "Simplicity is prerequisite for reliability.",
              buttonText: "Get Started",
            },
          },
          {
            id: "2",
            type: "features",
            content: {
              title: "Features",
              items: ["Realtime JSON Page Builder", "Timestamped Revisions", "Native A/B Testing"],
            },
          },
        ],
  );

  const [activeTab, setActiveTab] = useState<"visual" | "preview" | "json">("visual");
  const [revisions, setRevisions] = useState<{ timestamp: string; blocks: Block[] }[]>([]);

  const addBlock = (type: Block["type"]) => {
    const newBlock: Block = {
      id: String(Date.now()),
      type,
      content:
        type === "hero"
          ? {
              title: "New Hero Title",
              subtitle: "Subtitle goes here",
              buttonText: "Click Me",
            }
          : type === "heading"
            ? { title: "Section Heading" }
            : type === "text"
              ? { body: "Write your content here..." }
              : type === "features"
                ? {
                    title: "Feature List",
                    items: ["Feature 1", "Feature 2", "Feature 3"],
                  }
                : {
                    title: "Ready to launch?",
                    subtitle: "Join thousands of builders.",
                    buttonText: "Start Free",
                  },
    };
    setBlocks((prev) => [...prev, newBlock]);
  };

  const updateBlock = (id: string, field: string, value: string | string[]) => {
    setBlocks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, content: { ...b.content, [field]: value } } : b)),
    );
  };

  const removeBlock = (id: string) => {
    setBlocks((prev) => prev.filter((b) => b.id !== id));
  };

  const moveBlock = (index: number, direction: "up" | "down") => {
    const newBlocks = [...blocks];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newBlocks.length) return;
    const [moved] = newBlocks.splice(index, 1);
    newBlocks.splice(targetIndex, 0, moved);
    setBlocks(newBlocks);
  };

  const saveRevision = () => {
    const rev = {
      timestamp: new Date().toLocaleTimeString(),
      blocks: JSON.parse(JSON.stringify(blocks)),
    };
    setRevisions((prev) => [rev, ...prev]);
    if (onSave) onSave(title, blocks);
  };

  return (
    <div className="flex flex-col gap-4 rounded-xl border bg-card p-6 shadow-xs">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
        <div className="flex items-center gap-3">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="h-9 w-64 text-base font-semibold tracking-tight"
            placeholder="Page Title"
          />
          <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
            Realtime JSON
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg border bg-muted p-1 text-xs">
            <button
              onClick={() => setActiveTab("visual")}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 font-medium transition-colors ${
                activeTab === "visual"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <LayoutIcon className="size-3.5" />
              Editor
            </button>
            <button
              onClick={() => setActiveTab("preview")}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 font-medium transition-colors ${
                activeTab === "preview"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <EyeIcon className="size-3.5" />
              Preview
            </button>
            <button
              onClick={() => setActiveTab("json")}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 font-medium transition-colors ${
                activeTab === "json"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <CodeIcon className="size-3.5" />
              JSON
            </button>
          </div>

          <Button size="sm" onClick={saveRevision} className="gap-1.5">
            <SaveIcon className="size-3.5" />
            Save Revision
          </Button>
        </div>
      </div>

      {/* Editor view */}
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
          </div>

          <div className="flex flex-col gap-3">
            {blocks.map((block, index) => (
              <div
                key={block.id}
                className="group relative flex flex-col gap-3 rounded-lg border bg-muted/40 p-4 transition-all hover:border-foreground/20"
              >
                <div className="flex items-center justify-between border-b pb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
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

                {/* Block Fields */}
                <div className="flex flex-col gap-2">
                  {block.content.title !== undefined && (
                    <Input
                      value={block.content.title}
                      onChange={(e) => updateBlock(block.id, "title", e.target.value)}
                      placeholder="Title"
                      className="text-sm font-medium"
                    />
                  )}
                  {block.content.subtitle !== undefined && (
                    <Input
                      value={block.content.subtitle}
                      onChange={(e) => updateBlock(block.id, "subtitle", e.target.value)}
                      placeholder="Subtitle"
                      className="text-xs text-muted-foreground"
                    />
                  )}
                  {block.content.body !== undefined && (
                    <textarea
                      value={block.content.body}
                      onChange={(e) => updateBlock(block.id, "body", e.target.value)}
                      placeholder="Body text"
                      rows={3}
                      className="w-full rounded-md border bg-background p-2 text-xs"
                    />
                  )}
                  {block.content.buttonText !== undefined && (
                    <Input
                      value={block.content.buttonText}
                      onChange={(e) => updateBlock(block.id, "buttonText", e.target.value)}
                      placeholder="Button Label"
                      className="w-48 text-xs"
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Live Preview View */}
      {activeTab === "preview" && (
        <div className="flex flex-col gap-12 rounded-lg border bg-background p-8">
          {blocks.map((block) => (
            <div key={block.id} className="flex flex-col gap-4">
              {block.type === "hero" && (
                <div className="flex flex-col items-center gap-4 py-8 text-center">
                  <h1 className="max-w-2xl text-4xl font-extrabold tracking-tight">
                    {block.content.title}
                  </h1>
                  <p className="max-w-md text-base text-muted-foreground">
                    {block.content.subtitle}
                  </p>
                  {block.content.buttonText && (
                    <Button size="lg">{block.content.buttonText}</Button>
                  )}
                </div>
              )}
              {block.type === "heading" && (
                <h2 className="text-2xl font-bold tracking-tight">{block.content.title}</h2>
              )}
              {block.type === "text" && (
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {block.content.body}
                </p>
              )}
              {block.type === "features" && (
                <div className="flex flex-col gap-4">
                  <h3 className="text-lg font-semibold">{block.content.title}</h3>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {block.content.items?.map((item, idx) => (
                      <div
                        key={idx}
                        className="rounded-lg border bg-muted/30 p-4 font-medium text-xs"
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {block.type === "cta" && (
                <div className="flex flex-col items-center justify-between gap-4 rounded-xl border bg-muted/40 p-6 sm:flex-row">
                  <div className="flex flex-col gap-1">
                    <h3 className="text-lg font-semibold">{block.content.title}</h3>
                    <p className="text-xs text-muted-foreground">{block.content.subtitle}</p>
                  </div>
                  {block.content.buttonText && <Button>{block.content.buttonText}</Button>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* JSON Structure View */}
      {activeTab === "json" && (
        <pre className="max-h-96 overflow-auto rounded-lg border bg-muted p-4 font-mono text-xs text-foreground">
          {JSON.stringify({ title, blocks }, null, 2)}
        </pre>
      )}

      {/* Revision History Log */}
      {revisions.length > 0 && (
        <div className="mt-4 flex flex-col gap-2 border-t pt-4">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
            <HistoryIcon className="size-3.5" /> Revisions Saved ({revisions.length})
          </div>
          <div className="flex flex-wrap gap-2">
            {revisions.map((rev, i) => (
              <button
                key={i}
                onClick={() => setBlocks(rev.blocks)}
                className="rounded-md border bg-muted/60 px-2.5 py-1 text-xs hover:bg-muted"
              >
                Rollback to {rev.timestamp}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
