import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { CATALOG, type CatalogGroup } from "@/lib/catalog";
import { flattenTree, type Block, type BlockType, type Breakpoint } from "@/lib/content";
import { PAGE_TEMPLATES } from "@/lib/templates";

export function Finder({
  open,
  onOpenChange,
  blocks,
  onAdd,
  onSelect,
  onApplyTemplate,
  onUndo,
  onRedo,
  onBreakpoint,
  onToggleOutlines,
  catalog,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  blocks: Block[];
  onAdd: (type: BlockType) => void;
  onSelect: (id: string) => void;
  onApplyTemplate: (id: string) => void;
  onUndo: () => void;
  onRedo: () => void;
  onBreakpoint: (device: Breakpoint) => void;
  onToggleOutlines: () => void;
  catalog?: CatalogGroup[];
}) {
  const nodes = flattenTree(blocks);
  const items = (catalog ?? CATALOG).flatMap((group) => group.items);
  const run = (action: () => void) => {
    action();
    onOpenChange(false);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/30 pt-[12vh]"
      onClick={() => onOpenChange(false)}
      role="presentation"
    >
      <div
        role="dialog"
        aria-label="Finder"
        className="w-full max-w-lg overflow-hidden rounded-xl border bg-popover shadow-lg"
        onClick={(event) => event.stopPropagation()}
      >
        <Command>
          <CommandInput placeholder="Search blocks, structure, commands…" />
          <CommandList>
            <CommandEmpty>Nothing matches.</CommandEmpty>
            <CommandGroup heading="Add">
              {items.map((item) => (
                <CommandItem
                  key={item.type}
                  value={`${item.label} ${item.hint}`}
                  onSelect={() => run(() => onAdd(item.type))}
                >
                  {item.label}
                  <span className="text-muted-foreground"> {item.hint}</span>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Templates">
              {PAGE_TEMPLATES.map((template) => (
                <CommandItem
                  key={template.id}
                  value={`${template.label} ${template.hint} template`}
                  onSelect={() => run(() => onApplyTemplate(template.id))}
                >
                  {template.label}
                  <span className="text-muted-foreground"> {template.hint}</span>
                </CommandItem>
              ))}
            </CommandGroup>
            {nodes.length > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup heading="On this page">
                  {nodes.map((node) => (
                    <CommandItem
                      key={node.id}
                      value={`${node.type} ${node.label} ${node.id}`}
                      onSelect={() => run(() => onSelect(node.id))}
                    >
                      <span className="capitalize">{node.type.replaceAll("-", " ")}</span>
                      <span className="truncate text-muted-foreground"> {node.label}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
            <CommandSeparator />
            <CommandGroup heading="Commands">
              <CommandItem onSelect={() => run(onUndo)}>
                Undo
                <CommandShortcut>⌘Z</CommandShortcut>
              </CommandItem>
              <CommandItem onSelect={() => run(onRedo)}>
                Redo
                <CommandShortcut>⇧⌘Z</CommandShortcut>
              </CommandItem>
              <CommandItem onSelect={() => run(onToggleOutlines)}>Toggle outlines</CommandItem>
              <CommandItem onSelect={() => run(() => onBreakpoint("desktop"))}>
                Desktop canvas
              </CommandItem>
              <CommandItem onSelect={() => run(() => onBreakpoint("tablet"))}>
                Tablet canvas
              </CommandItem>
              <CommandItem onSelect={() => run(() => onBreakpoint("mobile"))}>
                Mobile canvas
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </div>
    </div>
  );
}
