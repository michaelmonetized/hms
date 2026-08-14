import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { BoxesIcon, PlusIcon, PencilIcon, Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LiveEditor, useDebouncedBlocks } from "@/components/builder/live-editor";
import { useHMS } from "@/hooks/use-hms";
import { modeForKind, type BlueprintKind, type TemplateSurface } from "@/lib/blueprints";
import { managePath } from "@/lib/content";
import { toast } from "@/components/ui/lib";
import type { StoredBlueprint } from "@/lib/store";

const KINDS: { kind: BlueprintKind; label: string; hint: string }[] = [
  { kind: "form", label: "Forms", hint: "Fields visitors submit" },
  { kind: "component", label: "Components", hint: "Reusable trees you drop on a page" },
  { kind: "loop-item", label: "Loop items", hint: "One card in a collection or grid" },
  { kind: "template", label: "Templates", hint: "Blog, shop, header, and 404 layouts" },
];

const THEME_CREATES: { appliesTo: TemplateSurface; label: string; name: string }[] = [
  { appliesTo: "header", label: "Header", name: "Site header" },
  { appliesTo: "footer", label: "Footer", name: "Site footer" },
  { appliesTo: "404", label: "404", name: "Not found" },
  { appliesTo: "search", label: "Search", name: "Search" },
  { appliesTo: "product-archive", label: "Shop archive", name: "Shop archive" },
  { appliesTo: "product-single", label: "Product", name: "Product single" },
];

export default function Library() {
  const hms = useHMS();
  const navigate = useNavigate();

  const create = async (kind: BlueprintKind, appliesTo?: TemplateSurface) => {
    const name =
      kind === "form"
        ? "New form"
        : kind === "loop-item"
          ? "New loop item"
          : kind === "template"
            ? "New template"
            : "New component";
    const id = await hms.createBlueprint({ name, kind, appliesTo });
    toast.add({ title: `${name} created`, type: "success" });
    void navigate(`${managePath("library")}/${id}`);
  };

  const openTheme = async (item: (typeof THEME_CREATES)[number]) => {
    const existing = hms.blueprints.find(
      (blueprint) => blueprint.kind === "template" && blueprint.appliesTo === item.appliesTo,
    );
    if (existing) {
      void navigate(`${managePath("library")}/${existing._id}`);
      return;
    }
    const id = await hms.createBlueprint({
      name: item.name,
      kind: "template",
      appliesTo: item.appliesTo,
    });
    toast.add({ title: `${item.name} created`, type: "success" });
    void navigate(`${managePath("library")}/${id}`);
  };

  if (!hms.ready) return <div className="text-sm text-muted-foreground">Loading library…</div>;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Library</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Forms, components, loop items, and templates — all the same builder.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={() => void create("form")}>
          <PlusIcon className="size-3.5" /> New form
        </Button>
        <Button size="sm" variant="outline" onClick={() => void create("component")}>
          New component
        </Button>
        <Button size="sm" variant="outline" onClick={() => void create("loop-item")}>
          New loop item
        </Button>
        <Button size="sm" variant="outline" onClick={() => void create("template", "page")}>
          New template
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {THEME_CREATES.map((item) => (
          <Button
            key={item.appliesTo}
            size="sm"
            variant="ghost"
            onClick={() => void openTheme(item)}
          >
            {item.label}
          </Button>
        ))}
      </div>

      {KINDS.map((group) => {
        const items = hms.blueprints.filter((item) => item.kind === group.kind);
        return (
          <section key={group.kind} className="flex flex-col gap-2">
            <div>
              <h2 className="text-sm font-semibold">{group.label}</h2>
              <p className="text-xs text-muted-foreground">{group.hint}</p>
            </div>
            <div className="overflow-hidden rounded-xl border bg-card">
              {items.length === 0 ? (
                <div className="flex items-center gap-3 px-4 py-6 text-sm text-muted-foreground">
                  <BoxesIcon className="size-4" />
                  None yet.
                </div>
              ) : (
                <div className="flex flex-col divide-y">
                  {items.map((item) => (
                    <BlueprintRow
                      key={item._id}
                      item={item}
                      onOpen={() => navigate(`${managePath("library")}/${item._id}`)}
                      onRemove={() => void hms.removeBlueprint(item._id)}
                    />
                  ))}
                </div>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function BlueprintRow({
  item,
  onOpen,
  onRemove,
}: {
  item: StoredBlueprint;
  onOpen: () => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <div className="flex flex-col">
        <span className="text-sm font-medium">{item.name}</span>
        <span className="text-xs text-muted-foreground">
          {item.kind}
          {item.appliesTo ? ` · ${item.appliesTo}` : ""}
        </span>
      </div>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon-sm" onClick={onOpen} aria-label="Edit blueprint">
          <PencilIcon className="size-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          className="text-destructive"
          onClick={onRemove}
          aria-label="Delete blueprint"
        >
          <Trash2Icon className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}

export function LibraryEditor() {
  const { id } = useParams();
  const hms = useHMS();
  const blueprint = hms.blueprints.find((item) => item._id === id);

  if (!hms.ready) return <div className="text-sm text-muted-foreground">Loading…</div>;
  if (!blueprint) {
    return (
      <div className="px-6 py-20 text-center text-sm text-muted-foreground">
        Blueprint not found. <Link to={managePath("library")}>Back to library</Link>
      </div>
    );
  }

  return <BlueprintCanvas blueprint={blueprint} />;
}

function BlueprintCanvas({ blueprint }: { blueprint: StoredBlueprint }) {
  const hms = useHMS();
  const [name, setName] = useState(blueprint.name);
  const [blocks, setBlocks] = useDebouncedBlocks(
    blueprint._id,
    blueprint.content.blocks,
    (next) => {
      void hms.updateBlueprint(blueprint._id, { content: { blocks: next } });
    },
  );

  return (
    <div className="flex flex-col">
      <div className="flex h-12 items-center justify-between gap-3 border-b px-4">
        <div className="flex min-w-0 items-center gap-3">
          <Button
            size="sm"
            variant="ghost"
            nativeButton={false}
            render={<Link to={managePath("library")} />}
          >
            Library
          </Button>
          <Input
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              void hms.updateBlueprint(blueprint._id, { name: event.target.value });
            }}
            className="h-8 w-56"
          />
          <span className="text-xs text-muted-foreground capitalize">
            {blueprint.kind.replace("-", " ")}
            {blueprint.appliesTo ? ` · ${blueprint.appliesTo}` : ""}
          </span>
        </div>
      </div>
      <LiveEditor
        key={blueprint._id}
        blocks={blocks}
        onChange={setBlocks}
        mode={modeForKind(blueprint.kind)}
      />
    </div>
  );
}
