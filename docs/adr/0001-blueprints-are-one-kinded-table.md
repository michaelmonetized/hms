# 0001. Blueprints are one kinded table

Forms, components, loop items, and templates are the same record shape: a name, a kind, and a block tree. The live editor is the only builder; kind only changes the catalog and the preview context.

**Status**: accepted

## Context

The next builders (form, component, loop item / grid, content-type template, blog template) could each have been a table and a bespoke editor. That would fork the canvas, inspector, and history we just built.

## Decision

Store them as **blueprints** with a `kind`. Templates also carry `appliesTo` and an optional `contentTypeId`. Pages and posts stay first-class documents; blueprints are the reusable trees those documents reference.

## Consequences

Adding a new builder is a catalog plus a kind, not a new editor. Listing and permissions stay one code path. The cost is that a form and a page template share a schema, so kind-specific fields stay optional.
