import { IteratorCallback } from "../interfaces/iterator-callbacks";

export const asyncMap = async <T, F = unknown>(
  array: F[],
  callback: IteratorCallback
): Promise<T[]> => {
  return Promise.all(
    //array.map(async (item, i, arr) => await callback(item, i, arr))
    array.map(callback)
  );
};
