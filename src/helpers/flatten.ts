/**
 * Flatten arrays and objects
 */
export const flatten = <T>(items: any[] | { [key: string]: any }): T[] => {
  return ([] as T[]).concat(...Object.values(items));
};
