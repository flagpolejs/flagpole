import { Schema } from "ajv";
import { AssertSchemaType } from "./schema";
import { CompareCallback, JsFunction } from "./generic-types";
import { iAssertionIs } from "./iassertion-is";
import { IteratorBoolCallback, IteratorCallback } from "./iterator-callbacks";

export interface iAssertion {
  value: any;
  text: string;
  subject: string;
  and: iAssertion;
  type: iAssertion;
  length: iAssertion;
  trim: iAssertion;
  keys: iAssertion;
  values: iAssertion;
  not: iAssertion;
  optional: iAssertion;
  result: Promise<any>;
  assertionMade: boolean;
  name: string;
  passed: boolean | null;
  isFinalized: boolean;
  is: iAssertionIs;
  sort(compareFunc?: CompareCallback): iAssertion;
  setDefaultMessages(notMessage: string, standardMessage: string): iAssertion;
  setDefaultMessage(message: string): iAssertion;
  setDefaultNotMessage(message: string): iAssertion;
  as(aliasName: string): iAssertion;
  exactly(value: any): iAssertion;
  equals(value: any): iAssertion;
  like(value: any): iAssertion;
  greaterThan(value: any): iAssertion;
  greaterThanOrEquals(value: any): iAssertion;
  lessThan(value: any): iAssertion;
  lessThanOrEquals(value: any): iAssertion;
  between(min: any, max: any): iAssertion;
  matches(pattern: string | RegExp): iAssertion;
  contains(value: any): iAssertion;
  startsWith(value: any): iAssertion;
  endsWith(value: any): iAssertion;
  in(values: any[]): iAssertion;
  includes(value: any): iAssertion;
  exists(): iAssertion;
  hidden(): Promise<iAssertion>;
  visible(): Promise<iAssertion>;
  resolves(continueOnReject?: boolean): Promise<iAssertion>;
  rejects(continueOnReject?: boolean): Promise<any>;
  pluck(property: string): iAssertion;
  nth(index: number): iAssertion;
  map(callback: IteratorCallback): Promise<iAssertion>;
  every(callback: IteratorBoolCallback): Promise<iAssertion>;
  everySync(callback: IteratorBoolCallback): iAssertion;
  some(callback: IteratorBoolCallback): Promise<iAssertion>;
  none(callback: IteratorBoolCallback): Promise<iAssertion>;
  assert(a: any, b?: any): iAssertion;
  comment(input: any): iAssertion;
  schema(schemaName: string, useJsonSchema: boolean): Promise<iAssertion>;
  schema(
    schemaName: string,
    schemaType?: AssertSchemaType
  ): Promise<iAssertion>;
  schema(schema: Schema, schemaType?: AssertSchemaType): Promise<iAssertion>;
  looksLike(imageData: Buffer): iAssertion;
  looksLike(imageLocalPath: string): iAssertion;
  looksLike(imageData: Buffer, threshold: number): iAssertion;
  looksLike(imageLocalPath: string, threshold: number): iAssertion;
  looksLike(imageData: Buffer, thresholdPercent: string): iAssertion;
  looksLike(imageLocalPath: string, thresholdPercent: string): iAssertion;
  hasValue(value?: any): Promise<iAssertion>;
  hasProperty(key: string, value?: any): Promise<iAssertion>;
  hasAttribute(key: string, value?: string | RegExp): Promise<iAssertion>;
  hasClassName(value?: string | RegExp): Promise<iAssertion>;
  hasText(text?: string | RegExp): Promise<iAssertion>;
  hasTag(tagName?: string | RegExp): Promise<iAssertion>;
  eval(js: JsFunction, ...args: any[]): Promise<iAssertion>;
  evalEvery(js: JsFunction, ...args: any[]): Promise<iAssertion>;
  execute(
    bool: boolean,
    actualValue: any,
    highlightText?: string | null
  ): iAssertion;
}
