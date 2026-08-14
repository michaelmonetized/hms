import { useNavigate } from "react-router-dom";
import { RssIcon, PlusIcon, PencilIcon, Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useHMS } from "@/hooks/use-hms";
import { publicPath, relativeTime } from "@/lib/content";
import { toast } from "@/components/ui/lib";

export default function Blog() {
  const hms = useHMS();
  const navigate = useNavigate();

  const handleCreate = async () => {
    const slug = `post-${Date.now()}`;
    await hms.createPost({ title: "Untitled post", slug });
    toast.add({ title: "Draft post created", type: "success" });
    void navigate(`${publicPath("post", slug)}?edit=1`);
  };

  if (!hms.ready) {
    return <div className="text-sm text-muted-foreground">Loading posts…</div>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Blog</h1>
          <p className="mt-1 text-sm text-muted-foreground">Open a post to edit it live.</p>
        </div>
        <Button size="sm" onClick={() => void handleCreate()} className="gap-1.5">
          <PlusIcon className="size-3.5" />
          New Post
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border bg-card">
        {hms.posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
            <div className="flex size-12 items-center justify-center rounded-xl border bg-muted">
              <RssIcon className="size-5 text-muted-foreground" />
            </div>
            <span className="text-sm font-medium">No posts yet</span>
            <Button size="sm" onClick={() => void handleCreate()}>
              New Post
            </Button>
          </div>
        ) : (
          <div className="flex flex-col divide-y">
            {hms.posts.map((post) => (
              <div key={post._id} className="flex items-center justify-between px-4 py-3">
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{post.title}</span>
                    <span className="text-xs text-muted-foreground">{post.status}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {post.excerpt || publicPath("post", post.slug)} · {relativeTime(post.updatedAt)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => navigate(`${publicPath("post", post.slug)}?edit=1`)}
                  >
                    <PencilIcon className="size-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => void hms.removePost(post._id)}
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
