import * as nodeAssert from "assert";

export const deepEquals = (thisValue: any, thatValue: any): boolean => {
  try {
    nodeAssert.deepEqual(thisValue, thatValue);
    return true;
  } catch (ex) {
    return false;
  }
};

export const deepStrictEqual = (thisValue: any, thatValue: any): boolean => {
  try {
    nodeAssert.deepStrictEqual(thisValue, thatValue);
    return true;
  } catch (ex) {
    return false;
  }
};
