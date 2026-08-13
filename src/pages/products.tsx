import { useState } from "react";
import { PackageIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Product {
  id: string;
  name: string;
  type: "physical" | "digital" | "subscription";
  price: number;
  status: "active" | "draft";
}

const initialProducts: Product[] = [
  {
    id: "1",
    name: "HMS Pro License",
    type: "subscription",
    price: 4900,
    status: "active",
  },
  {
    id: "2",
    name: "Starter Theme Pack",
    type: "digital",
    price: 2900,
    status: "active",
  },
];

export default function Products() {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [type, setType] = useState<Product["type"]>("digital");

  const handleCreate = () => {
    if (!name.trim()) return;
    const numPrice = Math.round(parseFloat(price || "0") * 100);
    const prod: Product = {
      id: String(Date.now()),
      name,
      type,
      price: isNaN(numPrice) ? 0 : numPrice,
      status: "active",
    };
    setProducts([prod, ...products]);
    setName("");
    setPrice("");
    setIsCreating(false);
  };

  const handleDelete = (id: string) => {
    setProducts(products.filter((p) => p.id !== id));
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Products</h1>
          <p className="text-muted-foreground text-sm mt-1">
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
              onChange={(e) => setName(e.target.value)}
              placeholder="Product Name"
            />
            <Input
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="Price ($ USD)"
              type="number"
              step="0.01"
            />
            <select
              value={type}
              onChange={(e) => setType(e.target.value as Product["type"])}
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
            <Button size="sm" onClick={handleCreate}>
              Save Product
            </Button>
          </div>
        </div>
      )}

      <div className="rounded-xl border bg-card overflow-hidden">
        {products.length === 0 ? (
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
            {products.map((prod) => (
              <div
                key={prod.id}
                className="flex items-center justify-between px-4 py-3 hover:bg-muted/40 transition-colors"
              >
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{prod.name}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-muted font-medium capitalize text-muted-foreground">
                      {prod.type}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground font-mono">
                    ${(prod.price / 100).toFixed(2)} USD
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => handleDelete(prod.id)}
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
