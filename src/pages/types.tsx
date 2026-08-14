import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { PlusIcon, PencilIcon, Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useHMS } from "@/hooks/use-hms";
import { createContentField, type ContentFieldType } from "@/lib/blueprints";
import { managePath, publicPath, relativeTime, slugify } from "@/lib/content";
import { toast } from "@/components/ui/lib";

export default function Types() {
  const hms = useHMS();
  const navigate = useNavigate();
  const [name, setName] = useState("");

  const create = async () => {
    const label = name.trim() || "Untitled type";
    const id = await hms.createContentType({
      name: label,
      fields: [createContentField({ label: "Summary", type: "text" })],
    });
    toast.add({ title: "Content type created", type: "success" });
    setName("");
    void navigate(`${managePath("types")}/${id}`);
  };

  if (!hms.ready) return <div className="text-sm text-muted-foreground">Loading types…</div>;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Content types</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          A schema plus templates. Blog posts stay posts; everything else is an entry.
        </p>
      </div>

      <form
        className="flex flex-wrap items-end gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          void create();
        }}
      >
        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-medium uppercase text-muted-foreground">Name</span>
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Case study"
          />
        </div>
        <Button size="sm" type="submit">
          <PlusIcon className="size-3.5" /> Create type
        </Button>
      </form>

      <div className="overflow-hidden rounded-xl border bg-card">
        {hms.contentTypes.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-muted-foreground">No types yet.</p>
        ) : (
          <div className="flex flex-col divide-y">
            {hms.contentTypes.map((type) => (
              <div key={type._id} className="flex items-center justify-between px-4 py-3">
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{type.name}</span>
                  <span className="font-mono text-xs text-muted-foreground">
                    /{type.slug} · {type.fields.length} fields
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => navigate(`${managePath("types")}/${type._id}`)}
                  >
                    <PencilIcon className="size-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="text-destructive"
                    onClick={() => void hms.removeContentType(type._id)}
                  >
                    <Trash2Icon className="size-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function TypeEditor() {
  const { id } = useParams();
  const hms = useHMS();
  const navigate = useNavigate();
  const type = hms.contentTypes.find((item) => item._id === id);
  const [entryTitle, setEntryTitle] = useState("");

  if (!hms.ready) return <div className="text-sm text-muted-foreground">Loading…</div>;
  if (!type) {
    return (
      <p className="text-sm text-muted-foreground">
        Type not found. <Link to={managePath("types")}>Back</Link>
      </p>
    );
  }

  const entries = hms.entries.filter((item) => item.contentTypeId === type._id);
  const archive = hms.blueprints.find(
    (item) =>
      item.kind === "template" &&
      item.appliesTo === "entry-archive" &&
      item.contentTypeId === type._id,
  );
  const single = hms.blueprints.find(
    (item) =>
      item.kind === "template" &&
      item.appliesTo === "entry-single" &&
      item.contentTypeId === type._id,
  );

  const ensureTemplate = async (surface: "entry-archive" | "entry-single") => {
    const existing = surface === "entry-archive" ? archive : single;
    if (existing) {
      void navigate(`${managePath("library")}/${existing._id}`);
      return;
    }
    const templateId = await hms.createBlueprint({
      name: `${type.name} ${surface === "entry-archive" ? "archive" : "single"}`,
      kind: "template",
      appliesTo: surface,
      contentTypeId: type._id,
    });
    void navigate(`${managePath("library")}/${templateId}`);
  };

  const addField = (fieldType: ContentFieldType) => {
    void hms.updateContentType(type._id, {
      fields: [...type.fields, createContentField({ label: "New field", type: fieldType })],
    });
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link to={managePath("types")} className="text-xs text-muted-foreground">
            Content types
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight">{type.name}</h1>
          <p className="font-mono text-xs text-muted-foreground">/{type.slug}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => void ensureTemplate("entry-archive")}>
            Archive template
          </Button>
          <Button size="sm" variant="outline" onClick={() => void ensureTemplate("entry-single")}>
            Single template
          </Button>
          <Button
            size="sm"
            variant="outline"
            nativeButton={false}
            render={<Link to={`/${type.slug}`} />}
          >
            View archive
          </Button>
        </div>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold">Fields</h2>
        <div className="flex flex-col divide-y rounded-xl border">
          {type.fields.map((field) => (
            <div key={field.id} className="grid gap-2 px-3 py-2 sm:grid-cols-4">
              <Input
                value={field.label}
                onChange={(event) =>
                  void hms.updateContentType(type._id, {
                    fields: type.fields.map((item) =>
                      item.id === field.id ? { ...item, label: event.target.value } : item,
                    ),
                  })
                }
              />
              <Input
                value={field.key}
                className="font-mono text-xs"
                onChange={(event) =>
                  void hms.updateContentType(type._id, {
                    fields: type.fields.map((item) =>
                      item.id === field.id ? { ...item, key: event.target.value } : item,
                    ),
                  })
                }
              />
              <select
                value={field.type}
                className="h-8 rounded-md border bg-background px-2 text-sm"
                onChange={(event) =>
                  void hms.updateContentType(type._id, {
                    fields: type.fields.map((item) =>
                      item.id === field.id
                        ? { ...item, type: event.target.value as ContentFieldType }
                        : item,
                    ),
                  })
                }
              >
                <option value="text">Text</option>
                <option value="rich">Rich</option>
                <option value="image">Image</option>
                <option value="url">URL</option>
                <option value="number">Number</option>
                <option value="date">Date</option>
                <option value="relation">Relation</option>
                <option value="repeater">Repeater</option>
                <option value="terms">Terms</option>
              </select>
              {field.type === "relation" && (
                <select
                  value={field.relationTypeId ?? ""}
                  className="h-8 rounded-md border bg-background px-2 text-sm sm:col-span-4"
                  onChange={(event) =>
                    void hms.updateContentType(type._id, {
                      fields: type.fields.map((item) =>
                        item.id === field.id
                          ? { ...item, relationTypeId: event.target.value || undefined }
                          : item,
                      ),
                    })
                  }
                >
                  <option value="">Related type…</option>
                  {hms.contentTypes.map((item) => (
                    <option key={item._id} value={item._id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              )}
              {field.type === "terms" && (
                <Input
                  value={(field.options ?? []).join(", ")}
                  placeholder="design, build, care"
                  className="sm:col-span-4"
                  onChange={(event) =>
                    void hms.updateContentType(type._id, {
                      fields: type.fields.map((item) =>
                        item.id === field.id
                          ? {
                              ...item,
                              options: event.target.value
                                .split(",")
                                .map((part) => part.trim())
                                .filter(Boolean),
                            }
                          : item,
                      ),
                    })
                  }
                />
              )}
              {field.type === "repeater" && (
                <div className="flex flex-wrap gap-2 sm:col-span-4">
                  {(field.repeaterFields ?? []).map((sub) => (
                    <span key={sub.id} className="rounded border px-2 py-1 text-xs">
                      {sub.label}
                    </span>
                  ))}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      void hms.updateContentType(type._id, {
                        fields: type.fields.map((item) =>
                          item.id === field.id
                            ? {
                                ...item,
                                repeaterFields: [
                                  ...(item.repeaterFields ?? []),
                                  createContentField({ label: "Item", type: "text" }),
                                ],
                              }
                            : item,
                        ),
                      })
                    }
                  >
                    + row field
                  </Button>
                </div>
              )}
              <Button
                size="sm"
                variant="ghost"
                className="text-destructive"
                onClick={() =>
                  void hms.updateContentType(type._id, {
                    fields: type.fields.filter((item) => item.id !== field.id),
                  })
                }
              >
                Remove
              </Button>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {(["text", "image", "url", "number", "relation", "repeater", "terms"] as const).map(
            (fieldType) => (
              <Button
                key={fieldType}
                size="sm"
                variant="outline"
                onClick={() => addField(fieldType)}
              >
                + {fieldType}
              </Button>
            ),
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          In templates, bind copy to {"{{field."}
          {type.fields[0]?.key ?? "key"}
          {"}}"} or {"{{doc.title}}"}.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Entries</h2>
          <form
            className="flex gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              const title = entryTitle.trim() || "Untitled";
              void hms.createEntry({ contentTypeId: type._id, title }).then(() => {
                toast.add({ title: "Entry created", type: "success" });
                setEntryTitle("");
                void navigate(`${publicPath("entry", slugify(title), type.slug)}?edit=1`);
              });
            }}
          >
            <Input
              value={entryTitle}
              onChange={(event) => setEntryTitle(event.target.value)}
              placeholder="New entry title"
            />
            <Button size="sm" type="submit">
              New entry
            </Button>
          </form>
        </div>
        <div className="overflow-hidden rounded-xl border">
          {entries.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">No entries.</p>
          ) : (
            entries.map((entry) => (
              <div key={entry._id} className="flex items-center justify-between px-4 py-3">
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{entry.title}</span>
                  <span className="text-xs text-muted-foreground">
                    {publicPath("entry", entry.slug, type.slug)} · {relativeTime(entry.updatedAt)}
                  </span>
                </div>
                <div className="flex gap-1">
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    onClick={() => navigate(`${publicPath("entry", entry.slug, type.slug)}?edit=1`)}
                  >
                    <PencilIcon className="size-3.5" />
                  </Button>
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    className="text-destructive"
                    onClick={() => void hms.removeEntry(entry._id)}
                  >
                    <Trash2Icon className="size-3.5" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
