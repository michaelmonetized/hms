import { useState, type ChangeEvent } from "react";
import { ImageIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MediaItem {
  id: string;
  name: string;
  size: string;
  type: string;
  url: string;
}

export default function Media() {
  const [mediaList, setMediaList] = useState<MediaItem[]>([
    {
      id: "1",
      name: "hero-bg.png",
      size: "245 KB",
      type: "image/png",
      url: "/favicon.svg",
    },
  ]);

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newItems: MediaItem[] = Array.from(files).map((f, i) => ({
      id: String(Date.now() + i),
      name: f.name,
      size: `${(f.size / 1024).toFixed(1)} KB`,
      type: f.type,
      url: URL.createObjectURL(f),
    }));

    setMediaList([...newItems, ...mediaList]);
  };

  const handleDelete = (id: string) => {
    setMediaList(mediaList.filter((m) => m.id !== id));
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Media</h1>
          <p className="text-muted-foreground text-sm mt-1">Images, documents, and media assets.</p>
        </div>
        <label className="cursor-pointer">
          <input type="file" multiple onChange={handleFileUpload} className="hidden" />
          <Button
            size="sm"
            nativeButton={false}
            render={<span />}
            className="gap-1.5 pointer-events-none"
          >
            <PlusIcon className="size-3.5" />
            Upload File
          </Button>
        </label>
      </div>

      <label className="flex cursor-pointer flex-col items-center justify-center gap-4 rounded-xl border border-dashed bg-card py-12 text-center transition-colors hover:bg-muted/30">
        <input type="file" multiple onChange={handleFileUpload} className="hidden" />
        <div className="flex size-12 items-center justify-center rounded-xl border bg-muted">
          <ImageIcon className="size-5 text-muted-foreground" />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium">Drop files here or click to select</span>
          <span className="text-xs text-muted-foreground">PNG, JPG, SVG, WebP up to 10MB</span>
        </div>
      </label>

      {mediaList.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
          {mediaList.map((item) => (
            <div
              key={item.id}
              className="group relative flex flex-col overflow-hidden rounded-xl border bg-card p-2"
            >
              <div className="flex aspect-square items-center justify-center rounded-lg bg-muted p-2">
                <img
                  src={item.url}
                  alt={item.name}
                  className="max-h-full max-w-full object-contain"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = "none";
                  }}
                />
              </div>
              <div className="mt-2 flex items-center justify-between">
                <div className="flex flex-col truncate">
                  <span className="truncate text-xs font-medium">{item.name}</span>
                  <span className="text-[10px] text-muted-foreground">{item.size}</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => handleDelete(item.id)}
                  className="text-destructive hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2Icon className="size-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
