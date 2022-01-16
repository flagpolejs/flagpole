import { IteratorCallback } from "../interfaces/iterator-callbacks";
import { asyncMap } from "./async-map";

export const asyncForEach = async <T>(
  array: T[],
  callback: IteratorCallback
): Promise<void> => {
  await asyncMap(array, callback);
};
