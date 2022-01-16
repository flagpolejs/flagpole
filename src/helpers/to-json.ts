export const toJson = <T>(json: string): T => {
  try {
    return JSON.parse(json);
  } catch (ex) {}
  return {} as T;
};
