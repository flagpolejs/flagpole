import { IteratorBoolCallback } from "../interfaces/iterator-callbacks";
import { asyncSome } from "./async-some";

export async function asyncNone<T>(
  array: T[],
  callback: IteratorBoolCallback
): Promise<boolean> {
  return !(await asyncSome(array, callback));
}
