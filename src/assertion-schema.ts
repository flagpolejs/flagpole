import { FlagpoleExecution } from "./flagpole-execution";
import {
  ensureDirSync,
  readFileSync,
  writeFileSync,
  existsSync,
  ensureFileSync,
} from "fs-extra";
import { resolve } from "path";
import { AssertSchemaType } from "./interfaces/schema";
import { Schema } from "ajv";
import generateJtd from "@flagpolejs/json-to-jtd";
import generateJsonSchema from "@flagpolejs/json-to-jsonschema";

export function getSchemaPath(schemaName: string): string {
  let path: string;
  if (schemaName.startsWith("@") && schemaName.length > 1) {
    // Schemas folder
    const schemasFolder = FlagpoleExecution.global.config.getSchemasFolder();
    if (!schemasFolder) {
      throw "Flagpole schema folder path not found.";
    }
    ensureDirSync(schemasFolder);
    path = resolve(schemasFolder, `${schemaName.substr(1)}.json`);
  } else {
    path = resolve(schemaName);
  }
  ensureFileSync(path);
  return path;
}

export function getSchema(schemaName: string): Schema {
  const schemaPath = getSchemaPath(schemaName);
  if (existsSync(schemaPath)) {
    const content = readFileSync(schemaPath, "utf8");
    return JSON.parse(content);
  }
  throw `Schema file ${schemaPath} does not exist`;
}

export function writeSchema(
  json: any,
  schemaName: string,
  schemaType: AssertSchemaType
): Schema {
  const schema =
    schemaType == "JsonSchema" ? generateJsonSchema(json) : generateJtd(json);
  writeFileSync(getSchemaPath(schemaName), JSON.stringify(schema, null, 2));
  return schema;
}
