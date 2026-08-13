import { createBrowserRouter } from "react-router-dom";
import Shell from "@/layout/shell";
import Home from "@/pages/home";
import Pages from "@/pages/pages";
import Blog from "@/pages/blog";
import Products from "@/pages/products";
import Media from "@/pages/media";
import Settings from "@/pages/settings";
import SignInPage from "@/pages/sign-in";

const router = createBrowserRouter([
  {
    path: "/sign-in/*",
    element: <SignInPage />,
  },
  {
    element: <Shell />,
    children: [
      { path: "/", element: <Home /> },
      { path: "/pages", element: <Pages /> },
      { path: "/blog", element: <Blog /> },
      { path: "/products", element: <Products /> },
      { path: "/media", element: <Media /> },
      { path: "/settings", element: <Settings /> },
    ],
  },
]);

export default router;
