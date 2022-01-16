import AjvJsonSchema, { Schema, ValidateFunction } from "ajv";
import AjvJtd from "ajv/dist/jtd";
import { AjvErrors, AssertSchemaType } from "../interfaces/schema";

export const loadSchemaValidator = (
  schemaType: AssertSchemaType,
  schema: Schema
): ValidateFunction => {
  // AJV JsonSchema
  if (schemaType === "JsonSchema") {
    const ajv = new AjvJsonSchema();
    return ajv.compile(schema);
  }
  // JTD
  const ajv = new AjvJtd();
  return ajv.compile(schema);
};

export const validateSchema = (
  thisValue: any,
  schema: Schema,
  schemaType: AssertSchemaType
): string[] => {
  const validator = loadSchemaValidator(schemaType, schema);
  const isValid: boolean = validator(thisValue);
  const errors: AjvErrors = validator.errors;
  const errorMessages: string[] = [];
  if (!isValid && !!errors) {
    errors.forEach((err) => {
      errorMessages.push(`${err.instancePath} ${err.message}`);
    });
  }
  return errorMessages;
};
