import { FindParams } from "../interfaces/find-options";

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
