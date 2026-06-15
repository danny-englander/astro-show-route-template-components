# Astro Show Route, Components, and Templates

Dev-only Astro integration that injects HTML comments showing **which route and template own each page** and **which `.astro` component produced each node**.

## Why

Two complementary debugging layers:

1. **Route & templates** — one comment per page after `<html>`, visible in View Source:
   ```html
   <!-- ASTRO | Route: /blog/foo | Template: src/pages/blog/[slug].astro -->
   ```

2. **Components** — a comment above each rendered node, visible in the Elements panel:
   ```html
   <!-- astro-source: src/components/Footer.astro 12:4 -->
   <footer>...</footer>
   ```

Component comments persist after the Audit dev toolbar strips `data-astro-source-*` attributes. DOM nodes stay uncluttered.

## Requirements

- Astro 4+
- Dev toolbar enabled for component comments (source attributes are only emitted when the dev toolbar is active)

## Install

```bash
npm install -D astro-show-route-components-templates
```

## Usage

```js
// astro.config.mjs
import { defineConfig } from "astro/config";
import showRouteComponentsTemplates from "astro-show-route-components-templates";

export default defineConfig({
  integrations: [showRouteComponentsTemplates()],
});
```

Both route and component comments are enabled by default. No layout changes required.

## Options

```js
showRouteComponentsTemplates({
  enabled: true,
  routes: true,
  components: true,
  routePrefix: "ASTRO",
  componentPrefix: "astro-source",
  srcDir: "src",
  includeLoc: true,
  pathMarkers: ["/src/", "/node_modules/"],
});
```

| Option | Default | Description |
|--------|---------|-------------|
| `enabled` | `true` | Turn off without removing the integration |
| `routes` | `true` | Inject route/template comment after `<html>` |
| `components` | `true` | Inject per-component source comments |
| `routePrefix` | `"ASTRO"` | Prefix in route comments. `prefix` is an alias. |
| `componentPrefix` | `"astro-source"` | Prefix in component comments |
| `srcDir` | `"src"` | Root folder for repo-relative route paths |
| `includeLoc` | `true` | Append `line:col` to component comments |
| `pathMarkers` | `["/src/", "/node_modules/"]` | Markers used to shorten component file paths |

Disable one layer if you only need the other:

```js
showRouteComponentsTemplates({ components: false }); // route comments only
showRouteComponentsTemplates({ routes: false });     // component comments only
```

## Local development

```json
{
  "devDependencies": {
    "astro-show-route-components-templates": "file:./astro-show-route-components-templates"
  }
}
```

## License

MIT
