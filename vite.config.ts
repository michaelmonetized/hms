import { defineConfig, lazyPlugins } from "vite-plus";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  fmt: {
    ignorePatterns: ["convex/_generated/**"],
  },
  lint: {
    plugins: ["react", "typescript", "oxc"],
    rules: {
      "react/rules-of-hooks": "error",
      "react/only-export-components": [
        "warn",
        {
          allowConstantExport: true,
          allowExportNames: [
            "useHMS",
            "useEditDoc",
            "useCollectionData",
            "useDebouncedBlocks",
            "useDynamicContext",
            "useSetDynamicDocument",
            "useEditorRender",
            "useDocumentBody",
            "useCart",
          ],
        },
      ],
      "vite-plus/prefer-vite-plus-imports": "error",
    },
    options: {
      typeAware: true,
      typeCheck: true,
    },
    jsPlugins: [
      {
        name: "vite-plus",
        specifier: "vite-plus/oxlint-plugin",
      },
    ],
  },
  plugins: [lazyPlugins(() => [react()]), tailwindcss()],
  resolve: {
    tsconfigPaths: true,
  },
});
