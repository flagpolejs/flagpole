import {
  iMessageAndCallback,
  iScenario,
  iNextCallback,
  IteratorCallback,
  FindOptions,
  FindAllOptions,
  iValue,
  iAssertionContext,
} from "./interfaces";
import * as fs from "fs";
import * as path from "path";
import { iResponse } from ".";
import { Value } from "./value";

const cheerio = require("cheerio");

export const arrayify = <T>(value: any): T[] => {
  if (toType(value) !== "array") {
    value = [value];
  }
  return value;
};

export const jsonParse = (json: string): any => {
  try {
    return JSON.parse(json);
  } catch (ex) {}
  return {};
};

/**
 * Is this object null or undefined?
 *
 * @param obj
 * @returns {boolean}
 */
export function isNullOrUndefined(obj: any): boolean {
  return typeof obj === "undefined" || obj === null;
}

export function isAsyncCallback(func: Function): boolean {
  return func.toString().indexOf("=> __awaiter(") > 0;
}

export function isArray(obj: any): boolean {
  return toType(obj) == "array";
}

/**
 * Get the real and normalized type of object
 *
 * @param obj
 * @returns {string}
 */
export function toType(obj: any): string {
  if (typeof obj === "undefined") {
    return "undefined";
  } else if (obj === null) {
    return "null";
  } else if (obj === NaN) {
    return "nan";
  } else if (obj instanceof cheerio) {
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
    let arr = obj.constructor.toString().match(/function\s*(\w+)/);
    if (arr && arr.length == 2) {
      return String(arr[1]).toLocaleLowerCase();
    }
  }
  // This confusing mess gets deep typeof
  const match: RegExpMatchArray | null = {}.toString
    .call(obj)
    .match(/\s([a-zA-Z]+)/);
  return match !== null ? String(match[1]).toLocaleLowerCase() : "";
}

export function arrayUnique(arr: any): any[] {
  return [...new Set(arr)];
}

export function uniqueId(): string {
  return "_" + Math.random().toString(36).substr(2, 9);
}

export async function openInBrowser(content: string): Promise<string> {
  const open = require("open");
  const tmp = require("tmp");
  const tmpObj = tmp.fileSync({ postfix: ".html" });
  const filePath: string = tmpObj.name;
  fs.writeFileSync(filePath, content);
  await open(filePath);
  return filePath;
}

export function runAsync(callback: Function, delay: number = 1) {
  setTimeout(callback, delay);
}

export function asyncForEach(
  array: any[],
  callback: IteratorCallback
): Promise<void> {
  return new Promise((resolve) => {
    Promise.all(array.map(callback)).then(() => {
      resolve();
    });
  });
}

export async function asyncEvery(
  array: any[],
  callback: IteratorCallback
): Promise<boolean> {
  return Promise.all(array.map(callback)).then((values) =>
    values.every((v) => v)
  );
}

export function asyncEvery2(
  array: any[],
  callback: Function
): Promise<boolean> {
  return new Promise((resolve) => {
    const promises: Promise<any>[] = [];
    for (let i = 0; i < array.length; i++) {
      promises.push(callback(array[i], i, array));
    }
    Promise.all(promises).then((values: boolean[]) => {
      const boo = values.every((value) => {
        return value;
      });
      resolve(boo);
    });
  });
}

export async function asyncFilter(array: any[], callback: IteratorCallback) {
  const results = await Promise.all(array.map(callback));
  return array.filter((_v, index) => results[index]);
}

export async function asyncMap(array: any[], callback: IteratorCallback) {
  return Promise.all(array.map(callback));
}

export async function asyncNone(
  array: any[],
  callback: IteratorCallback
): Promise<boolean> {
  return Promise.all(array.map(callback)).then(
    (values) => !values.some((v) => v)
  );
}

export function asyncNone2(array: any[], callback: Function): Promise<boolean> {
  return new Promise((resolve) => {
    const promises: Promise<any>[] = [];
    for (let i = 0; i < array.length; i++) {
      promises.push(callback(array[i], i, array));
    }
    Promise.all(promises).then((values: boolean[]) => {
      const boo = !values.some((value) => {
        return value;
      });
      resolve(boo);
    });
  });
}

export async function asyncSome(
  array: any[],
  callback: IteratorCallback
): Promise<boolean> {
  return Promise.all(array.map(callback)).then((values) =>
    values.some((v) => v)
  );
}

export function asyncSome2(array: any[], callback: Function): Promise<boolean> {
  return new Promise((resolve) => {
    const promises: Promise<any>[] = [];
    for (let i = 0; i < array.length; i++) {
      promises.push(callback(array[i], i, array));
    }
    Promise.all(promises).then((values: boolean[]) => {
      const boo = values.some((value) => {
        return value;
      });
      resolve(boo);
    });
  });
}

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

export function ensureFolderExists(path: string) {
  if (!fs.existsSync(path)) {
    fs.mkdirSync(path, { recursive: true });
  }
}

export function emptyFolder(folderPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    folderPath = path.resolve(folderPath);
    ensureFolderExists(folderPath);
    fs.readdir(folderPath, (err, files) => {
      if (err) reject(err);
      const promises: Promise<any>[] = [];
      for (const file of files) {
        promises.push(fs.promises.unlink(path.join(folderPath, file)));
      }
      Promise.all(promises)
        .then(() => {
          resolve();
        })
        .catch((err) => {
          reject(err);
        });
    });
  });
}

export function exitProcess(passed: boolean) {
  process.exit(passed ? 0 : 1);
}

export function getMessageAndCallbackFromOverloading(
  a: any,
  b: any,
  defaultMessage: string = "Untitled"
): iMessageAndCallback {
  const message: string = typeof a == "string" ? a : defaultMessage;
  const callback: iNextCallback = (() => {
    // Handle overloading
    if (typeof b == "function") {
      return b;
    } else if (typeof a == "function") {
      return a;
    }
    // No callback was set, so just create a blank one
    else {
      return () => {};
    }
  })();
  const scenario: iScenario = (() => {
    if (toType(a) == "scenario") {
      return a;
    } else if (toType(b) == "scenario") {
      return b;
    }
    return undefined;
  })();
  return {
    isSubScenario: !!(a || b),
    message: message,
    callback: callback,
    scenario: scenario,
  };
}

export type FindParams = {
  contains: string | null;
  matches: RegExp | null;
  opts: FindOptions | FindAllOptions | null;
};

export function getFindName(params: FindParams, selector: string, i: number) {
  return params.contains
    ? `${selector} containing "${params.contains}"`
    : params.matches
    ? `${selector} matching ${String(params.matches)}`
    : `${selector}[${i}]`;
}

export function getFindParams(a: any, b: any): FindParams {
  const contains = typeof a === "string" ? a : null;
  const matches = toType(a) === "RegExp" ? a : null;
  const opts = (contains || matches ? b : a || b) || null;
  return { contains: contains, matches: matches, opts: opts };
}

export async function filterFind(
  elements: iValue[],
  contains?: string | RegExp | null,
  opts?: FindAllOptions | null
) {
  const containsType = toType(contains);
  // No changes if no opts
  if (opts === undefined) {
    return elements;
  }
  // Filter by contents
  if (contains) {
    elements = await asyncFilter(elements, async (element: iValue) => {
      const text: string = await (async () => {
        if (opts?.findBy == "value") {
          return (await element.getValue()).$;
        }
        if (opts?.findBy == "html") {
          return (await element.getOuterHtml()).$;
        }
        return (await element.getText()).$;
      })();
      if (containsType == "RegExp") {
        return (contains as RegExp).test(text.toString());
      }
      return text.toLowerCase().indexOf(String(contains).toLowerCase()) >= 0;
    });
  }
  // Apply offset and limit
  if (opts?.offset || opts?.limit) {
    const start = opts.offset || 0;
    const end = opts.limit ? start + opts.limit : undefined;
    elements = elements.slice(start, end);
  }
  return elements;
}

export async function findOne(
  scope: iValue | iResponse,
  selector: string,
  params: FindParams
) {
  const opts = {
    ...params.opts,
    ...{ limit: 1 },
  };
  const elements =
    params.contains !== null
      ? await scope.findAll(selector, params.contains, opts)
      : params.matches !== null
      ? await scope.findAll(selector, params.matches, opts)
      : await scope.findAll(selector, opts);
  return elements[0] || wrapAsValue(scope.context, null, selector);
}

export function wrapAsValue(
  context: iAssertionContext,
  data: any,
  name: string,
  source?: any
): iValue {
  return new Value(data, context, name, source);
}
