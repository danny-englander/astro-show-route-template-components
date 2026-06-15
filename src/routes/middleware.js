/**
 * Request-time middleware for route-level template comments.
 *
 * Reads the route map exposed by the virtual module, looks up the current
 * request's routePattern, and splices a single-line HTML comment in right
 * after the opening <html ...> tag.
 *
 * Single-line is deliberate: a multi-line HTML comment injected into compiled
 * Astro template expressions can crash the compiler, and keeping the response
 * rewrite single-line keeps the output predictable for View Source searches.
 */

import { defineMiddleware } from "astro:middleware";
import { routeMap, prefix } from "virtual:astro-show-route-components-templates";

const HTML_OPEN = /<html\b[^>]*>/i;

export const onRequest = defineMiddleware(async (context, next) => {
  const response = await next();

  const type = response.headers.get("content-type") || "";
  if (!type.includes("text/html")) return response;

  const template = routeMap[context.routePattern];
  if (!template) return response;

  const route = context.url.pathname;
  const comment = `<!-- ${prefix} | Route: ${route} | Template: ${template} -->`;

  const html = await response.text();
  const injected = HTML_OPEN.test(html)
    ? html.replace(HTML_OPEN, (tag) => `${tag}${comment}`)
    : `${comment}${html}`;

  const headers = new Headers(response.headers);
  headers.delete("content-length");

  return new Response(injected, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
});
