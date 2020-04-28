import { toType } from "./util";
import {
  iAjvLike,
  iAssertionSchema,
  iAssertionSchemaTestOpts,
} from "./interfaces";
import { FlagpoleExecution } from ".";
import {
  ensureDirSync,
  readFileSync,
  writeFileSync,
  existsSync,
} from "fs-extra";
import { resolve } from "path";

export function getSchemaPath(schemaName: string): string {
  // Schemas folder
  const schemasFolder = FlagpoleExecution.global.config.getSchemasFolder();
  if (!schemasFolder) {
    throw "Flagpole schema folder path not found.";
  }
  ensureDirSync(schemasFolder);
  return resolve(schemasFolder, `${schemaName}.json`);
}

export function getSchema(schemaName: string): iAssertionSchema {
  const schemaPath = getSchemaPath(schemaName);
  if (existsSync(schemaPath)) {
    const content = readFileSync(schemaPath, "utf8");
    return JSON.parse(content);
  }
  throw `Schema file ${schemaPath} does not exist`;
}

export function writeSchema(input: any, schemaName: string): iAssertionSchema {
  const schema = generateAjvSchema(input);
  writeFileSync(getSchemaPath(schemaName), JSON.stringify(schema, null, 2));
  return schema;
}

export function generateAjvSchema(json: any): iAssertionSchema {
  const ajvTypes: string[] = [
    "string",
    "number",
    "boolean",
    "array",
    "object",
    "null",
  ];

  function parseItem(item: any): iAssertionSchema {
    // Base schema object
    const schema: any = {};
    // Add type property
    const myType: string = toType(item);
    if (ajvTypes.includes(myType)) {
      schema.type = myType;
    }
    // If this is an object, then it has its own schema inside
    if (myType === "object") {
      // Parse properties
      schema.properties = {};
      Object.keys(item).forEach((key) => {
        schema.properties[key] = parseItem(item[key]);
      });
    }
    // If it's an array then we define the sub-schema for its items
    else if (myType == "array") {
      const arr = <any[]>item;
      if (arr.length > 0) {
        const containsAllObjects = arr.every((row) => {
          return toType(row) === "object";
        });
        if (containsAllObjects) {
          schema.items = {
            type: "object",
            properties: {},
          };
          arr.forEach((row) => {
            const rowSchema = parseItem(row);
            if (rowSchema.properties) {
              Object.keys(rowSchema.properties).forEach((key) => {
                const prevItem = schema.items.properties[key];
                const newItem = rowSchema.properties[key];
                // If property didn't exist previously, add it
                if (!prevItem) {
                  schema.items.properties[key] = {
                    type: newItem.type,
                  };
                }
                // Did exist previously
                else {
                  const prevType: string[] =
                    typeof schema.items.properties[key].type === "string"
                      ? [schema.items.properties[key].type]
                      : schema.items.properties[key].type;
                  // Did it change?
                  if (!prevType.includes(newItem.type)) {
                    schema.items.properties[key].type = prevType.concat([
                      newItem.type,
                    ]);
                  }
                }
              });
            }
          });
        } else {
          schema.items = [];
          item.forEach((value: any) => {
            schema.items.push(toType(value));
          });
          // Unique types
          schema.items = schema.items.filter((v, i, a) => a.indexOf(v) === i);
        }
      }
    }
    return schema;
  }

  return parseItem(json);
}

export class AssertionSchema implements iAjvLike {
  protected _schema: iAssertionSchema | undefined;
  protected _errors: Error[] = [];
  protected _root: any = null;

  public get errors(): Error[] {
    return this._errors;
  }

  public validate(schema: any, root: any): Promise<boolean> {
    this._errors = [];
    this._schema = schema;
    this._root = root;
    return new Promise((resolve) => {
      resolve(this._isValid(this._schema, this._root, "$"));
    });
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

  protected _matchesTest(schema: any, document: any, path: string): boolean {
    const schemaType = toType(schema);
    if (schemaType == "function") {
      // Function must return true
      let opts: iAssertionSchemaTestOpts = {
        path: path,
        parent: document,
        root: this._root,
      };
      if (!schema(document, opts)) {
        this._logError(`${path} did not pass the test`);
        return false;
      }
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
      // test
      if (!this._matchesTest(schema.test, document, path)) {
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
