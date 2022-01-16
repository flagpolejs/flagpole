import { IteratorBoolCallback } from "../interfaces/iterator-callbacks";
import { asyncMap } from "./async-map";

export const asyncFilter = async <T>(
  array: T[],
  callback: IteratorBoolCallback
): Promise<T[]> => {
  const results = await asyncMap<boolean, T>(array, callback);
  return array.filter((_v, index) => !!results[index]);
};
