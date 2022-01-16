import { IteratorCallback } from "../interfaces/iterator-callbacks";
import { asyncMap } from "./async-map";

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
