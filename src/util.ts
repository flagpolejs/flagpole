import {
  iMessageAndCallback,
  iScenario,
  iNextCallback,
  IteratorCallback,
} from "./interfaces";
import * as fs from "fs";
import * as path from "path";
import * as nodeAssert from "assert";

export const arrayify = <T>(value: any): T[] => {
  return toType(value) == "array" ? value : [value];
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

export function asyncForEachUntilFirst(
  array: any[],
  callback: IteratorCallback
): Promise<any> {
  let output: any = null;
  array.some((value, i, arr) => {
    output = callback(value, i, arr);
    return !!output;
  });
  return output;
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

export async function asyncWhich(array: any[], callback: IteratorCallback) {
  let first: any = undefined;
  return new Promise((resolve, reject) => {
    array.some((item, i) => {
      if (callback(item, i, array)) {
        first = item;
        return true;
      }
      return false;
    });
    resolve(first);
  });
}

export async function asyncWhichFails(
  array: any[],
  callback: IteratorCallback
) {
  let first: any = undefined;
  return new Promise((resolve, reject) => {
    array.some((item, i) => {
      if (!callback(item, i, array)) {
        first = item;
        return true;
      }
      return false;
    });
    resolve(first);
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

export async function asyncFilter(array: any[], callback: IteratorCallback) {
  const results = await Promise.all(array.map(callback));
  return array.filter((_v, index) => results[index]);
}

export const asyncMap = async <T>(
  array: any[],
  callback: IteratorCallback
): Promise<T[]> => {
  return Promise.all(array.map(callback));
};

export const asyncFlatMap = async <T>(
  array: any[],
  callback: IteratorCallback
): Promise<T[]> => {
  const values = await asyncMap<T>(array, callback);
  return ([] as T[]).concat(...values);
};

export const asyncMapToObject = async <T>(
  array: string[],
  callback: IteratorCallback
): Promise<{ [key: string]: T }> => {
  const results = await asyncMap(array, callback);
  return array.reduce((map, key, i) => {
    map[key] = results[i];
    return map;
  }, {});
};

export async function asyncNone(
  array: any[],
  callback: IteratorCallback
): Promise<boolean> {
  return Promise.all(array.map(callback)).then(
    (values) => !values.some((v) => v)
  );
}

export async function asyncSome(
  array: any[],
  callback: IteratorCallback
): Promise<boolean> {
  return Promise.all(array.map(callback)).then((values) =>
    values.some((v) => v)
  );
}

/**
 * Flatten arrays and objects
 */
export const flatten = <T>(items: any[] | { [key: string]: any }): T[] => {
  return ([] as T[]).concat(...Object.values(items));
};

/**
 * Array items match at every position with a double-equality
 */
export const arrayEquals = (a: any, b: any): boolean => {
  return (
    Array.isArray(a) &&
    Array.isArray(b) &&
    a.length === b.length &&
    a.every((val, index) => val == b[index])
  );
};

/**
 * Array items match at every position with a triple-equality
 */
export const arrayExactly = (a: any, b: any): boolean => {
  return (
    Array.isArray(a) &&
    Array.isArray(b) &&
    a.length === b.length &&
    a.every((val, index) => val === b[index])
  );
};

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

export const deepEqual = (thisValue: any, thatValue: any): boolean => {
  try {
    nodeAssert.deepEqual(thisValue, thatValue);
    return true;
  } catch (ex) {
    return false;
  }
};

export const deepStrictEqual = (thisValue: any, thatValue: any): boolean => {
  try {
    nodeAssert.deepStrictEqual(thisValue, thatValue);
    return true;
  } catch (ex) {
    return false;
  }
};

export const objectContains = (thisValue: any, thatValue: any): boolean => {
  return Object.keys(thatValue).every(
    (key) => thatValue[key] == thisValue[key]
  );
};

export const objectContainsKeys = (thisValue: any, keys: any): boolean => {
  return arrayify(keys)
    .map((val) => String(val))
    .every((val) => typeof thisValue[val] !== "undefined");
};

export const firstIn = (obj: any) => {
  const type = toType(obj);
  try {
    if (type == "array") {
      return obj[0];
    } else if (type == "object") {
      return obj[Object.keys(obj)[0]];
    }
    return String(obj).substr(0, 1);
  } catch (ex) {
    return null;
  }
};

export const middleIn = (obj: any) => {
  const type = toType(obj);
  try {
    if (type == "array") {
      const i = Math.floor(obj.length / 2);
      return obj[i];
    } else if (type == "object") {
      const keys = Object.keys(obj);
      const i = Math.floor(keys.length / 2);
      return obj[keys[i]];
    }
    const i = Math.floor(String(obj).length / 2);
    return String(obj).substr(i, 1);
  } catch (ex) {
    return null;
  }
};

export const lastIn = (obj: any) => {
  const type = toType(obj);
  try {
    if (type == "array") {
      return obj[obj.length - 1];
    } else if (type == "object") {
      const keys = Object.keys(obj);
      return obj[keys[keys.length - 1]];
    }
    return String(obj).substr(-1, 1);
  } catch (ex) {
    return null;
  }
};

export const random = (min: number, max: number): number => {
  return Math.random() * (max - min) + min;
};

export const randomInt = (min: number, max: number): number => {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1) + min);
};

export const randomIn = (obj: any) => {
  const type = toType(obj);
  try {
    if (type == "array") {
      const i = randomInt(0, obj.length - 1);
      return obj[i];
    } else if (type == "object") {
      const keys = Object.keys(obj);
      const i = randomInt(0, keys.length - 1);
      return obj[keys[i]];
    }
    const i = randomInt(0, String(obj).length - 1);
    return String(obj).substr(i, 1);
  } catch (ex) {
    return null;
  }
};

export const cast = <T>(val: any): T => {
  return val;
};
