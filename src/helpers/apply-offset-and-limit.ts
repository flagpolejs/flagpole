import { iValue } from "..";
import { FindAllOptions } from "../interfaces/find-options";

export const applyOffsetAndLimit = (
  opts: FindAllOptions,
  elements: iValue<any>[]
): iValue<any>[] => {
  const start = opts.offset || 0;
  const end = opts.limit ? start + opts.limit : undefined;
  elements = elements.slice(start, end);
  return elements;
};
