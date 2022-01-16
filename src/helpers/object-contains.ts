import { toArray } from "./to-array";

export const objectContains = (thisValue: any, thatValue: any): boolean => {
  return Object.keys(thatValue).every(
    (key) => thatValue[key] == thisValue[key]
  );
};

export const objectContainsKeys = (thisValue: any, keys: any): boolean => {
  return toArray(keys)
    .map((val) => String(val))
    .every((val) => typeof thisValue[val] !== "undefined");
};
