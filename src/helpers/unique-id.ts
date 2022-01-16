export const uniqueId = (): string =>
  "_" + Math.random().toString(36).substring(2, 9);
