import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { PackageIcon, PlusIcon, Trash2Icon, PencilIcon, ArrowLeftIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useHMS } from "@/hooks/use-hms";
import { formatPrice, publicPath, relativeTime } from "@/lib/content";
import { toast } from "@/components/ui/lib";
import type { StoredProduct } from "@/lib/store";

export default function Products() {
  const hms = useHMS();
  const [params, setParams] = useSearchParams();
  const editingId = params.get("edit");
  const editing = hms.products.find((product) => product._id === editingId) ?? null;
  const [isCreating, setIsCreating] = useState(params.get("new") === "1");
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [type, setType] = useState<StoredProduct["type"]>("digital");

  const open = (id: string | null) => {
    const next = new URLSearchParams();
    if (id) next.set("edit", id);
    setParams(next, { replace: true });
    setIsCreating(false);
  };

  const handleCreate = async () => {
    if (!name.trim()) return;
    const cents = Math.round(parseFloat(price || "0") * 100);
    const id = await hms.createProduct({
      name,
      type,
      price: Number.isNaN(cents) ? 0 : cents,
    });
    setName("");
    setPrice("");
    toast.add({ title: "Product created", type: "success" });
    open(id);
  };

  if (!hms.ready) {
    return <div className="text-sm text-muted-foreground">Loading products…</div>;
  }

  if (editing) {
    const currency = hms.site?.settings?.commerce?.currency ?? "USD";
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => open(null)} className="gap-1 text-xs">
            <ArrowLeftIcon className="size-3.5" /> Back to Products
          </Button>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              nativeButton={false}
              render={<Link to={publicPath("product", editing.slug)} />}
            >
              View live
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={async () => {
                await hms.removeProduct(editing._id);
                open(null);
              }}
              className="text-destructive hover:text-destructive"
            >
              <Trash2Icon className="size-3.5" /> Delete
            </Button>
          </div>
        </div>

        <div className="flex max-w-2xl flex-col gap-4 rounded-xl border bg-card p-6">
          <Input
            value={editing.name}
            onChange={(event) => void hms.updateProduct(editing._id, { name: event.target.value })}
          />
          <Input
            value={editing.slug}
            onChange={(event) => void hms.updateProduct(editing._id, { slug: event.target.value })}
            className="font-mono text-xs"
          />
          <div className="grid gap-3 sm:grid-cols-3">
            <Input
              type="number"
              step="0.01"
              value={(editing.price / 100).toFixed(2)}
              onChange={(event) => {
                const cents = Math.round(parseFloat(event.target.value || "0") * 100);
                void hms.updateProduct(editing._id, { price: Number.isNaN(cents) ? 0 : cents });
              }}
            />
            <select
              value={editing.status}
              onChange={(event) =>
                void hms.updateProduct(editing._id, {
                  status: event.target.value as StoredProduct["status"],
                })
              }
              className="rounded-md border bg-background px-3 py-1.5 text-sm"
            >
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="archived">Archived</option>
            </select>
            <Input
              type="number"
              value={editing.inventory ?? ""}
              placeholder="Inventory"
              onChange={(event) =>
                void hms.updateProduct(editing._id, {
                  inventory: event.target.value === "" ? undefined : Number(event.target.value),
                })
              }
            />
          </div>
          <textarea
            value={
              editing.description?.blocks
                .map((block) => block.content.body || block.content.title)
                .join("\n") ?? ""
            }
            onChange={(event) =>
              void hms.updateProduct(editing._id, {
                description: {
                  blocks: [
                    {
                      id: "desc",
                      type: "text",
                      content: { body: event.target.value },
                    },
                  ],
                },
              })
            }
            rows={5}
            className="w-full rounded-md border bg-background p-2 text-sm"
            placeholder="Product description"
          />
          <div className="text-xs text-muted-foreground">
            Listed at {formatPrice(editing.price, currency)} · {relativeTime(editing.updatedAt)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Products</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Physical items, digital downloads, and recurring subscriptions.
          </p>
        </div>
        <Button size="sm" onClick={() => setIsCreating(true)} className="gap-1.5">
          <PlusIcon className="size-3.5" />
          New Product
        </Button>
      </div>

      {isCreating && (
        <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-xs">
          <span className="text-sm font-semibold">New Product</span>
          <div className="grid gap-3 sm:grid-cols-3">
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Product Name"
            />
            <Input
              value={price}
              onChange={(event) => setPrice(event.target.value)}
              placeholder="Price ($ USD)"
              type="number"
              step="0.01"
            />
            <select
              value={type}
              onChange={(event) => setType(event.target.value as StoredProduct["type"])}
              className="rounded-md border bg-background px-3 py-1.5 text-sm"
            >
              <option value="digital">Digital Download</option>
              <option value="subscription">Subscription</option>
              <option value="physical">Physical Product</option>
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="ghost" onClick={() => setIsCreating(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={() => void handleCreate()}>
              Save Product
            </Button>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border bg-card">
        {hms.products.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
            <div className="flex size-12 items-center justify-center rounded-xl border bg-muted">
              <PackageIcon className="size-5 text-muted-foreground" />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium">No products yet</span>
              <span className="text-xs text-muted-foreground">
                Add your first product to start selling.
              </span>
            </div>
            <Button size="sm" onClick={() => setIsCreating(true)} className="gap-1.5">
              <PlusIcon className="size-3.5" />
              New Product
            </Button>
          </div>
        ) : (
          <div className="flex flex-col divide-y">
            {hms.products.map((product) => (
              <div
                key={product._id}
                className="flex items-center justify-between px-4 py-3 transition-colors hover:bg-muted/40"
              >
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{product.name}</span>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground capitalize">
                      {product.type}
                    </span>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                      {product.status}
                    </span>
                  </div>
                  <span className="font-mono text-xs text-muted-foreground">
                    {formatPrice(product.price, hms.site?.settings?.commerce?.currency ?? "USD")}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon-sm" onClick={() => open(product._id)}>
                    <PencilIcon className="size-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => void hms.removeProduct(product._id)}
                    className="text-destructive hover:text-destructive"
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
