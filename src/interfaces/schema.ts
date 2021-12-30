import { ErrorObject } from "ajv";

export type AssertSchemaType = "JsonSchema" | "JTD";

export type AjvErrors =
  | ErrorObject<string, Record<string, any>, unknown>[]
  | null
  | undefined;
