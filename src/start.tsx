import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { HMSProvider } from "@/lib/providers";
import router from "@/routes";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <HMSProvider>
      <RouterProvider router={router} />
    </HMSProvider>
  </StrictMode>,
);
