import { IteratorBoolCallback } from "../interfaces/iterator-callbacks";

export async function asyncSome<T>(
  array: T[],
  callback: IteratorBoolCallback
): Promise<boolean> {
  for (const item of array) {
    if (await callback(item)) return true;
  }
  return false;
}
