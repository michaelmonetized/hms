# Changelog

## Unreleased

### Public site is the product

- Visitors land on the live site at `/`, `/blog`, `/blog/:slug`, `/shop`, `/shop/:slug`, and `/:slug`.
- Workspace management moved under `/manage/*` (pages, blog, products, media, settings).
- Old workspace paths redirect into `/manage`.
- Signed-in users can open `?edit=1` and edit the page in place. The site is the editor.

### Page builder

- Block model covers hero, CTA, features, columns, stats, testimonials, FAQ, pricing, logos, collections, media, and basic text blocks.
- Live editor with block renderer and inspector for on-canvas editing.
- Collection blocks pull pages, posts, products, or media into grid, table, carousel, gallery, or list layouts.

### Data layer

- Local store with seed data for offline/dev work; Convex when Clerk + Convex are configured.
- Shared `useHMS` data provider wires pages, posts, products, media, revisions, and variants.
- Site `getOrCreate` seeds a draft home page on first run.
- Published-only queries for visitor-facing pages, posts, and products.
- Slug uniqueness enforced on create.
- Content updates can snapshot revisions (opt-out with `snapshot: false`).
- Structured site settings schema (SEO, commerce, integrations).

### Backend

- Auth helper `requireIdentity` on protected Convex mutations and queries.
- Revisions module: list, recent, restore.
- Variants module for split tests (public list for assignment).
- Resend email action (`convex/email.ts`).
- Media upload URL generation + recording.
- User `ensure` mutation keeps the Convex user row in sync with Clerk.

### App shell

- Route guard for `/manage/*`.
- Env flags centralized in `src/lib/env.ts`.
- New menu: Page, Post, Product, Upload.
- Toasts wired through providers.

### Tooling

- `vp test run` script added.
- Content and store unit tests.
- Ignore `convex/_generated` in formatter config.
