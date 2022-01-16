import * as path from "path";

/**
 * Have folder path always end in a /
 *
 * @param path
 */
export function normalizePath(uri: string): string {
  if (uri) {
    uri = uri.endsWith(path.sep) ? uri : uri + path.sep;
  }
  return uri;
}
