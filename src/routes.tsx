import { createBrowserRouter, Navigate } from "react-router-dom";
import { SiteFrame } from "@/components/site/frame";
import { RequireAuth } from "@/layout/require-auth";
import Pages from "@/pages/pages";
import Blog from "@/pages/blog";
import Products from "@/pages/products";
import Media from "@/pages/media";
import Settings from "@/pages/settings";
import SignInPage from "@/pages/sign-in";
import { SiteBlogIndex, SitePage, SitePost, SiteProduct, SiteShop } from "@/pages/site";

const router = createBrowserRouter([
  {
    path: "/sign-in/*",
    element: <SignInPage />,
  },
  {
    element: <SiteFrame />,
    children: [
      { path: "/", element: <SitePage /> },
      { path: "/blog", element: <SiteBlogIndex /> },
      { path: "/blog/:slug", element: <SitePost /> },
      { path: "/shop", element: <SiteShop /> },
      { path: "/shop/:slug", element: <SiteProduct /> },
      {
        element: <RequireAuth />,
        children: [
          { path: "/manage/pages", element: <Pages /> },
          { path: "/manage/blog", element: <Blog /> },
          { path: "/manage/products", element: <Products /> },
          { path: "/manage/media", element: <Media /> },
          { path: "/manage/settings", element: <Settings /> },
        ],
      },
      { path: "/view", element: <Navigate to="/" replace /> },
      { path: "/view/*", element: <Navigate to="/" replace /> },
      { path: "/pages", element: <Navigate to="/manage/pages" replace /> },
      { path: "/settings", element: <Navigate to="/manage/settings" replace /> },
      { path: "/media", element: <Navigate to="/manage/media" replace /> },
      { path: "/products", element: <Navigate to="/manage/products" replace /> },
      { path: "/:slug", element: <SitePage /> },
    ],
  },
]);

export default router;
