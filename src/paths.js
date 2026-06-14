/**
 * Normalize an entrypoint to a stable repo-relative path beginning at srcDir.
 * @param {string} entrypoint
 * @param {string} srcDir
 * @returns {string}
 */
export function toRepoPath(entrypoint, srcDir) {
  const normalized = String(entrypoint).split("\\").join("/");
  const marker = `/${srcDir}/`;
  const at = normalized.lastIndexOf(marker);
  if (at !== -1) return normalized.slice(at + 1);
  const idx = normalized.indexOf(`${srcDir}/`);
  return idx !== -1 ? normalized.slice(idx) : normalized;
}

/**
 * Shorten an absolute file path using known repo markers.
 * @param {string} file
 * @param {string[]} pathMarkers
 * @returns {string}
 */
export function toRelativePath(file, pathMarkers) {
  for (const marker of pathMarkers) {
    const index = file.indexOf(marker);
    if (index >= 0) return file.slice(index + 1);
  }
  return file;
}
