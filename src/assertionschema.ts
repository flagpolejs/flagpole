import { toType, arrayUnique } from "./util";
import { iAjvLike, JsonSchema_Type, JsonSchema } from "./interfaces";
import { FlagpoleExecution } from "./flagpoleexecution";
import {
  ensureDirSync,
  readFileSync,
  writeFileSync,
  existsSync,
  ensureFileSync,
} from "fs-extra";
import { resolve } from "path";

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

export function getSchema(schemaName: string): JsonSchema {
  const schemaPath = getSchemaPath(schemaName);
  if (existsSync(schemaPath)) {
    const content = readFileSync(schemaPath, "utf8");
    return JSON.parse(content);
  }
  throw `Schema file ${schemaPath} does not exist`;
}

export function writeSchema(json: any, schemaName: string): JsonSchema {
  const schema = generateAjvSchema(json);
  writeFileSync(getSchemaPath(schemaName), JSON.stringify(schema, null, 2));
  return schema;
}

export function generateAjvSchema(json: any): JsonSchema {
  const ajvTypes: string[] = [
    "string",
    "number",
    "integer",
    "boolean",
    "array",
    "object",
    "null",
  ];

  function parseObject(obj: any): JsonSchema {
    const schema: JsonSchema = {
      type: ["object"],
      properties: {},
    };
    Object.keys(obj).forEach((key) => {
      if (schema.properties) {
        schema.properties[key] = parseItem(obj[key]);
      }
    });
    return schema;
  }

  function parseArray(arr: any[]): JsonSchema {
    const schema: JsonSchema = {
      type: ["array"],
    };
    if (arr.length > 0) {
      const containsAllObjects = arr.every((row) => toType(row) === "object");
      if (containsAllObjects) {
        schema.items = {
          type: ["object"],
          properties: {},
        };
        arr.forEach((row) => {
          const rowSchema = parseItem(row);
          if (rowSchema.properties) {
            Object.keys(rowSchema.properties).forEach((key) => {
              // Make TypeScript happy
              if (
                !schema.items ||
                !schema.items.properties ||
                !rowSchema.properties
              ) {
                return;
              }
              const prevItem = schema.items.properties[key];
              const newItem = rowSchema.properties[key];
              // If property didn't exist previously, add it
              if (!prevItem) {
                schema.items.properties[key] = newItem;
              }
              // This property already existed in schema, so merge it
              else {
                // This only merges the types
                // it does not take sub-properties from the other objects after the first
                // we need to think through how this schema creation should work if it varies
                const newType = Array.isArray(newItem.type)
                  ? newItem.type
                  : [newItem.type];
                const prevType = Array.isArray(prevItem.type)
                  ? prevItem.type
                  : [prevItem.type];
                schema.items.properties[key].type = arrayUnique([
                  ...prevType,
                  ...newType,
                ]);
              }
            });
          }
        });
      }
      // If not all items are objects, just map the types that it may
      else {
        schema.items = {
          type: arrayUnique(
            arr.map((value: any) => toType(value))
          ) as JsonSchema_Type[],
        };
      }
    }
    return schema;
  }

  function parseItem(item: any): JsonSchema {
    // Add type property
    const myType = toType(item) as JsonSchema_Type;
    // If this is an object, then it has its own schema inside
    if (myType === "object") {
      return parseObject(item);
    }
    // If it's an array then we define the sub-schema for its items
    else if (myType == "array") {
      return parseArray(item);
    } else {
      return {
        type: [myType],
      };
    }
  }

  return parseItem(json);
}

export class AssertionSchema implements iAjvLike {
  protected _errors: Error[] = [];

  public get errors(): Error[] {
    return this._errors;
  }

  /**
   * Test schema
   */
  public isValid(schema: any, root: any): boolean {
    this._errors = [];
    return this._isValid(schema, root, "$");
  }

  /**
   * Test schema but return as a promise, this mimics the AJV library
   */
  public async validate(schema: any, root: any): Promise<boolean> {
    return this.isValid(schema, root);
  }

  protected _logError(message: string) {
    const err: Error = new Error(message);
    this._errors.push(err);
  }

  protected _matchesType(schema: any, document: any, path: string): boolean {
    const schemaType = toType(schema);
    const docType = toType(document);
    if (schemaType != "undefined") {
      // If schema item is a string, then it's defining type
      if (schemaType == "string") {
        if (docType != schema) {
          this._logError(
            `typeOf ${path} was ${docType}, which did not match ${schema}`
          );
          return false;
        }
      }
      // If the type is an array, then it's an array of allowed types
      else if (schemaType == "array") {
        const allowedTypes: string[] = schema;
        if (allowedTypes.indexOf(docType) < 0) {
          this._logError(
            `${path} was ${docType}, which did not match ${allowedTypes.join(
              " | "
            )}`
          );
          return false;
        }
      }
    }
    return true;
  }

  protected _matchesEnum(schema: any, document: any, path: string): boolean {
    if (toType(schema) == "array") {
      // Value must be in this array
      if ((schema as any[]).indexOf(document) < 0) {
        this._logError(
          `${path} value ${document} is not in enum ${schema.join(", ")}`
        );
        return false;
      }
    }
    return true;
  }

  protected _matchesPattern(schema: any, document: any, path: string): boolean {
    const schemaType = toType(schema);
    if (
      schemaType != "undefined" &&
      !new RegExp(schema).test(String(document))
    ) {
      this._logError(
        `${path} value ${document} did not match ${String(schema)}`
      );
      return false;
    }
    return true;
  }

  protected _matchesItems(schema: any, document: any, path: string): boolean {
    const schemaType: string = toType(schema);
    const docType: string = toType(document);
    if (schemaType != "undefined") {
      // If there is an items value then implicity this should be an array
      if (docType != "array") {
        this._logError(`${path} was not an array, but schema defines items.`);
        return false;
      }
      // Loop through each item in the array
      return (document as Array<any>).every((subItem, index) => {
        // If it's a string, just validate the type of each item
        if (schemaType == "string" || schemaType == "array") {
          return this._matchesType(schema, subItem, `${path}[${index}]`);
        }
        // Otherwise, validate that array item against the "every" sub-schema
        else if (schemaType == "object") {
          return this._isValid(schema, subItem, `${path}[${index}]`);
        }
        return true;
      });
    }
    return true;
  }

  protected _matchesProperties(
    schema: any,
    document: any,
    path: string
  ): boolean {
    const schemaType: string = toType(schema);
    const docType: string = toType(document);
    if (schemaType != "undefined") {
      // If there is an properties value then implicity this should be an object
      if (docType != "object") {
        this._logError(
          `${path} was not an object, but schema defines properties.`
        );
        return false;
      }
      // If properties is a string, then we are just expecting every property to be that type
      if (schemaType == "string" || schemaType == "array") {
        return Object.keys(document).every((key) => {
          return this._matchesType(schema, document[key], `${path}.${key}`);
        });
      }
      // If properties is an object, then test as a sub-schema
      if (schemaType == "object") {
        return Object.keys(schema).every((key) => {
          return this._isValid(schema[key], document[key], `${path}.${key}`);
        });
      }
    }
    return true;
  }

  protected _isValid(schema: any, document: any, path: string): boolean {
    const schemaType: string = toType(schema);
    const docType: string = toType(document);
    // If it's either a string or array, we're testing the type
    if (schemaType == "string" || schemaType == "array") {
      if (!this._matchesType(schema, document, path)) {
        return false;
      }
    }
    // If schema item is an object, then we do more complex parsing
    else if (schemaType == "object") {
      // type
      if (!this._matchesType(schema.type, document, path)) {
        if (!schema.optional || typeof document != "undefined") {
          return false;
        }
      }
      // enum
      if (!this._matchesEnum(schema.enum, document, path)) {
        return false;
      }
      // pattern
      if (!this._matchesPattern(schema.matches, document, path)) {
        return false;
      }
      // items
      if (!this._matchesItems(schema.items, document, path)) {
        return false;
      }
      // properties
      if (!this._matchesProperties(schema.properties, document, path)) {
        return false;
      }
    }
    // Fallback to true, probably invalid schema item
    return true;
  }
}
