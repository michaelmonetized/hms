import { type ChangeEvent, useState } from "react";
import { ImageIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useHMS } from "@/hooks/use-hms";
import { formatBytes, relativeTime } from "@/lib/content";
import { toast } from "@/components/ui/lib";

export default function Media() {
  const hms = useHMS();
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      await hms.uploadMedia(Array.from(files));
      toast.add({
        title: `Uploaded ${files.length} file${files.length === 1 ? "" : "s"}`,
        type: "success",
      });
    } catch (error) {
      toast.add({
        title: error instanceof Error ? error.message : "Upload failed",
        type: "error",
      });
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Media</h1>
          <p className="mt-1 text-sm text-muted-foreground">Images, documents, and media assets.</p>
        </div>
        <label className="cursor-pointer">
          <input
            type="file"
            multiple
            onChange={(event) => void handleFileUpload(event)}
            className="hidden"
          />
          <Button
            size="sm"
            nativeButton={false}
            render={<span />}
            className="pointer-events-none gap-1.5"
            disabled={uploading}
          >
            <PlusIcon className="size-3.5" />
            {uploading ? "Uploading…" : "Upload File"}
          </Button>
        </label>
      </div>

      <label className="flex cursor-pointer flex-col items-center justify-center gap-4 rounded-xl border border-dashed bg-card py-12 text-center transition-colors hover:bg-muted/30">
        <input
          type="file"
          multiple
          onChange={(event) => void handleFileUpload(event)}
          className="hidden"
        />
        <div className="flex size-12 items-center justify-center rounded-xl border bg-muted">
          <ImageIcon className="size-5 text-muted-foreground" />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium">Drop files here or click to select</span>
          <span className="text-xs text-muted-foreground">PNG, JPG, SVG, WebP up to 10MB</span>
        </div>
      </label>

      {hms.media.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
          {hms.media.map((item) => (
            <div
              key={item._id}
              className="group relative flex flex-col overflow-hidden rounded-xl border bg-card p-2"
            >
              <div className="flex aspect-square items-center justify-center rounded-lg bg-muted p-2">
                {item.url && item.mimeType.startsWith("image/") ? (
                  <img
                    src={item.url}
                    alt={item.name}
                    className="max-h-full max-w-full object-contain"
                  />
                ) : (
                  <ImageIcon className="size-6 text-muted-foreground" />
                )}
              </div>
              <div className="mt-2 flex items-center justify-between gap-2">
                <div className="flex min-w-0 flex-col truncate">
                  <span className="truncate text-xs font-medium">{item.name}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {formatBytes(item.size)} · {relativeTime(item.createdAt)}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => void hms.removeMedia(item._id)}
                  className="text-destructive opacity-0 transition-opacity group-hover:opacity-100 hover:text-destructive"
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
