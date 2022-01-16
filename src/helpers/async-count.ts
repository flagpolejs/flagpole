import { IteratorBoolCallback } from "../interfaces/iterator-callbacks";

export async function asyncCount<T>(
  array: T[],
  callback: IteratorBoolCallback
): Promise<number> {
  let n = 0;
  for (const item of array) {
    if (await callback(item)) n++;
  }
  return n;
}
