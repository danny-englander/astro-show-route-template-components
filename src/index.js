/**
 * astro-show-route-templates
 *
 * Dev-only Astro integration that injects HTML comments for source debugging:
 *
 *   Routes (SSR middleware):
 *     <!-- ASTRO | Route: /blog/foo | Template: src/pages/blog/[slug].astro -->
 *
 *   Elements (client script):
 *     <!-- astro-source: src/components/Footer.astro 12:4 -->
 *     <footer>...</footer>
 *
 * Route comments answer "which page template owns this URL?" via View Source.
 * Element comments answer "which .astro file produced this node?" in DevTools,
 * persisting after the Audit dev toolbar strips data-astro-source-* attributes.
 *
 * Active only under `astro dev`. Nothing is injected on build or preview.
 */

import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { toRepoPath } from "./paths.js";

const VIRTUAL_ID = "virtual:astro-show-route-templates";
const RESOLVED_VIRTUAL_ID = "\0" + VIRTUAL_ID;

/**
 * @typedef {Object} ShowRouteTemplatesOptions
 * @property {boolean} [enabled=true] Whether the integration is active in dev.
 * @property {boolean} [routes=true] Inject a route/template comment after `<html>`.
 * @property {boolean} [elements=true] Inject element source comments via client script.
 * @property {string} [prefix="ASTRO"] Route comment prefix. Alias: same as routePrefix.
 * @property {string} [routePrefix="ASTRO"] Route comment prefix.
 * @property {string} [elementPrefix="astro-source"] Element comment prefix.
 * @property {string} [srcDir="src"] Folder used as the root of repo-relative route paths.
 * @property {boolean} [includeLoc=true] Append line:col to element comments.
 * @property {string[]} [pathMarkers=["/src/", "/node_modules/"]] Markers used to shorten element file paths.
 */

/**
 * @param {ShowRouteTemplatesOptions} [userOptions]
 * @returns {import("astro").AstroIntegration}
 */
export default function showRouteTemplates(userOptions = {}) {
  const options = {
    enabled: true,
    routes: true,
    elements: true,
    routePrefix: userOptions.prefix ?? userOptions.routePrefix ?? "ASTRO",
    elementPrefix: "astro-source",
    srcDir: "src",
    includeLoc: true,
    pathMarkers: ["/src/", "/node_modules/"],
    ...userOptions,
  };

  let isDev = false;
  /** @type {Record<string, string>} */
  let routeMap = {};

  const virtualPlugin = {
    name: "astro-show-route-templates:virtual",
    resolveId(id) {
      if (id === VIRTUAL_ID) return RESOLVED_VIRTUAL_ID;
      return null;
    },
    load(id) {
      if (id !== RESOLVED_VIRTUAL_ID) return null;
      return (
        `export const routeMap = ${JSON.stringify(routeMap)};\n` +
        `export const prefix = ${JSON.stringify(options.routePrefix)};\n`
      );
    },
  };

  return {
    name: "astro-show-route-templates",
    hooks: {
      "astro:config:setup": ({
        command,
        addMiddleware,
        injectScript,
        updateConfig,
        logger,
      }) => {
        isDev = command === "dev";
        if (!isDev) {
          logger.info("Skipped (only active in `astro dev`).");
          return;
        }
        if (!options.enabled) {
          logger.info("Disabled via options.");
          return;
        }

        if (options.routes) {
          updateConfig({ vite: { plugins: [virtualPlugin] } });

          addMiddleware({
            order: "pre",
            entrypoint: new URL("./routes/middleware.js", import.meta.url),
          });

          logger.info("Injecting route/template comments (dev only).");
        }

        if (options.elements) {
          const clientPath = fileURLToPath(
            new URL("./elements/client.js", import.meta.url),
          );
          const clientScript = fs.readFileSync(clientPath, "utf8");
          const config = JSON.stringify({
            pathMarkers: options.pathMarkers,
            prefix: options.elementPrefix,
            includeLoc: options.includeLoc,
          });

          injectScript(
            "head-inline",
            `window.__ASTRO_SHOW_ROUTE_TEMPLATES__=${config};${clientScript}`,
          );

          logger.info("Injecting element source comments (dev only).");
        }
      },

      "astro:routes:resolved": ({ routes }) => {
        if (!isDev || !options.enabled || !options.routes) return;

        routeMap = {};
        for (const route of routes) {
          if (!route.entrypoint) continue;
          routeMap[route.pattern] = toRepoPath(route.entrypoint, options.srcDir);
        }
      },
    },
  };
}
