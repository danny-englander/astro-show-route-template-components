# Astro Show Route and Template Information

A tiny **dev-only** Astro integration that answers a question you hit constantly when working on an unfamiliar Astro site:

> *"Which `.astro` file actually rendered this route?"*

When `astro dev` is running, it injects a single HTML comment into every page's server-rendered output, right after the opening `<html>` tag:

```html
<html lang="en"><!-- ASTRO | Route: /blog/hello-world | Template: src/pages/blog/[slug].astro -->
```

Open **View Page Source** in the browser and search for `ASTRO |`. Dynamic routes resolve to the real template (`[slug].astro`) while the comment still shows the concrete request path.

There are **zero per-file edits** — you add the integration once and every route is covered.

## Install

```bash
npm install -D astro-show-route-templates
```

```js
// astro.config.mjs
import { defineConfig } from "astro/config";
import templateDebug from "astro-show-route-templates";

export default defineConfig({
  integrations: [templateDebug()],
});
```

Run `npm run dev`, load any route, and View Source.

## Options

```js
templateDebug({
  prefix: "ASTRO", // text prefix in the comment: "ASTRO | Route: ..."
  srcDir: "src",   // folder treated as the root of the repo-relative path
});
```

## How it works

It never rewrites your `.astro` source, so it can't fight Astro's compiler:

1. **`astro:routes:resolved`** — builds a map of `{ routePattern: templateFile }` from the resolved route table.
2. **A Vite virtual module** (`virtual:astro-show-route-templates`) exposes that map to the middleware.
3. **Request-time middleware** — looks up `context.routePattern`, and splices a single-line comment into the HTML response after the opening `<html>` tag.

Because registration happens only when `command === "dev"`, the middleware doesn't exist in a production build, and comments never ship to visitors.

## Why single-line comments

An earlier prototype injected a multi-line comment directly into component
frontmatter. A **multi-line** HTML comment placed inside a compiled Astro
template expression triggers `Parse failure: Expression expected` from the
compiler. The response-rewrite approach sidesteps that entirely, and the comment
is kept single-line so it stays predictable for a `View Source` search.

## Relationship to Astro's built-in `data-astro-source-file`

Recent Astro versions already add `data-astro-source-file` / `data-astro-source-loc`
attributes to rendered elements in dev mode. That is excellent for the Elements
panel, but it tags *individual elements*, not page boundaries, and it doesn't
tell you which **page template** owns a route at a glance. This integration is
complementary: one clean comment per document keyed to the route.

## Limitations

- **Dev only.** Nothing is emitted in `astro build` output. By design.
- **HTML responses only.** JSON/other endpoints are skipped (checked via `content-type`).
- **Page level only.** This marks the page template that owns each route. It does
  not mark individual shared components (`Header.astro`, etc.). Component-level
  marking would require per-component opt-in; see the project notes.
- **Route pattern join.** Matching is by `context.routePattern`. Custom routing
  set up by other integrations that don't populate a resolved route entrypoint
  won't be mapped.
- **View transitions.** With `ClientRouter`, client-side navigation swaps the
  document without a full reload. Hard-refresh or open the URL directly to
  verify a specific route's comment.

## License

MIT
