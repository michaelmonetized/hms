import { Outlet, NavLink, useLocation, Link } from "react-router-dom";
import { RedirectToSignIn, UserButton } from "@clerk/react";
import { useHMSAuth } from "@/hooks/use-hms-auth";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  LayoutPanelTopIcon,
  FileTextIcon,
  RssIcon,
  PackageIcon,
  ImageIcon,
  SettingsIcon,
  GlobeIcon,
  PlusIcon,
  UserIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { hasClerk } from "@/lib/env";

const nav = [
  { to: "/", label: "Overview", icon: LayoutPanelTopIcon },
  { to: "/pages", label: "Pages", icon: FileTextIcon },
  { to: "/blog", label: "Blog", icon: RssIcon },
  { to: "/products", label: "Products", icon: PackageIcon },
  { to: "/media", label: "Media", icon: ImageIcon },
];

const titles: Record<string, string> = {
  "/": "Overview",
  "/pages": "Pages",
  "/blog": "Blog",
  "/products": "Products",
  "/media": "Media",
  "/settings": "Settings",
};

export default function Shell() {
  const { isLoaded, isSignedIn } = useHMSAuth();

  if (!isLoaded) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background">
        <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!isSignedIn) {
    return <RedirectToSignIn />;
  }

  return <AppShell />;
}

function AppShell() {
  const { pathname } = useLocation();

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <div className="flex items-center gap-2 px-1 py-1.5">
            <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-foreground text-background">
              <GlobeIcon className="size-4" />
            </div>
            <span className="truncate font-semibold text-sm tracking-tight">HMS</span>
          </div>
        </SidebarHeader>

        <SidebarSeparator />

        <SidebarContent>
          <SidebarMenu className="p-2">
            {nav.map(({ to, label, icon: Icon }) => (
              <SidebarMenuItem key={to}>
                <SidebarMenuButton
                  isActive={pathname === to}
                  tooltip={label}
                  render={<NavLink to={to} end={to === "/"} />}
                >
                  <Icon />
                  <span>{label}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>

        <SidebarSeparator />

        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                tooltip="Settings"
                isActive={pathname === "/settings"}
                render={<NavLink to="/settings" />}
              >
                <SettingsIcon />
                <span>Settings</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <div className="flex items-center gap-2 px-2 py-1.5">
                {hasClerk ? (
                  <UserButton />
                ) : (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <div className="flex size-6 items-center justify-center rounded-full bg-muted">
                      <UserIcon className="size-3.5" />
                    </div>
                    <span className="truncate">Dev Admin</span>
                  </div>
                )}
              </div>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        <header className="flex h-12 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <SidebarSeparator orientation="vertical" className="h-4" />
          <div className="flex flex-1 items-center justify-between">
            <span className="text-sm font-medium">{titles[pathname] ?? "HMS"}</span>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button size="sm" className="gap-1.5">
                    <PlusIcon className="size-3.5" />
                    New
                  </Button>
                }
              />
              <DropdownMenuContent align="end">
                <DropdownMenuItem render={<Link to="/pages?new=1" />}>Page</DropdownMenuItem>
                <DropdownMenuItem render={<Link to="/blog?new=1" />}>Post</DropdownMenuItem>
                <DropdownMenuItem render={<Link to="/products?new=1" />}>Product</DropdownMenuItem>
                <DropdownMenuItem render={<Link to="/media" />}>Upload</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-6 p-6">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
