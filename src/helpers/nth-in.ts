import { randomInt } from "./random";

export const nthIn = <T>(obj: unknown, index: number): T | null => {
  try {
    if (Array.isArray(obj)) {
      return obj[index];
    } else if (typeof obj === "object" && obj !== null) {
      return obj[Object.keys(obj)[index]];
    }
  } catch (ex) {}
  return null;
};

export const firstIn = <T>(obj: any): T | null => {
  return nthIn<T>(obj, 0);
};

export const lastIn = <T>(obj: any) => {
  const index = Array.isArray(obj)
    ? obj.length - 1
    : typeof obj == "object" && obj !== null
    ? Object.keys(obj).length - 1
    : 0;
  return nthIn<T>(obj, index);
};

export const middleIn = <T>(obj: any): T | null => {
  const index = Array.isArray(obj)
    ? Math.floor(obj.length / 2)
    : typeof obj == "object" && obj !== null
    ? Math.floor(Object.keys(obj).length / 2)
    : 0;
  return nthIn<T>(obj, index);
};

export const randomIn = <T>(obj: any) => {
  const index = Array.isArray(obj)
    ? randomInt(0, obj.length - 1)
    : typeof obj == "object" && obj !== null
    ? randomInt(0, Object.keys(obj).length - 1)
    : 0;
  return nthIn<T>(obj, index);
};
