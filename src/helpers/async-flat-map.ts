import { IteratorCallback } from "../interfaces/iterator-callbacks";
import { asyncMap } from "./async-map";

export const asyncFlatMap = async <T, F = unknown>(
  array: F[],
  callback: IteratorCallback
): Promise<T[]> => {
  const values = await asyncMap<T, F>(array, callback);
  return ([] as T[]).concat(...values);
};
