export const toOrdinal = (n: number): string => {
  const suffix = ["th", "st", "nd", "rd"];
  const value = n % 100;
  return n + (suffix[(value - 20) % 10] || suffix[value] || suffix[0]);
};
