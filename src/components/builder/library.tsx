import { useState } from "react";
import { Input } from "@/components/ui/input";
import { searchCatalog, type CatalogGroup } from "@/lib/catalog";
import { TYPE_MIME } from "@/lib/builder";
import { PAGE_TEMPLATES, listSavedSections, type SavedSection } from "@/lib/templates";
import type { BlockType } from "@/lib/content";

export function Library({
  onAdd,
  onApplyTemplate,
  onInsertSaved,
  catalog,
  showStarters = true,
}: {
  onAdd: (type: BlockType) => void;
  onApplyTemplate: (id: string) => void;
  onInsertSaved: (section: SavedSection) => void;
  catalog?: CatalogGroup[];
  showStarters?: boolean;
}) {
  const [query, setQuery] = useState("");
  const groups = catalog
    ? catalog
        .map((group) => ({
          ...group,
          items: group.items.filter((item) =>
            query.trim()
              ? [item.label, item.hint, item.type]
                  .join(" ")
                  .toLowerCase()
                  .includes(query.toLowerCase())
              : true,
          ),
        }))
        .filter((group) => group.items.length > 0)
    : searchCatalog(query);
  const saved = typeof window === "undefined" ? [] : listSavedSections();

  return (
    <div className="flex flex-col gap-5">
      <Input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search widgets…"
        aria-label="Search widgets"
      />

      {showStarters && query.trim() === "" && (
        <div className="flex flex-col gap-2">
          <div className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
            Start from
          </div>
          <div className="grid grid-cols-2 gap-2">
            {PAGE_TEMPLATES.map((template) => (
              <button
                key={template.id}
                type="button"
                onClick={() => onApplyTemplate(template.id)}
                className="rounded-lg border px-2 py-2 text-left hover:bg-muted/50"
              >
                <div className="text-xs font-medium">{template.label}</div>
                <div className="text-[10px] text-muted-foreground">{template.hint}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {groups.map((group) => (
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
                onClick={() => onAdd(item.type)}
                className="rounded-lg border px-2 py-2 text-left hover:bg-muted/50"
              >
                <div className="text-xs font-medium">{item.label}</div>
                <div className="text-[10px] text-muted-foreground">{item.hint}</div>
              </button>
            ))}
          </div>
        </div>
      ))}

      {saved.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
            Saved sections
          </div>
          <div className="flex flex-col gap-1">
            {saved.map((section) => (
              <button
                key={section.id}
                type="button"
                onClick={() => onInsertSaved(section)}
                className="rounded-lg border px-2 py-2 text-left text-xs hover:bg-muted/50"
              >
                {section.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {groups.length === 0 && (
        <p className="text-sm text-muted-foreground">No widgets match “{query}”.</p>
      )}
    </div>
  );
}
