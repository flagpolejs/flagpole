import * as jmespath from "jmespath";
import { ValuePromise } from "../value-promise";
import { ContextProvider } from "../interfaces/context-provider";
import { JsonValue } from "../values/json-value";

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
  find: (path: string) => ValuePromise<JsonValue>;
  findAll: (path: string) => Promise<JsonValue[]>;
}

export const jsonFindAll = async (
  self: JsonProvider,
  path: string
): Promise<JsonValue[]> => {
  const item = await self.find(path);
  return [item];
};

export const jsonFind = (
  self: JsonProvider & ContextProvider,
  path: string
) => {
  return ValuePromise.execute<JsonValue>(async () => {
    if (self.json === undefined) {
      throw Error("No JSON document is defined.");
    }
    const selection = await self.json.search(path);
    return new JsonValue(
      selection === undefined ? null : selection,
      self.context,
      { path }
    );
  });
};
