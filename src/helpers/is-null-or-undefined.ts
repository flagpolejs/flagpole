/**
 * Is this object null or undefined?
 *
 * @param obj
 * @returns {boolean}
 */
export const isNullOrUndefined = (obj: unknown): boolean =>
  typeof obj === "undefined" || obj === null;
