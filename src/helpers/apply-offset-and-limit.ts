import { iValue } from "..";
import { FindAllOptions } from "../interfaces/find-options";

export const applyOffsetAndLimit = <InputType>(
  opts: FindAllOptions,
  elements: iValue<InputType>[]
): iValue<InputType>[] => {
  const start = opts.offset || 0;
  const end = opts.limit ? start + opts.limit : undefined;
  elements = elements.slice(start, end);
  return elements;
};
