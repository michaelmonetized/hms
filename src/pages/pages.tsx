import { useState } from "react";
import {
  FileTextIcon,
  PlusIcon,
  EyeIcon,
  PencilIcon,
  ArrowLeftIcon,
  Trash2Icon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageBuilder, type Block } from "@/components/builder/page-builder";

interface PageRecord {
  id: string;
  title: string;
  slug: string;
  status: "published" | "draft";
  updatedAt: string;
  blocks: Block[];
}

const initialPages: PageRecord[] = [
  {
    id: "1",
    title: "Home",
    slug: "/",
    status: "published",
    updatedAt: "Just now",
    blocks: [
      {
        id: "b1",
        type: "hero",
        content: {
          title: "Build, publish, hustle.",
          subtitle: "Replace bloated legacy CMSs with speed and simplicity.",
          buttonText: "Get Started",
        },
      },
    ],
  },
  {
    id: "2",
    title: "About Us",
    slug: "/about",
    status: "draft",
    updatedAt: "2 hours ago",
    blocks: [
      {
        id: "b2",
        type: "heading",
        content: { title: "Our Mission" },
      },
      {
        id: "b3",
        type: "text",
        content: { body: "HMS is built for modern engineering and growth." },
      },
    ],
  },
];

export default function Pages() {
  const [pagesList, setPagesList] = useState<PageRecord[]>(initialPages);
  const [editingPage, setEditingPage] = useState<PageRecord | null>(null);

  const handleCreateNew = () => {
    const newPage: PageRecord = {
      id: String(Date.now()),
      title: "Untitled Page",
      slug: `/page-${pagesList.length + 1}`,
      status: "draft",
      updatedAt: "Just now",
      blocks: [],
    };
    setEditingPage(newPage);
  };

  const handleSavePage = (title: string, blocks: Block[]) => {
    if (!editingPage) return;
    const updated: PageRecord = {
      ...editingPage,
      title,
      blocks,
      updatedAt: "Just now",
    };
    setPagesList((prev) => {
      const exists = prev.some((p) => p.id === updated.id);
      return exists ? prev.map((p) => (p.id === updated.id ? updated : p)) : [updated, ...prev];
    });
  };

  const handleDeletePage = (id: string) => {
    setPagesList((prev) => prev.filter((p) => p.id !== id));
    if (editingPage?.id === id) setEditingPage(null);
  };

  if (editingPage) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setEditingPage(null)}
            className="gap-1 text-xs"
          >
            <ArrowLeftIcon className="size-3.5" /> Back to Pages
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDeletePage(editingPage.id)}
            className="gap-1 text-xs text-destructive hover:text-destructive"
          >
            <Trash2Icon className="size-3.5" /> Delete Page
          </Button>
        </div>

        <PageBuilder
          initialTitle={editingPage.title}
          initialBlocks={editingPage.blocks}
          onSave={handleSavePage}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Pages</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Create, edit, and publish pages in real time.
          </p>
        </div>
        <Button size="sm" onClick={handleCreateNew} className="gap-1.5">
          <PlusIcon className="size-3.5" />
          New Page
        </Button>
      </div>

      <div className="rounded-xl border bg-card overflow-hidden">
        {pagesList.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
            <div className="flex size-12 items-center justify-center rounded-xl border bg-muted">
              <FileTextIcon className="size-5 text-muted-foreground" />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium">No pages yet</span>
              <span className="text-xs text-muted-foreground">
                Create your first page to get started.
              </span>
            </div>
            <Button size="sm" onClick={handleCreateNew} className="gap-1.5">
              <PlusIcon className="size-3.5" />
              New Page
            </Button>
          </div>
        ) : (
          <div className="flex flex-col divide-y">
            {pagesList.map((page) => (
              <div
                key={page.id}
                className="flex items-center justify-between px-4 py-3 hover:bg-muted/40 transition-colors"
              >
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{page.title}</span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        page.status === "published"
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {page.status}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground font-mono">{page.slug}</span>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setEditingPage(page)}
                    title="Edit in Builder"
                  >
                    <PencilIcon className="size-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setEditingPage(page)}
                    title="Preview"
                  >
                    <EyeIcon className="size-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => handleDeletePage(page.id)}
                    className="text-destructive hover:text-destructive"
                    title="Delete"
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
