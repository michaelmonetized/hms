import { Link, useLocation, useNavigate } from "react-router-dom";
import { UserButton } from "@clerk/react";
import { PlusIcon, UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useHMS } from "@/hooks/use-hms";
import { hasClerk } from "@/lib/env";
import { managePath, publicPath } from "@/lib/content";
import { toast } from "@/components/ui/lib";

export function AdminToolbar({
  editing,
  onToggleEdit,
  canEdit,
  onPublish,
  published,
}: {
  editing: boolean;
  onToggleEdit: () => void;
  canEdit: boolean;
  onPublish?: () => void;
  published?: boolean;
}) {
  const hms = useHMS();
  const navigate = useNavigate();
  const location = useLocation();

  const createPage = async () => {
    const slug = `page-${Date.now()}`;
    await hms.createPage({ title: "Untitled page", slug });
    toast.add({ title: "Draft page created", type: "success" });
    void navigate(`${publicPath("page", slug)}?edit=1`);
  };

  const createPost = async () => {
    const slug = `post-${Date.now()}`;
    await hms.createPost({ title: "Untitled post", slug });
    toast.add({ title: "Draft post created", type: "success" });
    void navigate(`${publicPath("post", slug)}?edit=1`);
  };

  return (
    <div className="fixed inset-x-0 top-0 z-50 flex h-12 items-center justify-between gap-3 border-b border-white/10 bg-zinc-950 px-4 text-white">
      <div className="flex min-w-0 items-center gap-4">
        <Link to="/" className="truncate text-sm font-semibold tracking-tight">
          {hms.site?.name ?? "HMS"}
        </Link>
        <span className="hidden text-xs text-white/50 sm:inline">
          {location.pathname === "/" ? "Home" : location.pathname}
        </span>
      </div>

      <div className="flex items-center gap-2">
        {canEdit && (
          <Button
            size="sm"
            variant={editing ? "secondary" : "default"}
            onClick={onToggleEdit}
            className={editing ? "" : "bg-white text-zinc-950 hover:bg-white/90"}
          >
            {editing ? "Done" : "Edit"}
          </Button>
        )}
        {canEdit && onPublish && (
          <Button
            size="sm"
            variant="ghost"
            className="text-white hover:bg-white/10"
            onClick={onPublish}
          >
            {published ? "Unpublish" : "Publish"}
          </Button>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button size="sm" variant="ghost" className="gap-1.5 text-white hover:bg-white/10">
                Library
              </Button>
            }
          />
          <DropdownMenuContent align="end">
            <DropdownMenuItem render={<Link to={managePath("page")} />}>Pages</DropdownMenuItem>
            <DropdownMenuItem render={<Link to={managePath("post")} />}>Blog</DropdownMenuItem>
            <DropdownMenuItem render={<Link to={managePath("product")} />}>
              Products
            </DropdownMenuItem>
            <DropdownMenuItem render={<Link to={managePath("media")} />}>Media</DropdownMenuItem>
            <DropdownMenuItem render={<Link to={managePath("settings")} />}>
              Settings
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button size="sm" variant="ghost" className="gap-1.5 text-white hover:bg-white/10">
                <PlusIcon className="size-3.5" /> New
              </Button>
            }
          />
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => void createPage()}>Page</DropdownMenuItem>
            <DropdownMenuItem onClick={() => void createPost()}>Post</DropdownMenuItem>
            <DropdownMenuItem render={<Link to={`${managePath("product")}?new=1`} />}>
              Product
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {hasClerk ? (
          <UserButton />
        ) : (
          <div className="flex size-7 items-center justify-center rounded-full bg-white/10">
            <UserIcon className="size-3.5" />
          </div>
        )}
      </div>
    </div>
  );
}
