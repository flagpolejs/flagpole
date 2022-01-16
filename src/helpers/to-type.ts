/**
 * Get the real and normalized type of object
 *
 * @param obj
 * @returns {string}
 */
export const toType = (obj: any): string => {
  if (typeof obj === "undefined") {
    return "undefined";
  } else if (obj === null) {
    return "null";
  } else if (obj === NaN) {
    return "nan";
  } else if (!!obj && obj.cheerio) {
    return "cheerio";
  } else if (
    !!obj &&
    (typeof obj === "object" || typeof obj === "function") &&
    typeof obj.then === "function" &&
    typeof obj.catch === "function"
  ) {
    return "promise";
  } else if (obj && obj.constructor && obj.constructor.name) {
    return String(obj.constructor.name).toLocaleLowerCase();
  } else if (obj && obj.constructor && obj.constructor.toString) {
    const arr = obj.constructor.toString().match(/function\s*(\w+)/);
    if (arr && arr.length == 2) {
      return String(arr[1]).toLocaleLowerCase();
    }
  }
  // This confusing mess gets deep typeof
  const match: RegExpMatchArray | null = {}.toString
    .call(obj)
    .match(/\s([a-zA-Z]+)/);
  return match !== null ? String(match[1]).toLocaleLowerCase() : "";
};
