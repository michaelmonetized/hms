import type { ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useCollectionData } from "@/components/site/collection-data";
import {
  findBlock,
  type Block,
  type BlockContent,
  type BlockStyle,
  type Breakpoint,
  type CompareOp,
  type FormActionType,
  type FormFieldType,
  type VisibilityOp,
} from "@/lib/content";
import { explainVisibility, insertToken, tokensForContext } from "@/lib/dynamic";
import { cn } from "@/lib/utils";
import { useDynamicContext } from "@/components/builder/dynamic-context";

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </span>
      {children}
    </label>
  );
}

function Select({
  value,
  onChange,
  children,
}: {
  value: string | number;
  onChange: (value: string) => void;
  children: ReactNode;
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-8 rounded-md border bg-background px-2 text-sm"
    >
      {children}
    </select>
  );
}

function NumberField({
  value,
  onChange,
  placeholder,
}: {
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  placeholder?: string;
}) {
  return (
    <Input
      type="number"
      value={value ?? ""}
      placeholder={placeholder}
      onChange={(event) => {
        const next = event.target.value;
        onChange(next === "" ? undefined : Number(next));
      }}
    />
  );
}

export function Inspector({
  blocks,
  selectedId,
  tab,
  onTab,
  onContent,
  onPatch,
}: {
  blocks: Block[];
  selectedId: string | null;
  tab: "content" | "style" | "advanced" | "dynamic";
  onTab: (tab: "content" | "style" | "advanced" | "dynamic") => void;
  onContent: (id: string, patch: Partial<BlockContent>) => void;
  onPatch: (id: string, patch: Partial<Omit<Block, "id">>) => void;
}) {
  const library = useCollectionData();
  const media = library.media;
  const block = selectedId ? findBlock(blocks, selectedId) : null;

  if (!block) {
    return (
      <p className="px-1 text-sm text-muted-foreground">
        Select a block on the canvas, in the navigator, or press ⌘K.
      </p>
    );
  }

  const setContent = (patch: Partial<BlockContent>) => onContent(block.id, patch);
  const setStyle = (patch: Partial<BlockStyle>) =>
    onPatch(block.id, { style: { ...block.style, ...patch } });
  const content = block.content;
  const style = block.style ?? {};

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <div className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          {block.type}
          {block.locked ? " · locked" : ""}
          {block.hidden ? " · hidden" : ""}
        </div>
        <div className="grid grid-cols-4 rounded-lg border p-0.5 text-[10px] font-medium">
          {(["content", "style", "advanced", "dynamic"] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => onTab(item)}
              className={cn(
                "rounded-md px-1 py-1.5 capitalize",
                tab === item ? "bg-muted text-foreground" : "text-muted-foreground",
              )}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {tab === "content" && (
        <ContentFields
          block={block}
          content={content}
          media={media}
          library={library}
          onChange={setContent}
        />
      )}

      {tab === "style" && <StyleFields style={style} onChange={setStyle} />}

      {tab === "advanced" && (
        <div className="flex flex-col gap-4">
          <Field label="HTML ID">
            <Input
              value={block.htmlId ?? ""}
              onChange={(event) => onPatch(block.id, { htmlId: event.target.value || undefined })}
            />
          </Field>
          <Field label="CSS class">
            <Input
              value={block.cssClass ?? ""}
              onChange={(event) => onPatch(block.id, { cssClass: event.target.value || undefined })}
            />
          </Field>
          <label className="flex items-center justify-between gap-3 text-sm">
            <span>Lock</span>
            <input
              type="checkbox"
              checked={Boolean(block.locked)}
              onChange={(event) => onPatch(block.id, { locked: event.target.checked || undefined })}
            />
          </label>
          <label className="flex items-center justify-between gap-3 text-sm">
            <span>Hide on the live page</span>
            <input
              type="checkbox"
              checked={Boolean(block.hidden)}
              onChange={(event) => onPatch(block.id, { hidden: event.target.checked || undefined })}
            />
          </label>
        </div>
      )}

      {tab === "dynamic" && (
        <DynamicFields
          block={block}
          onContent={setContent}
          onPatch={(patch) => onPatch(block.id, patch)}
        />
      )}
    </div>
  );
}

function ContentFields({
  block,
  content,
  media,
  library,
  onChange,
}: {
  block: Block;
  content: BlockContent;
  media: { _id: string; url?: string; name: string; mimeType: string }[];
  library: ReturnType<typeof useCollectionData>;
  onChange: (patch: Partial<BlockContent>) => void;
}) {
  if (block.type === "column") {
    return <p className="text-sm text-muted-foreground">Drop blocks into this column.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      {content.title !== undefined && (
        <Field label="Title">
          <Input
            value={content.title}
            onChange={(event) => onChange({ title: event.target.value })}
          />
        </Field>
      )}
      {content.subtitle !== undefined && (
        <Field label="Subtitle">
          <Input
            value={content.subtitle}
            onChange={(event) => onChange({ subtitle: event.target.value })}
          />
        </Field>
      )}
      {content.body !== undefined && (
        <Field label={block.type === "html" ? "HTML" : "Body"}>
          <Textarea
            value={content.body}
            onChange={(event) => onChange({ body: event.target.value })}
            rows={block.type === "html" ? 8 : 5}
            className={block.type === "html" ? "font-mono text-xs" : undefined}
          />
        </Field>
      )}
      {content.buttonText !== undefined && (
        <Field label="Button">
          <Input
            value={content.buttonText}
            onChange={(event) => onChange({ buttonText: event.target.value })}
          />
        </Field>
      )}
      {content.buttonHref !== undefined && (
        <Field label="Button link">
          <Input
            value={content.buttonHref}
            onChange={(event) => onChange({ buttonHref: event.target.value })}
          />
        </Field>
      )}
      {content.url !== undefined && (
        <Field label="URL">
          <Input value={content.url} onChange={(event) => onChange({ url: event.target.value })} />
        </Field>
      )}
      {content.urls !== undefined && (
        <Field label="URLs, one per line">
          <Textarea
            value={(content.urls ?? []).join("\n")}
            onChange={(event) =>
              onChange({
                urls: event.target.value
                  .split("\n")
                  .map((line) => line.trim())
                  .filter(Boolean),
              })
            }
            rows={5}
            className="font-mono text-xs"
          />
        </Field>
      )}
      {content.items !== undefined && block.type !== "form" && (
        <Field label="Items, one per line">
          <Textarea
            value={(content.items ?? []).join("\n")}
            onChange={(event) =>
              onChange({
                items: event.target.value.split("\n").filter((line) => line.trim().length > 0),
              })
            }
            rows={5}
          />
        </Field>
      )}
      {block.type === "heading" && (
        <Field label="Level">
          <Select
            value={content.level ?? 2}
            onChange={(value) => onChange({ level: Number(value) as 1 | 2 | 3 })}
          >
            <option value={1}>H1</option>
            <option value={2}>H2</option>
            <option value={3}>H3</option>
          </Select>
        </Field>
      )}
      {block.type === "collection" && (
        <>
          <Field label="Source">
            <Select
              value={content.source ?? "posts"}
              onChange={(value) => onChange({ source: value as BlockContent["source"] })}
            >
              <option value="pages">Pages</option>
              <option value="posts">Posts</option>
              <option value="products">Products</option>
              <option value="media">Media</option>
              {library.contentTypes.map((item) => (
                <option key={item._id} value={item.slug}>
                  {item.plural}
                </option>
              ))}
              {content.source?.startsWith("repeater:") && (
                <option value={content.source}>{content.source}</option>
              )}
            </Select>
          </Field>
          <Field label="Repeater key">
            <Input
              value={content.source?.startsWith("repeater:") ? content.source.slice(9) : ""}
              placeholder="team"
              onChange={(event) =>
                onChange({
                  source: event.target.value ? `repeater:${event.target.value}` : content.source,
                })
              }
            />
          </Field>
          <Field label="Layout">
            <Select
              value={content.layout ?? "grid"}
              onChange={(value) => onChange({ layout: value as BlockContent["layout"] })}
            >
              <option value="grid">Grid</option>
              <option value="table">Table</option>
              <option value="carousel">Carousel</option>
              <option value="gallery">Gallery</option>
              <option value="list">List</option>
            </Select>
          </Field>
          <Field label="Limit">
            <Input
              type="number"
              value={content.limit ?? 6}
              onChange={(event) => onChange({ limit: Number(event.target.value) || 6 })}
            />
          </Field>
          <Field label="Columns">
            <Select
              value={content.columns ?? 3}
              onChange={(value) => onChange({ columns: Number(value) })}
            >
              <option value={2}>2</option>
              <option value={3}>3</option>
              <option value={4}>4</option>
            </Select>
          </Field>
          <Field label="Loop item">
            <Select
              value={content.loopItemId ?? ""}
              onChange={(value) => onChange({ loopItemId: value || undefined })}
            >
              <option value="">Default card</option>
              {library.blueprints
                .filter((item) => item.kind === "loop-item")
                .map((item) => (
                  <option key={item._id} value={item._id}>
                    {item.name}
                  </option>
                ))}
            </Select>
          </Field>
          <Field label="Sort">
            <Select
              value={content.sort ?? "date-desc"}
              onChange={(value) => onChange({ sort: value as BlockContent["sort"] })}
            >
              <option value="date-desc">Newest</option>
              <option value="date-asc">Oldest</option>
              <option value="title-asc">Title A–Z</option>
              <option value="title-desc">Title Z–A</option>
              <option value="field-asc">Field A–Z</option>
              <option value="field-desc">Field Z–A</option>
            </Select>
          </Field>
          {(content.sort === "field-asc" || content.sort === "field-desc") && (
            <Field label="Sort field">
              <Input
                value={content.sortField ?? ""}
                onChange={(event) => onChange({ sortField: event.target.value })}
              />
            </Field>
          )}
          <Field label="Filter field">
            <Input
              value={content.filterField ?? ""}
              placeholder="price or title"
              onChange={(event) => onChange({ filterField: event.target.value || undefined })}
            />
          </Field>
          {content.filterField && (
            <>
              <Field label="Compare">
                <Select
                  value={content.filterCompare ?? "eq"}
                  onChange={(value) => onChange({ filterCompare: value as CompareOp })}
                >
                  <option value="eq">equals</option>
                  <option value="neq">not equal</option>
                  <option value="gt">greater</option>
                  <option value="lt">less</option>
                  <option value="contains">contains</option>
                  <option value="empty">empty</option>
                  <option value="not-empty">not empty</option>
                </Select>
              </Field>
              <Field label="Filter value">
                <Input
                  value={content.filterValue ?? ""}
                  onChange={(event) => onChange({ filterValue: event.target.value })}
                />
              </Field>
            </>
          )}
          <Field label="Related field">
            <Input
              value={content.relatedField ?? ""}
              placeholder="same value as current entry"
              onChange={(event) => onChange({ relatedField: event.target.value || undefined })}
            />
          </Field>
          <label className="flex items-center justify-between text-sm">
            Exclude current
            <input
              type="checkbox"
              checked={Boolean(content.excludeCurrent)}
              onChange={(event) => onChange({ excludeCurrent: event.target.checked || undefined })}
            />
          </label>
          <label className="flex items-center justify-between text-sm">
            Paginate
            <input
              type="checkbox"
              checked={Boolean(content.paginate)}
              onChange={(event) => onChange({ paginate: event.target.checked || undefined })}
            />
          </label>
          <label className="flex items-center justify-between text-sm">
            Load more
            <input
              type="checkbox"
              checked={Boolean(content.loadMore)}
              onChange={(event) => onChange({ loadMore: event.target.checked || undefined })}
            />
          </label>
          <Field label="Search query key">
            <Input
              value={content.searchParam ?? ""}
              placeholder="q"
              onChange={(event) => onChange({ searchParam: event.target.value || undefined })}
            />
          </Field>
          <Field label="Facet field">
            <Input
              value={content.facetField ?? ""}
              placeholder="sector or tags"
              onChange={(event) => onChange({ facetField: event.target.value || undefined })}
            />
          </Field>
          <Field label="Empty title">
            <Input
              value={content.emptyTitle ?? ""}
              onChange={(event) => onChange({ emptyTitle: event.target.value || undefined })}
            />
          </Field>
          <Field label="Empty body">
            <Input
              value={content.emptyBody ?? ""}
              onChange={(event) => onChange({ emptyBody: event.target.value || undefined })}
            />
          </Field>
        </>
      )}
      {block.type === "form" && (
        <>
          <Field label="After submit">
            <Select
              value={content.formAction ?? "none"}
              onChange={(value) => onChange({ formAction: value as FormActionType })}
            >
              <option value="none">Store only</option>
              <option value="email">Email</option>
              <option value="create-entry">Create entry</option>
              <option value="redirect">Redirect</option>
            </Select>
          </Field>
          {content.formAction && content.formAction !== "none" && (
            <Field
              label={
                content.formAction === "email"
                  ? "Send to"
                  : content.formAction === "create-entry"
                    ? "Content type slug"
                    : "URL"
              }
            >
              <Input
                value={content.formTarget ?? ""}
                onChange={(event) => onChange({ formTarget: event.target.value })}
              />
            </Field>
          )}
          <Field label="Then go to (optional)">
            <Input
              value={content.formRedirect ?? ""}
              placeholder="/thanks"
              onChange={(event) => onChange({ formRedirect: event.target.value || undefined })}
            />
          </Field>
        </>
      )}
      {block.type === "field" && (
        <>
          <Field label="Input type">
            <Select
              value={content.fieldType ?? "text"}
              onChange={(value) => onChange({ fieldType: value as FormFieldType })}
            >
              <option value="text">Text</option>
              <option value="email">Email</option>
              <option value="textarea">Textarea</option>
              <option value="select">Select</option>
              <option value="checkbox">Checkbox</option>
              <option value="number">Number</option>
              <option value="url">URL</option>
            </Select>
          </Field>
          <Field label="Placeholder">
            <Input
              value={content.placeholder ?? ""}
              onChange={(event) => onChange({ placeholder: event.target.value })}
            />
          </Field>
          <label className="flex items-center justify-between text-sm">
            Required
            <input
              type="checkbox"
              checked={Boolean(content.required)}
              onChange={(event) => onChange({ required: event.target.checked })}
            />
          </label>
          <Field label="Show when field">
            <Input
              value={content.showWhenField ?? ""}
              placeholder="Name of another field"
              onChange={(event) => onChange({ showWhenField: event.target.value || undefined })}
            />
          </Field>
          {content.showWhenField && (
            <Field label="equals">
              <Input
                value={content.showWhenValue ?? ""}
                onChange={(event) => onChange({ showWhenValue: event.target.value })}
              />
            </Field>
          )}
        </>
      )}
      {block.type === "component" && (
        <Field label="Component">
          <Select
            value={content.blueprintId ?? ""}
            onChange={(value) => onChange({ blueprintId: value })}
          >
            <option value="">Choose…</option>
            {library.blueprints
              .filter((item) => item.kind === "component")
              .map((item) => (
                <option key={item._id} value={item._id}>
                  {item.name}
                </option>
              ))}
          </Select>
        </Field>
      )}

      {(content.url !== undefined || content.urls !== undefined) && media.length > 0 && (
        <Field label="Media library">
          <div className="grid grid-cols-4 gap-1.5">
            {media
              .filter((item) => item.url)
              .slice(0, 12)
              .map((item) => (
                <button
                  key={item._id}
                  type="button"
                  className="overflow-hidden rounded-md border"
                  onClick={() => {
                    if (content.urls !== undefined) {
                      onChange({ urls: [...(content.urls ?? []), item.url ?? ""] });
                      return;
                    }
                    onChange({ url: item.url });
                  }}
                >
                  {item.mimeType.startsWith("image/") ? (
                    <img src={item.url} alt={item.name} className="aspect-square object-cover" />
                  ) : (
                    <span className="flex aspect-square items-center justify-center p-1 text-[9px]">
                      {item.name}
                    </span>
                  )}
                </button>
              ))}
          </div>
        </Field>
      )}
    </div>
  );
}

function StyleFields({
  style,
  onChange,
}: {
  style: BlockStyle;
  onChange: (patch: Partial<BlockStyle>) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <Field label="Align">
        <Select
          value={style.align ?? ""}
          onChange={(value) =>
            onChange({ align: (value || undefined) as BlockStyle["align"] | undefined })
          }
        >
          <option value="">Default</option>
          <option value="left">Left</option>
          <option value="center">Center</option>
          <option value="right">Right</option>
        </Select>
      </Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Pad top">
          <NumberField
            value={style.paddingTop}
            onChange={(value) => onChange({ paddingTop: value })}
          />
        </Field>
        <Field label="Pad bottom">
          <NumberField
            value={style.paddingBottom}
            onChange={(value) => onChange({ paddingBottom: value })}
          />
        </Field>
        <Field label="Pad left">
          <NumberField
            value={style.paddingLeft}
            onChange={(value) => onChange({ paddingLeft: value })}
          />
        </Field>
        <Field label="Pad right">
          <NumberField
            value={style.paddingRight}
            onChange={(value) => onChange({ paddingRight: value })}
          />
        </Field>
        <Field label="Margin top">
          <NumberField
            value={style.marginTop}
            onChange={(value) => onChange({ marginTop: value })}
          />
        </Field>
        <Field label="Margin bottom">
          <NumberField
            value={style.marginBottom}
            onChange={(value) => onChange({ marginBottom: value })}
          />
        </Field>
      </div>
      <Field label="Max width (px)">
        <NumberField value={style.maxWidth} onChange={(value) => onChange({ maxWidth: value })} />
      </Field>
      <Field label="Font size (px)">
        <NumberField value={style.fontSize} onChange={(value) => onChange({ fontSize: value })} />
      </Field>
      <Field label="Background">
        <div className="flex gap-2">
          <Input
            type="color"
            className="w-12 px-1"
            value={isHex(style.background) ? style.background : "#ffffff"}
            onChange={(event) => onChange({ background: event.target.value })}
          />
          <Input
            value={style.background ?? ""}
            placeholder="#111 or var(--card)"
            onChange={(event) => onChange({ background: event.target.value || undefined })}
          />
        </div>
      </Field>
      <Field label="Text color">
        <div className="flex gap-2">
          <Input
            type="color"
            className="w-12 px-1"
            value={isHex(style.color) ? style.color : "#111111"}
            onChange={(event) => onChange({ color: event.target.value })}
          />
          <Input
            value={style.color ?? ""}
            placeholder="#111 or inherit"
            onChange={(event) => onChange({ color: event.target.value || undefined })}
          />
        </div>
      </Field>
      <Button
        size="sm"
        variant="outline"
        onClick={() =>
          onChange({
            paddingTop: undefined,
            paddingRight: undefined,
            paddingBottom: undefined,
            paddingLeft: undefined,
            marginTop: undefined,
            marginBottom: undefined,
            background: undefined,
            color: undefined,
            maxWidth: undefined,
            align: undefined,
            fontSize: undefined,
          })
        }
      >
        Reset style
      </Button>
    </div>
  );
}

function DynamicFields({
  block,
  onContent,
  onPatch,
}: {
  block: Block;
  onContent: (patch: Partial<BlockContent>) => void;
  onPatch: (patch: Partial<Omit<Block, "id">>) => void;
}) {
  const library = useCollectionData();
  const dynamic = useDynamicContext();
  const typeFields =
    library.contentTypes.find((item) => item.slug === dynamic.document?.slug)?.fields ??
    library.contentTypes.flatMap((item) => item.fields);
  const tokens = tokensForContext(typeFields).slice(0, 16);
  const bindable = (
    [
      ["title", "Title"],
      ["subtitle", "Subtitle"],
      ["body", "Body"],
      ["buttonText", "Button"],
      ["buttonHref", "Button link"],
      ["url", "URL"],
    ] as const
  ).filter(([key]) => block.content[key] !== undefined);

  const hideOn = block.visibility?.hideOn ?? [];
  const conditions = block.visibility?.conditions ?? [];
  const setVisibility = (patch: Partial<NonNullable<Block["visibility"]>>) =>
    onPatch({ visibility: { ...block.visibility, ...patch } });

  const toggleHide = (device: Breakpoint) => {
    const next = hideOn.includes(device)
      ? hideOn.filter((item) => item !== device)
      : [...hideOn, device];
    setVisibility({ hideOn: next.length > 0 ? next : undefined });
  };

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs text-muted-foreground">
        Tokens accept modifiers: {"{{doc.title|upper}}"}, {"{{field.client|fallback:TBD}}"},{" "}
        {"{{doc.excerpt|truncate:140}}"}.
      </p>
      {bindable.map(([key, label]) => (
        <Field key={key} label={`${label} token`}>
          <Input
            value={block.bindings?.[key] ?? ""}
            placeholder="{{doc.title|fallback:Untitled}}"
            onChange={(event) =>
              onPatch({
                bindings: {
                  ...block.bindings,
                  [key]: event.target.value || undefined,
                },
              })
            }
          />
          <div className="flex flex-wrap gap-1 pt-1">
            {tokens.map((token) => (
              <button
                key={token.token}
                type="button"
                className="rounded border px-1.5 py-0.5 text-[10px] text-muted-foreground hover:bg-muted"
                onClick={() => {
                  const current = block.content[key] ?? "";
                  onContent({ [key]: insertToken(String(current), token.token) });
                }}
              >
                {token.label}
              </button>
            ))}
          </div>
        </Field>
      ))}
      {bindable.length === 0 && (
        <p className="text-xs text-muted-foreground">This block has no bindable copy.</p>
      )}

      <Field label="Match">
        <Select
          value={block.visibility?.match ?? "all"}
          onChange={(value) => setVisibility({ match: value as "all" | "any" })}
        >
          <option value="all">All conditions (AND)</option>
          <option value="any">Any condition (OR)</option>
        </Select>
      </Field>
      {conditions.map((condition, index) => (
        <div key={`${condition.op}-${index}`} className="flex flex-col gap-2 rounded-md border p-2">
          <Field label="If">
            <Select
              value={condition.op}
              onChange={(value) =>
                setVisibility({
                  conditions: conditions.map((item, i) =>
                    i === index ? { ...item, op: value as VisibilityOp } : item,
                  ),
                })
              }
            >
              <option value="logged-in">Logged in</option>
              <option value="logged-out">Logged out</option>
              <option value="role">Role</option>
              <option value="query">Query param</option>
              <option value="referrer">Referrer</option>
              <option value="cookie">Cookie</option>
              <option value="schedule">Schedule</option>
              <option value="field">Field compare</option>
              <option value="device">Device</option>
              <option value="never">Never</option>
              <option value="always">Always</option>
            </Select>
          </Field>
          {(condition.op === "query" ||
            condition.op === "cookie" ||
            condition.op === "field" ||
            condition.op === "role") && (
            <Field label={condition.op === "field" || condition.op === "role" ? "Name" : "Key"}>
              <Input
                value={condition.key ?? ""}
                onChange={(event) =>
                  setVisibility({
                    conditions: conditions.map((item, i) =>
                      i === index ? { ...item, key: event.target.value } : item,
                    ),
                  })
                }
              />
            </Field>
          )}
          {(condition.op === "query" ||
            condition.op === "cookie" ||
            condition.op === "field" ||
            condition.op === "referrer" ||
            condition.op === "role" ||
            condition.op === "device") && (
            <Field label="Value">
              <Input
                value={condition.value ?? ""}
                onChange={(event) =>
                  setVisibility({
                    conditions: conditions.map((item, i) =>
                      i === index ? { ...item, value: event.target.value } : item,
                    ),
                  })
                }
              />
            </Field>
          )}
          {condition.op === "field" && (
            <Field label="Compare">
              <Select
                value={condition.compare ?? "eq"}
                onChange={(value) =>
                  setVisibility({
                    conditions: conditions.map((item, i) =>
                      i === index ? { ...item, compare: value as CompareOp } : item,
                    ),
                  })
                }
              >
                <option value="eq">equals</option>
                <option value="neq">not equal</option>
                <option value="gt">greater</option>
                <option value="lt">less</option>
                <option value="contains">contains</option>
                <option value="empty">empty</option>
                <option value="not-empty">not empty</option>
              </Select>
            </Field>
          )}
          {condition.op === "schedule" && (
            <>
              <Field label="From">
                <Input
                  type="date"
                  value={condition.from ?? ""}
                  onChange={(event) =>
                    setVisibility({
                      conditions: conditions.map((item, i) =>
                        i === index ? { ...item, from: event.target.value } : item,
                      ),
                    })
                  }
                />
              </Field>
              <Field label="To">
                <Input
                  type="date"
                  value={condition.to ?? ""}
                  onChange={(event) =>
                    setVisibility({
                      conditions: conditions.map((item, i) =>
                        i === index ? { ...item, to: event.target.value } : item,
                      ),
                    })
                  }
                />
              </Field>
            </>
          )}
          <Button
            size="sm"
            variant="ghost"
            className="self-start text-destructive"
            onClick={() => setVisibility({ conditions: conditions.filter((_, i) => i !== index) })}
          >
            Remove condition
          </Button>
        </div>
      ))}
      <Button
        size="sm"
        variant="outline"
        onClick={() => setVisibility({ conditions: [...conditions, { op: "logged-in" }] })}
      >
        Add condition
      </Button>
      {conditions.length === 0 && (
        <Field label="Simple rule">
          <Select
            value={block.visibility?.when ?? "always"}
            onChange={(value) =>
              setVisibility({ when: value as NonNullable<Block["visibility"]>["when"] })
            }
          >
            <option value="always">Always</option>
            <option value="logged-in">Logged in</option>
            <option value="logged-out">Logged out</option>
            <option value="query">Query param</option>
            <option value="never">Never</option>
          </Select>
        </Field>
      )}
      {conditions.length === 0 && block.visibility?.when === "query" && (
        <>
          <Field label="Query key">
            <Input
              value={block.visibility?.queryKey ?? ""}
              onChange={(event) => setVisibility({ queryKey: event.target.value })}
            />
          </Field>
          <Field label="Query value">
            <Input
              value={block.visibility?.queryValue ?? ""}
              onChange={(event) => setVisibility({ queryValue: event.target.value })}
            />
          </Field>
        </>
      )}
      <Field label="Fallback when hidden">
        <Input
          value={block.visibility?.fallback ?? ""}
          placeholder="Shown to everyone else"
          onChange={(event) => setVisibility({ fallback: event.target.value || undefined })}
        />
      </Field>
      <div className="flex flex-col gap-1 rounded-md border p-2">
        <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          Now
        </span>
        <span className="text-xs">
          {explainVisibility(block.visibility, dynamic, "desktop").visible ? "Visible" : "Hidden"}
        </span>
        {explainVisibility(block.visibility, dynamic, "desktop").lines.map((line) => (
          <span key={line} className="text-[10px] text-muted-foreground">
            {line}
          </span>
        ))}
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
          Hide on device
        </span>
        {(["desktop", "tablet", "mobile"] as const).map((device) => (
          <label key={device} className="flex items-center justify-between text-sm capitalize">
            {device}
            <input
              type="checkbox"
              checked={hideOn.includes(device)}
              onChange={() => toggleHide(device)}
            />
          </label>
        ))}
      </div>
    </div>
  );
}

function isHex(value?: string): value is string {
  return Boolean(value && /^#[0-9a-fA-F]{6}$/.test(value));
}
