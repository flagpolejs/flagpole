import { IteratorCallback } from "../interfaces/iterator-callbacks";

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
