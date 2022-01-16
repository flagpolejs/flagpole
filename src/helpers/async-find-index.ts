import { IteratorBoolCallback } from "../interfaces/iterator-callbacks";

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
