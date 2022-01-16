import { Value } from "../value";
import { iAssertionContext } from "../interfaces/iassertioncontext";
import { ValuePromise } from "..";

export function wrapValue<T>(
  context: iAssertionContext,
  data: T,
  name: string,
  parent?: any,
  highlight?: string
) {
  return new Value<T>(data, context, name, parent, highlight);
}

export function wrapValuePromise<T>(
  context: iAssertionContext,
  data: T,
  name: string,
  parent?: any,
  highlight?: string
): ValuePromise {
  return ValuePromise.wrap(
    wrapValue<T>(context, data, name, parent, highlight)
  );
}
