export const arrayUnique = <T>(arr: T[]): T[] => {
  return [...new Set(arr)];
};
