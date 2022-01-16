import * as jmespath from "jmespath";
import { iValue } from "../interfaces/ivalue";
import { wrapValue } from "../helpers";
import { ValuePromise } from "../value-promise";
import { iResponse } from "../interfaces/iresponse";

export class JsonDoc {
  public get root(): any {
    return this.jsonRoot;
  }

  constructor(public jsonRoot: any) {}

  public search = async (path: string) => {
    try {
      return jpathSearch(this.jsonRoot, path);
    } catch (ex) {
      return undefined;
    }
  };
}

export interface JPathProvider {
  jsonDoc: JsonDoc | undefined;
}

export const jpathSearch = (input: any, path: string) => {
  return jmespath.search(input, path);
};

export const jpathFindAll = async (
  self: JPathProvider & iResponse,
  path: string
): Promise<iValue[]> => {
  const item = await self.find(path);
  return [item];
};

export const jpathFind = (
  self: JPathProvider & iResponse,
  path: string
): ValuePromise => {
  return ValuePromise.execute(async () => {
    if (self.jsonDoc === undefined) {
      throw Error("No JSON document is defined.");
    }
    const selection = await self.jsonDoc.search(path);
    return wrapValue(self.context, selection, path, selection);
  });
};
