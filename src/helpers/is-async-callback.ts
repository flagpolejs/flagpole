import { types } from "util";

export const isAsyncCallback = (func: Function): boolean => {
  return (
    func.constructor.name == "AsyncFunction" ||
    types.isAsyncFunction(func) ||
    func.toString().indexOf("__awaiter(") > 0
  );
};
