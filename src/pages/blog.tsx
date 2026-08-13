import { useState } from "react";
import { RssIcon, PlusIcon, Trash2Icon, PencilIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  status: "published" | "draft";
  publishedAt: string;
}

const initialPosts: Post[] = [
  {
    id: "1",
    title: "Why We Built HMS to Replace WordPress",
    slug: "why-we-built-hms",
    excerpt: "Dynamic rendering, real-time edits, zero technical debt.",
    status: "published",
    publishedAt: "Aug 12, 2026",
  },
];

export default function Blog() {
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newExcerpt, setNewExcerpt] = useState("");

  const handleCreate = () => {
    if (!newTitle.trim()) return;
    const post: Post = {
      id: String(Date.now()),
      title: newTitle,
      slug: newTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      excerpt: newExcerpt || "No excerpt provided.",
      status: "draft",
      publishedAt: "Just now",
    };
    setPosts([post, ...posts]);
    setNewTitle("");
    setNewExcerpt("");
    setIsCreating(false);
  };

  const handleDelete = (id: string) => {
    setPosts(posts.filter((p) => p.id !== id));
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Blog</h1>
          <p className="text-muted-foreground text-sm mt-1">Write, manage, and publish posts.</p>
        </div>
        <Button size="sm" onClick={() => setIsCreating(true)} className="gap-1.5">
          <PlusIcon className="size-3.5" />
          New Post
        </Button>
      </div>

      {isCreating && (
        <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-xs">
          <span className="text-sm font-semibold">New Blog Post</span>
          <Input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Post Title"
          />
          <textarea
            value={newExcerpt}
            onChange={(e) => setNewExcerpt(e.target.value)}
            placeholder="Short excerpt or description..."
            rows={2}
            className="w-full rounded-md border bg-background p-2 text-xs"
          />
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="ghost" onClick={() => setIsCreating(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleCreate}>
              Save Post
            </Button>
          </div>
        </div>
      )}

      <div className="rounded-xl border bg-card overflow-hidden">
        {posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
            <div className="flex size-12 items-center justify-center rounded-xl border bg-muted">
              <RssIcon className="size-5 text-muted-foreground" />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium">No posts yet</span>
              <span className="text-xs text-muted-foreground">Write your first post.</span>
            </div>
            <Button size="sm" onClick={() => setIsCreating(true)} className="gap-1.5">
              <PlusIcon className="size-3.5" />
              New Post
            </Button>
          </div>
        ) : (
          <div className="flex flex-col divide-y">
            {posts.map((post) => (
              <div
                key={post.id}
                className="flex items-center justify-between px-4 py-3 hover:bg-muted/40 transition-colors"
              >
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{post.title}</span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        post.status === "published"
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {post.status}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">{post.excerpt}</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground hidden sm:inline">
                    {post.publishedAt}
                  </span>
                  <Button variant="ghost" size="icon-sm">
                    <PencilIcon className="size-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => handleDelete(post.id)}
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
