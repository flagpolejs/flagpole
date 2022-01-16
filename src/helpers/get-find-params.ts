import { FindParams } from "../interfaces/find-options";
import { toType } from "./to-type";

export function getFindParams(a: any, b: any): FindParams {
  const contains = typeof a === "string" ? a : null;
  const matches = toType(a) === "regexp" ? a : null;
  const opts = (contains || matches ? b : a || b) || null;
  return { contains: contains, matches: matches, opts: opts };
}
