import * as jmespath from "jmespath";
import { wrapAsValue } from "../helpers";
import { ValuePromise } from "../value-promise";
import { ContextProvider } from "../interfaces/context-provider";
import { Value } from "../value";

export type JsonData =
  | string
  | number
  | boolean
  | null
  | { [x: string]: JsonData }
  | Array<JsonData>;

export const jsonSearch = (input: JsonData, path: string) => {
  return jmespath.search(input, path);
};

export class JsonDoc {
  constructor(public readonly root: JsonData) {}

  public search = async (path: string): Promise<JsonData | undefined> => {
    try {
      return jsonSearch(this.root, path) as JsonData;
    } catch (ex) {
      return undefined;
    }
  };
}

export interface JsonProvider {
  json?: JsonDoc;
  find: (path: string) => ValuePromise<JsonData, Value<JsonData>>;
  findAll: (path: string) => Promise<Value<JsonData>[]>;
}

export const jsonFindAll = async (
  self: JsonProvider,
  path: string
): Promise<Value<JsonData>[]> => {
  const item = await self.find(path);
  return [item];
};

export const jsonFind = (
  self: JsonProvider & ContextProvider,
  path: string
) => {
  return ValuePromise.execute<
    JsonData | undefined,
    Value<JsonData | undefined>
  >(async () => {
    if (self.json === undefined) {
      throw Error("No JSON document is defined.");
    }
    const selection = await self.json.search(path);
    return wrapAsValue(self.context, selection, path, selection);
  });
};
