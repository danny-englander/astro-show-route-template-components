import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { toRelativePath, toRepoPath } from "../src/paths.js";

describe("toRepoPath", () => {
  it("returns a path from srcDir onward using the last /srcDir/ marker", () => {
    assert.equal(
      toRepoPath("/Users/me/project/src/pages/blog/[slug].astro", "src"),
      "src/pages/blog/[slug].astro",
    );
  });

  it("normalizes Windows-style separators", () => {
    assert.equal(
      toRepoPath("C:\\Users\\me\\project\\src\\pages\\index.astro", "src"),
      "src/pages/index.astro",
    );
  });

  it("falls back to srcDir/ when no /srcDir/ marker exists", () => {
    assert.equal(
      toRepoPath("project/src/pages/index.astro", "src"),
      "src/pages/index.astro",
    );
  });

  it("returns the normalized path when srcDir is not found", () => {
    assert.equal(
      toRepoPath("/absolute/pages/index.astro", "src"),
      "/absolute/pages/index.astro",
    );
  });

  it("supports a custom srcDir", () => {
    assert.equal(
      toRepoPath("/app/packages/web/app/routes/home.astro", "app"),
      "app/routes/home.astro",
    );
  });
});

describe("toRelativePath", () => {
  it("shortens a path using the first matching marker", () => {
    assert.equal(
      toRelativePath(
        "/Users/me/project/src/components/Footer.astro",
        ["/src/", "/node_modules/"],
      ),
      "src/components/Footer.astro",
    );
  });

  it("uses later markers when earlier ones do not match", () => {
    assert.equal(
      toRelativePath(
        "/Users/me/project/node_modules/astro/dist/runtime.js",
        ["/src/", "/node_modules/"],
      ),
      "node_modules/astro/dist/runtime.js",
    );
  });

  it("returns the original path when no marker matches", () => {
    assert.equal(
      toRelativePath("Footer.astro", ["/src/", "/node_modules/"]),
      "Footer.astro",
    );
  });
});
