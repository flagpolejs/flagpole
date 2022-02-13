import { FindAllOptions, FindOptions } from "./interfaces/find-options";
import { Value } from "./value";
import { toType, asyncFilter } from "./util";
import { AssertionContext } from "./assertion/assertion-context";

export function wrapAsValue<InputType>(
  context: AssertionContext,
  data: InputType,
  name: string,
  sourceCode?: any
) {
  return new Value(data, context, { name, sourceCode });
}

export type FindParams = {
  contains: string | null;
  matches: RegExp | null;
  opts: FindOptions | FindAllOptions | null;
};

export function getFindName(
  params: FindParams,
  selector: string | string[],
  i: number | null
) {
  const selectors = typeof selector == "string" ? [selector] : selector;
  const name = selectors.length > 1 ? selectors.join("|") : selector;
  return params.contains
    ? `${name} containing "${params.contains}"`
    : params.matches
    ? `${name} matching ${String(params.matches)}`
    : i === null
    ? `${name}`
    : `${name}[${i}]`;
}

export function getFindParams(a: any, b: any): FindParams {
  const contains = typeof a === "string" ? a : null;
  const matches = toType(a) === "regexp" ? a : null;
  const opts = (contains || matches ? b : a || b) || null;
  return { contains: contains, matches: matches, opts: opts };
}

export async function filterFind<
  InputType = any,
  Wrapper extends Value<InputType> = Value<InputType>
>(
  elements: Wrapper[],
  contains?: string | RegExp | null,
  opts?: FindAllOptions | null
) {
  const containsType = toType(contains);
  // No changes if no opts
  if (opts === undefined) {
    return elements;
  }
  // Filter by contents
  if (contains) {
    elements = await asyncFilter(elements, async (element: Wrapper) => {
      const text: string = await (async () => {
        if (opts?.findBy == "value") {
          return (await element.getValue()).$;
        }
        if (opts?.findBy == "html") {
          return (await element.getOuterHtml()).$;
        }
        return (await element.getText()).$;
      })();
      if (containsType == "regexp") {
        return (contains as RegExp).test(text.toString());
      }
      return text.toLowerCase().indexOf(String(contains).toLowerCase()) >= 0;
    });
  }
  // Apply offset and limit
  if (opts?.offset || opts?.limit) {
    elements = applyOffsetAndLimit(opts, elements);
  }
  return elements;
}

export function applyOffsetAndLimit<
  InputType = any,
  Wrapper extends Value<InputType> = Value<InputType>
>(opts: FindAllOptions, elements: Wrapper[]): Wrapper[] {
  const start = opts.offset || 0;
  const end = opts.limit ? start + opts.limit : undefined;
  elements = elements.slice(start, end);

  return elements;
}

export const delay = (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

export const stripUndefinedValues = <T>(obj: T): Partial<T> => {
  Object.keys(obj).forEach((key) => {
    if (obj[key] === undefined) {
      delete obj[key];
    }
  });
  return obj;
};

export const stripNullishValues = <T>(obj: T): Partial<T> => {
  Object.keys(obj).forEach((key) => {
    if (obj[key] === undefined || obj[key] === null) {
      delete obj[key];
    }
  });
  return obj;
};
