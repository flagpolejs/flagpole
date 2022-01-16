/**
 * Array items match at every position with a triple-equality
 */
export const arrayExactly = (a: any, b: any): boolean => {
  return (
    Array.isArray(a) &&
    Array.isArray(b) &&
    a.length === b.length &&
    a.every((val, index) => val === b[index])
  );
};
