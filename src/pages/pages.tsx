import { useNavigate } from "react-router-dom";
import { FileTextIcon, PlusIcon, PencilIcon, Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useHMS } from "@/hooks/use-hms";
import { publicPath, relativeTime } from "@/lib/content";
import { toast } from "@/components/ui/lib";

export default function Pages() {
  const hms = useHMS();
  const navigate = useNavigate();

  const handleCreate = async () => {
    const slug = `page-${Date.now()}`;
    await hms.createPage({ title: "Untitled page", slug });
    toast.add({ title: "Draft page created", type: "success" });
    void navigate(`${publicPath("page", slug)}?edit=1`);
  };

  if (!hms.ready) {
    return <div className="text-sm text-muted-foreground">Loading pages…</div>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Pages</h1>
          <p className="mt-1 text-sm text-muted-foreground">Open a page to edit it live.</p>
        </div>
        <Button size="sm" onClick={() => void handleCreate()} className="gap-1.5">
          <PlusIcon className="size-3.5" />
          New Page
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border bg-card">
        {hms.pages.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
            <div className="flex size-12 items-center justify-center rounded-xl border bg-muted">
              <FileTextIcon className="size-5 text-muted-foreground" />
            </div>
            <span className="text-sm font-medium">No pages yet</span>
            <Button size="sm" onClick={() => void handleCreate()} className="gap-1.5">
              <PlusIcon className="size-3.5" />
              New Page
            </Button>
          </div>
        ) : (
          <div className="flex flex-col divide-y">
            {hms.pages.map((page) => (
              <div key={page._id} className="flex items-center justify-between px-4 py-3">
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{page.title}</span>
                    <span className="text-xs text-muted-foreground">{page.status}</span>
                  </div>
                  <span className="font-mono text-xs text-muted-foreground">
                    {publicPath("page", page.slug)} · {relativeTime(page.updatedAt)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => navigate(`${publicPath("page", page.slug)}?edit=1`)}
                  >
                    <PencilIcon className="size-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => void hms.removePage(page._id)}
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
