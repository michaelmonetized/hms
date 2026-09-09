# HMS (Hustle Management System)

Live: [hms-cyan-six.vercel.app](https://hms-cyan-six.vercel.app)

It replaces WordPress + Elementor + Dynamic.ooo + WooCommerce with a Vite+ SPA. The public site is the editor. Pages, posts, products, and templates are block trees stored as JSON.

Add a page, change a section, visitors see it when you publish. Revisions and split-test variants sit in Convex.

This is not TanStack Start. `src/start.tsx` mounts `react-router-dom`. There is no Zustand package. Stripe is a settings field and a disabled checkout button until a key is saved — not a working Stripe SDK integration. Resend is a Convex action that fires when `RESEND_API_KEY` is set on the deployment.

## Stack (what HEAD actually installs)

- Vite+ (`vp`) + pnpm. Ignore any leftover `package-lock.json`; `packageManager` is `pnpm@11.21.0`.
- React 19, React Router, Tailwind, shadcn/ui, Base UI.
- Convex for data. Clerk for auth.
- Zod schemas shared with Convex.
- Resend via `convex/email.ts` (env required).
- Stripe key stored on site settings. Checkout is not wired to Stripe.js.

## Run

```bash
vp install
vp dev
```

Clerk + Convex env are required for the live editor and `/manage`. Without them the local store still paints the public site.

## Do not claim

- TanStack Start
- Zustand
- Stripe checkouts that always complete
- npm as the package manager
