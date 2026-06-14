/**
 * astro-show-route-templates
 *
 * A dev-only Astro integration that injects an HTML comment into every
 * server-rendered page so you can answer "which .astro file owns this route?"
 * using View Page Source in the browser.
 *
 * Mechanism (compiler-safe):
 *   1. astro:routes:resolved -> build a { routePattern: entrypoint } map.
 *   2. A Vite virtual module ("virtual:astro-show-route-templates") exposes that map
 *      plus the configured prefix to the middleware.
 *   3. addMiddleware -> at request time, look up context.routePattern and
 *      splice a single-line comment after the opening <html ...> tag.
 *
 * Nothing here rewrites .astro source, so it never fights Astro's own
 * compiler or its cached compile metadata. Active only under `astro dev`.
 */

/**
 * @typedef {Object} TemplateDebugOptions
 * @property {string} [prefix="ASTRO"] Text prefix used in the comment.
 * @property {string} [srcDir="src"]   Folder used as the root of the stable repo-relative path.
 */

const VIRTUAL_ID = "virtual:astro-show-route-templates";
const RESOLVED_VIRTUAL_ID = "\0" + VIRTUAL_ID;

/**
 * Normalize an entrypoint to a stable repo-relative path beginning at srcDir.
 * @param {string} entrypoint
 * @param {string} srcDir
 * @returns {string}
 */
function toRepoPath(entrypoint, srcDir) {
  const normalized = String(entrypoint).split("\\").join("/");
  const marker = `/${srcDir}/`;
  const at = normalized.lastIndexOf(marker);
  if (at !== -1) return normalized.slice(at + 1);
  const idx = normalized.indexOf(`${srcDir}/`);
  return idx !== -1 ? normalized.slice(idx) : normalized;
}

/**
 * @param {TemplateDebugOptions} [userOptions]
 * @returns {import("astro").AstroIntegration}
 */
export default function templateDebug(userOptions = {}) {
  const options = { prefix: "ASTRO", srcDir: "src", ...userOptions };

  let isDev = false;
  /** @type {Record<string, string>} */
  let routeMap = {};

  // Shared Vite plugin closure so the virtual module always reflects the
  // latest routeMap (routes:resolved runs after config:setup).
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
        `export const prefix = ${JSON.stringify(options.prefix)};\n`
      );
    },
  };

  return {
    name: "astro-show-route-templates",
    hooks: {
      "astro:config:setup": ({ command, addMiddleware, updateConfig, logger }) => {
        isDev = command === "dev";
        if (!isDev) {
          logger.info("Skipped (only active in `astro dev`).");
          return;
        }

        updateConfig({ vite: { plugins: [virtualPlugin] } });

        addMiddleware({
          order: "pre",
          entrypoint: new URL("./middleware.js", import.meta.url),
        });

        logger.info("Injecting page-template comments (dev only).");
      },

      "astro:routes:resolved": ({ routes }) => {
        if (!isDev) return;
        routeMap = {};
        for (const route of routes) {
          if (!route.entrypoint) continue;
          routeMap[route.pattern] = toRepoPath(route.entrypoint, options.srcDir);
        }
      },
    },
  };
}
