# HMS

Hustle Management System is the live site and the editor for that site. Pages, posts, products, forms, and templates are all block trees.

## Language

**Block**:
A node in the page tree: a widget, a field, or a container.
_Avoid_: widget, element, module

**Blueprint**:
A named, reusable block tree. One record, distinguished by kind.
_Avoid_: template file, global widget, saved section, shortcode

**Component**:
A blueprint dropped onto a page as a single block.
_Avoid_: global widget, symbol, nestable

**Form**:
A blueprint whose children are fields. Visitors submit it.
_Avoid_: contact block, gravity form

**Field**:
A labeled input inside a form, or a named slot on a content type.
_Avoid_: meta, ACF field, custom field (use **content field** when it lives on a type)

**Loop item**:
A blueprint that paints one record inside a collection or grid.
_Avoid_: card template, repeater row, post skin

**Collection**:
A block that lists records (pages, posts, products, media, or a content type) and optionally paints each with a loop item.
_Avoid_: query loop, archive widget, grid builder (the grid is a collection layout)

**Template**:
A blueprint that paints a whole document, archive, or theme surface: blog, shop, header, footer, 404, or search.
_Avoid_: theme file, PHP template, layout

**Document content**:
A block that yields the current document’s own blocks (the post body, the entry body).
_Avoid_: the_content, inner blocks, post content widget

**Content type**:
A named schema of content fields. Blog posts and products are built-in; others are created.
_Avoid_: CPT, post type, collection type, model

**Entry**:
One record of a content type.
_Avoid_: post (reserved for blog), document (reserved for the thing on screen), item (reserved for a loop row)

**Applies to**:
Which surface a template paints: a page, a blog single, a blog archive, an entry single, or an entry archive.

**Visibility group**:
A set of display conditions combined with AND or OR. A hidden block may show fallback copy.
_Avoid_: display condition (too vague), PHP condition

**Token modifier**:
A pipe on a token that transforms the resolved value (`upper`, `truncate`, `fallback`, `date`).
_Avoid_: filter (conflicts with collection filter)

**Collection query**:
Filter, sort, search, relate, exclude-current, and paginate a collection.
_Avoid_: WP_Query

**Form action**:
What happens after a submit besides storing it: email, create an entry, or redirect.

**Relation**:
A content field that points at one or more entries of a type.

**Repeater**:
A content field that is a list of row maps, painted with a collection source `repeater:key`.

**Terms**:
A content field of tags used as collection facets.
_Avoid_: taxonomy, category, custom taxonomy

**Cart**:
A visitor’s local list of product lines. Tokens `{{cart.count}}` and `{{cart.total}}`.
_Avoid_: WooCommerce cart, session cart
