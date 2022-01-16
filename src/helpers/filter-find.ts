import { FindAllOptions } from "../interfaces/find-options";
import { iValue } from "../interfaces/ivalue";
import { applyOffsetAndLimit } from "./apply-offset-and-limit";
import { asyncFilter } from "./async-filter";
import { toType } from "./to-type";

export async function filterFind<T = any>(
  elements: iValue<T>[],
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
    elements = await asyncFilter(elements, async (element: iValue<any>) => {
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
