import {
  iMessageAndCallback,
  iScenario,
  iNextCallback,
  AssertSchemaType,
  AjvErrors,
} from "./interfaces";
import * as fs from "fs";
import * as path from "path";
import * as nodeAssert from "assert";
import {
  IteratorBoolCallback,
  IteratorCallback,
} from "./interfaces/iterator-callbacks";
import { types } from "util";
import AjvJsonSchema, { Schema, ValidateFunction } from "ajv";
import AjvJtd from "ajv/dist/jtd";

export const toArray = <T>(value: any): T[] =>
  Array.isArray(value) ? value : [value];

export const toJson = <T>(json: string): T => {
  try {
    return JSON.parse(json);
  } catch (ex) {}
  return {} as T;
};

/**
 * Is this object null or undefined?
 *
 * @param obj
 * @returns {boolean}
 */
export const isNullOrUndefined = (obj: unknown): boolean =>
  typeof obj === "undefined" || obj === null;

export const isAsyncCallback = (func: Function): boolean => {
  return (
    func.constructor.name == "AsyncFunction" ||
    types.isAsyncFunction(func) ||
    func.toString().indexOf("__awaiter(") > 0
  );
};

export const toOrdinal = (n: number): string => {
  const suffix = ["th", "st", "nd", "rd"];
  const value = n % 100;
  return n + (suffix[(value - 20) % 10] || suffix[value] || suffix[0]);
};

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

export const arrayUnique = <T>(arr: T[]): T[] => {
  return [...new Set(arr)];
};

export const uniqueId = (): string =>
  "_" + Math.random().toString(36).substr(2, 9);

export const openInBrowser = async (content: string): Promise<string> => {
  const open = require("open");
  const tmp = require("tmp");
  const tmpObj = tmp.fileSync({ postfix: ".html" });
  const filePath: string = tmpObj.name;
  fs.writeFileSync(filePath, content);
  await open(filePath);
  return filePath;
};

export const runAsync = (callback: Function, delay = 1) => {
  setTimeout(callback, delay);
};

export const asyncFindIndex = async (
  array: any[],
  callback: IteratorBoolCallback
): Promise<number> => {
  for (let i = 0; i < array.length; i++) {
    if (await callback(array[i], i, array)) {
      return i;
    }
  }
  return -1;
};

export const asyncFind = async <T>(
  array: T[],
  callback: IteratorBoolCallback
): Promise<T | null> => {
  for (let i = 0; i < array.length; i++) {
    if (await callback(array[i], i, array)) {
      return array[i];
    }
  }
  return null;
};

export const asyncFindNot = async <T>(
  array: T[],
  callback: IteratorBoolCallback
): Promise<T | null> => {
  for (let i = 0; i < array.length; i++) {
    if (!(await callback(array[i], i, array))) {
      return array[i];
    }
  }
  return null;
};

export const asyncUntil = async <T>(
  array: any[],
  callback: IteratorCallback
): Promise<T | null> => {
  for (let i = 0; i < array.length; i++) {
    const output = await callback(array[i], i, array);
    if (output) {
      return output;
    }
  }
  return null;
};

export const asyncForEach = async <T>(
  array: T[],
  callback: IteratorCallback
): Promise<void> => {
  await asyncMap(array, callback);
};

export const asyncEvery = async <T>(
  array: T[],
  callback: IteratorBoolCallback
): Promise<boolean> => {
  for (const item of array) {
    if (!(await callback(item))) return false;
  }
  return true;
};

export const asyncFilter = async <T>(
  array: T[],
  callback: IteratorBoolCallback
): Promise<T[]> => {
  const results = await asyncMap<boolean, T>(array, callback);
  return array.filter((_v, index) => !!results[index]);
};

export const asyncMap = async <T, F = unknown>(
  array: F[],
  callback: IteratorCallback
): Promise<T[]> => {
  return Promise.all(
    //array.map(async (item, i, arr) => await callback(item, i, arr))
    array.map(callback)
  );
};

export const asyncFlatMap = async <T, F = unknown>(
  array: F[],
  callback: IteratorCallback
): Promise<T[]> => {
  const values = await asyncMap<T, F>(array, callback);
  return ([] as T[]).concat(...values);
};

export const asyncMapToObject = async <T>(
  array: string[],
  callback: IteratorCallback
): Promise<{ [key: string]: T }> => {
  const results = await asyncMap<T, string>(array, callback);
  return array.reduce((map, key, i) => {
    map[key] = results[i];
    return map;
  }, {});
};

export async function asyncNone<T>(
  array: T[],
  callback: IteratorBoolCallback
): Promise<boolean> {
  return !(await asyncSome(array, callback));
}

export async function asyncSome<T>(
  array: T[],
  callback: IteratorBoolCallback
): Promise<boolean> {
  for (const item of array) {
    if (await callback(item)) return true;
  }
  return false;
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
  return toArray(keys)
    .map((val) => String(val))
    .every((val) => typeof thisValue[val] !== "undefined");
};

export const nthIn = <T>(obj: unknown, index: number): T | null => {
  try {
    if (Array.isArray(obj)) {
      return obj[index];
    } else if (typeof obj === "object" && obj !== null) {
      return obj[Object.keys(obj)[index]];
    }
  } catch (ex) {}
  return null;
};

export const firstIn = <T>(obj: any): T | null => {
  return nthIn<T>(obj, 0);
};

export const middleIn = <T>(obj: any): T | null => {
  const index = Array.isArray(obj)
    ? Math.floor(obj.length / 2)
    : typeof obj == "object" && obj !== null
    ? Math.floor(Object.keys(obj).length / 2)
    : 0;
  return nthIn<T>(obj, index);
};

export const lastIn = <T>(obj: any) => {
  const index = Array.isArray(obj)
    ? obj.length - 1
    : typeof obj == "object" && obj !== null
    ? Object.keys(obj).length - 1
    : 0;
  return nthIn<T>(obj, index);
};

export const random = (min: number, max: number): number => {
  return Math.random() * (max - min) + min;
};

export const randomInt = (min: number, max: number): number => {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1) + min);
};

export const randomIn = <T>(obj: any) => {
  const index = Array.isArray(obj)
    ? randomInt(0, obj.length - 1)
    : typeof obj == "object" && obj !== null
    ? randomInt(0, Object.keys(obj).length - 1)
    : 0;
  return nthIn<T>(obj, index);
};

export const cast = <T>(val: any): T => {
  return val;
};

export const loadSchemaValidator = (
  schemaType: AssertSchemaType,
  schema: Schema
): ValidateFunction => {
  // AJV JsonSchema
  if (schemaType === "JsonSchema") {
    const ajv = new AjvJsonSchema();
    return ajv.compile(schema);
  }
  // JTD
  const ajv = new AjvJtd();
  return ajv.compile(schema);
};

export const validateSchema = (
  thisValue: any,
  schema: Schema,
  schemaType: AssertSchemaType
): string[] => {
  const validator = loadSchemaValidator(schemaType, schema);
  const isValid: boolean = validator(thisValue);
  const errors: AjvErrors = validator.errors;
  const errorMessages: string[] = [];
  if (!isValid && !!errors) {
    errors.forEach((err) => {
      errorMessages.push(`${err.instancePath} ${err.message}`);
    });
  }
  return errorMessages;
};
