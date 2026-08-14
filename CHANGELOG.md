# Changelog

## Unreleased

### Public site is the product

- Visitors land on the live site at `/`, `/blog`, `/blog/:slug`, `/shop`, `/shop/:slug`, `/search`, `/:type/:entry`, and `/:slug`.
- Theme header and footer render from templates; missing pages use the 404 template.
- Workspace management moved under `/manage/*` (pages, blog, products, media, library, types, settings).
- Old workspace paths redirect into `/manage`.
- Signed-in users can open `?edit=1` and edit the page in place. The site is the editor.

### Page builder

- Block model covers hero, CTA, features, columns, stats, testimonials, FAQ, pricing, logos, collections, media, and basic text blocks.
- Live editor with block renderer and inspector for on-canvas editing.
- Collection blocks pull pages, posts, products, or media into grid, table, carousel, gallery, or list layouts.
- Three-panel editor: structure navigator, device-framed canvas, Content / Style / Advanced / Dynamic inspector.
- Undo/redo, keyboard shortcuts, right-click menu, copy/paste of blocks and styles, wrap in section or columns.
- Finder (⌘K) to add widgets, jump to structure, apply templates, and run commands.
- Dynamic tokens (`{{site.name}}`, `{{doc.title}}`, `{{user.name}}`, `{{query.*}}`, …) and visibility conditions (logged in, query, device).
- Responsive canvas (desktop / tablet / mobile), outlines, inline copy editing, saved sections, starter layouts.
- Section, HTML, and form widgets; FAQ renders as an accordion.
- Forms are containers of field blocks; submissions persist.
- Library of blueprints: forms, components, loop items, and templates — all edited in the live editor.
- Collections can paint each row with a loop item (the grid builder).
- Content types with fields, entries, and archive/single templates.
- Blog archive and single templates; document-body slot for the post itself.
- Visibility groups (AND/OR) with field, schedule, role, referrer, cookie, and fallback copy.
- Token modifiers (`|upper`, `|truncate`, `|fallback`, `|date`) and type-aware field chips.
- Collection query: filter, sort, search, related, exclude current, paginate, facet, load more, empty state.
- Form actions: email notice, create entry, redirect; conditional fields.
- Content fields: relation, repeater, and terms, with tokens `{{rel.*}}` and collection source `repeater:key`.
- Theme templates: header, footer, 404, search, shop archive, and product single.
- Menu, search, add-to-cart, and cart blocks; cart tokens `{{cart.count}}` and `{{cart.total}}`.
- Visibility debug in the editor (why a block is hidden).

### Data layer

- Local store with seed data for offline/dev work; Convex when Clerk + Convex are configured.
- Shared `useHMS` data provider wires pages, posts, products, media, revisions, variants, blueprints, content types, entries, and submissions.
- Cart lines persist in localStorage.
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
- Library and content-type editors under `/manage/library` and `/manage/types`.
- Reserved public paths: `/search` plus blog and shop.
- Toasts wired through providers.

### Tooling

- `vp test run` script added.
- Content and store unit tests.
- Ignore `convex/_generated` in formatter config.
