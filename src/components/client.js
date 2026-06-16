/**
 * Dev-only client script: capture Astro source attributes and insert HTML comments.
 *
 * Injected by astro-show-route-template-components during `astro dev` only.
 * Config is set on window.__ASTRO_SHOW_ROUTE_TEMPLATE_COMPONENTS__ by the integration.
 */
(function preserveAstroSource() {
  const config = Object.assign(
    {
      pathMarkers: ["/src/", "/node_modules/"],
      prefix: "astro-source",
      includeLoc: true,
    },
    window.__ASTRO_SHOW_ROUTE_TEMPLATE_COMPONENTS__ || {},
  );

  /** @type {WeakMap<Element, { file: string; loc: string }>} */
  const cache = new WeakMap();

  /** @param {string} file @param {string} loc */
  function commentText(file, loc) {
    const prefix = config.prefix;
    if (config.includeLoc && loc) return `${prefix}: ${file} ${loc}`;
    return `${prefix}: ${file}`;
  }

  /** @param {string} file */
  function toRelativePath(file) {
    for (const marker of config.pathMarkers) {
      const index = file.indexOf(marker);
      if (index >= 0) return file.slice(index + 1);
    }
    return file;
  }

  /** @param {Element} element @param {string} file @param {string} loc */
  function insertSourceComment(element, file, loc) {
    const text = commentText(file, loc);
    const prev = element.previousSibling;
    if (prev?.nodeType === Node.COMMENT_NODE && prev.data === text) return;

    const parent = element.parentNode;
    if (!parent) return;

    parent.insertBefore(document.createComment(text), element);
  }

  /** @param {Element} element */
  function capture(element) {
    const file = element.getAttribute("data-astro-source-file");
    if (!file) return;

    const annotation = {
      file: toRelativePath(file),
      loc: element.getAttribute("data-astro-source-loc") ?? "",
    };
    cache.set(element, annotation);
    insertSourceComment(element, annotation.file, annotation.loc);
  }

  /** @param {ParentNode} root */
  function captureTree(root) {
    if (root instanceof Element) capture(root);
    root.querySelectorAll?.("[data-astro-source-file]").forEach(capture);
  }

  function insertCommentsFromCache() {
    document.querySelectorAll("*").forEach((element) => {
      const annotation = cache.get(element);
      if (!annotation) return;
      insertSourceComment(element, annotation.file, annotation.loc);
    });
  }

  function scheduleInsertComments() {
    requestAnimationFrame(insertCommentsFromCache);
  }

  new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type !== "childList") continue;

      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) captureTree(node);
      });
    }
  }).observe(document.documentElement, { childList: true, subtree: true });

  document.addEventListener("DOMContentLoaded", () => {
    captureTree(document.documentElement);
    scheduleInsertComments();
  });

  document.addEventListener("astro:after-swap", () => {
    captureTree(document.documentElement);
    scheduleInsertComments();
  });

  document.addEventListener("astro:page-load", scheduleInsertComments);
})();
