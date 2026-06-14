# astro-show-route-templates

Dev-only Astro integration that injects HTML comments showing **which route template owns each page** and **which `.astro` file produced each element**.

## Why

Two complementary debugging layers:

1. **Route** — one comment per page after `<html>`, visible in View Source:
   ```html
   <!-- ASTRO | Route: /blog/foo | Template: src/pages/blog/[slug].astro -->
   ```

2. **Elements** — a comment above each rendered node, visible in the Elements panel:
   ```html
   <!-- astro-source: src/components/Footer.astro 12:4 -->
   <footer>...</footer>
   ```

Element comments persist after the Audit dev toolbar strips `data-astro-source-*` attributes. Elements stay uncluttered.

## Requirements

- Astro 4+
- Dev toolbar enabled for element comments (source attributes are only emitted when the dev toolbar is active)

## Install

```bash
npm install -D astro-show-route-templates
```

## Usage

```js
// astro.config.mjs
import { defineConfig } from "astro/config";
import showRouteTemplates from "astro-show-route-templates";

export default defineConfig({
  integrations: [showRouteTemplates()],
});
```

Both route and element comments are enabled by default. No layout changes required.

## Options

```js
showRouteTemplates({
  enabled: true,
  routes: true,
  elements: true,
  routePrefix: "ASTRO",
  elementPrefix: "astro-source",
  srcDir: "src",
  includeLoc: true,
  pathMarkers: ["/src/", "/node_modules/"],
});
```

| Option | Default | Description |
|--------|---------|-------------|
| `enabled` | `true` | Turn off without removing the integration |
| `routes` | `true` | Inject route/template comment after `<html>` |
| `elements` | `true` | Inject per-element source comments |
| `routePrefix` | `"ASTRO"` | Prefix in route comments. `prefix` is an alias. |
| `elementPrefix` | `"astro-source"` | Prefix in element comments |
| `srcDir` | `"src"` | Root folder for repo-relative route paths |
| `includeLoc` | `true` | Append `line:col` to element comments |
| `pathMarkers` | `["/src/", "/node_modules/"]` | Markers used to shorten element file paths |

Disable one layer if you only need the other:

```js
showRouteTemplates({ elements: false }); // route comments only
showRouteTemplates({ routes: false });   // element comments only
```

## Local development

```json
{
  "devDependencies": {
    "astro-show-route-templates": "file:./astro-show-route-templates"
  }
}
```

## License

MIT
