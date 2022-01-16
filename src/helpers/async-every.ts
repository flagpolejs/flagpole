import { IteratorBoolCallback } from "../interfaces/iterator-callbacks";

export const asyncEvery = async <T>(
  array: T[],
  callback: IteratorBoolCallback
): Promise<boolean> => {
  for (const item of array) {
    if (!(await callback(item))) return false;
  }
  return true;
};
