export const toArray = <T>(value: any): T[] =>
  Array.isArray(value) ? value : [value];
