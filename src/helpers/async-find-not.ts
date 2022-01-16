import { IteratorBoolCallback } from "../interfaces/iterator-callbacks";

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
