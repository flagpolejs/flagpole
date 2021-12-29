import { Value } from "./value";
import { getSchema, writeSchema } from "./assertion-schema";
import {
  iAssertionContext,
  iAssertion,
  iAssertionResult,
  iValue,
  iAssertionIs,
  CompareCallback,
  AssertSchemaType,
  JsFunction,
} from "./interfaces";
import {
  toType,
  isNullOrUndefined,
  asyncEvery,
  asyncNone,
  asyncSome,
  asyncMap,
  arrayEquals,
  arrayExactly,
  deepEqual,
  deepStrictEqual,
  toArray,
  objectContains,
  objectContainsKeys,
  toOrdinal,
  asyncFind,
  asyncFindNot,
  validateSchema,
} from "./util";
import { HttpResponse } from "./http-response";
import { ImageCompare } from "./visual/image-compare";
import { AssertionIs } from "./assertion-is";
import { Schema } from "ajv";
import generateJsonSchema from "@flagpolejs/json-to-jsonschema";
import {
  IteratorBoolCallback,
  IteratorCallback,
} from "./interfaces/iterator-callbacks";

export class Assertion implements iAssertion {
  public get value(): any {
    return this._getCompareValue(this._input);
  }

  public get text(): string {
    return String(this._getCompareValue(this._input));
  }

  public get subject(): string {
    const type: string = toType(this._input);
    let name: string;
    if (this._input && this._input.name) {
      name = this._input.name;
    } else if (type == "array") {
      name = "Array";
    } else if (type == "object") {
      name = "Object";
    } else if (type == "domelement") {
      name = "DOM Element";
    } else if (type == "cssrule") {
      name = "CSS Rule";
    } else {
      name = String(this._input);
    }
    // If the name is too long, truncate it
    if (String(name).length > 64) {
      name = name.substr(0, 61) + "...";
    }
    // Return it
    return isNullOrUndefined(name) || String(name).length == 0
      ? "It"
      : String(name);
  }

  public get is(): iAssertionIs {
    return new AssertionIs(this);
  }

  /**
   * Creates a new assertion with the same value and settings, just no result
   */
  public get and(): iAssertion {
    return this._clone(this._input, `&& ${this._getMessage()}`);
  }

  /**
   * Creates a new assertion with the type of this one
   */
  public get type(): iAssertion {
    return this._clone(toType(this.value), `Type of ${this.subject}`);
  }

  /**
   * Creates a new assertion with the lengh of this one
   */
  public get length(): iAssertion {
    const length: number = (() => {
      const thisValue = this.value;
      return thisValue && thisValue.length ? thisValue.length : 0;
    })();
    return this._clone(length, `Length of ${this.subject}`);
  }

  public get trim(): iAssertion {
    return this._clone(this.text.trim(), `Trim of ${this.subject}`);
  }

  /**
   * Creates a new assertion with the keys of the object as the value
   */
  public get keys(): iAssertion {
    const keys: string[] = (() => {
      const thisValue: any = this.value;
      return isNullOrUndefined(thisValue) ? [] : Object.keys(thisValue);
    })();
    return this._clone(keys, `Keys of ${this.subject}`);
  }

  /**
   * Creates a new assertion with the values of the object as the value
   */
  public get values(): iAssertion {
    const values: any[] = (() => {
      const thisValue = this.value;
      return isNullOrUndefined(thisValue) ? [] : Object.values(thisValue);
    })();
    return this._clone(values, `Values of ${this.subject}`);
  }

  /**
   * Flips the expected assertion evaluation
   */
  public get not(): iAssertion {
    this._not = true;
    return this;
  }

  /**
   * Marks this assertion optional if it fails
   */
  public get optional(): iAssertion {
    this._optional = true;
    return this;
  }

  public get result(): Promise<iAssertionResult | null> {
    return this._finishedPromise;
  }

  public get assertionMade(): boolean {
    return this._assertionMade || this._finishedPromise.isResolved();
  }

  public get isFinalized(): boolean {
    return this._result !== null || this._statement !== null;
  }

  public get name(): string {
    return this._message || this.isFlagpoleValue
      ? (this._input as iValue).name
      : String(this._input);
  }

  public get passed(): boolean | null {
    return this._statement;
  }

  private get isFlagpoleValue(): boolean {
    return !!this._input?.isFlagpoleValue;
  }

  private get context(): iAssertionContext {
    return this._context;
  }

  private _context: iAssertionContext;
  private _input: any;
  private _message: string | null;
  private _not: boolean = false;
  private _optional: boolean = false;
  private _result: iAssertionResult | null = null;
  private _finishedPromise: Promise<iAssertionResult | null>;
  private _finishedResolver: Function = () => {};
  private _statement: boolean | null = null;
  private _assertionMade: boolean = false;
  private _defaultMessages: [string, string] = ["True", "False"];

  public static async create(
    context: iAssertionContext,
    thisValue: any,
    message?: string
  ): Promise<Assertion> {
    return new Assertion(context, thisValue, message);
  }

  constructor(
    context: iAssertionContext,
    thisValue: any,
    message?: string | null
  ) {
    this._context = context;
    this._input = thisValue;
    this._message = typeof message == "undefined" ? null : message;
    this._finishedPromise = new Promise((resolve) => {
      this._finishedResolver = resolve;
    });
  }

  public async visible(): Promise<iAssertion> {
    const is = await this._is("isVisible");
    this.setDefaultNotMessage(`${this.subject} is not visible`);
    this.setDefaultMessage(`${this.subject} is visible`);
    return this.execute(is, is);
  }

  public async hidden(): Promise<iAssertion> {
    const is = await this._is("isHidden");
    this.setDefaultMessages(
      `${this.subject} is not hidden`,
      `${this.subject} is hidden`
    );
    return this.execute(is, is);
  }

  public async hasValue(value: any): Promise<iAssertion> {
    const hasValue = await this._hasValue("hasValue", value);
    const thatValue = this._getCompareValue(value);
    this.setDefaultMessages(
      `${this.subject} does not have value ${thatValue}`,
      `${this.subject} has value ${thatValue}`
    );
    return this.execute(hasValue, thatValue);
  }

  public async hasProperty(key: string, value?: string): Promise<iAssertion> {
    const hasKey = await this._hasKeyValue("hasProperty", key, value);
    this.setDefaultMessages(
      `${this.subject} does not have property ${key}`,
      `${this.subject} has property ${key}`
    );
    return this.execute(hasKey, hasKey);
  }

  public async hasAttribute(key: string, value?: string): Promise<iAssertion> {
    const hasKey = await this._hasKeyValue("hasAttribute", key, value);
    this.setDefaultMessages(
      `${this.subject} does not have attribute ${key}`,
      `${this.subject} has attribute ${key}`
    );
    return this.execute(hasKey, hasKey);
  }

  public async hasClassName(key: string, value?: string): Promise<iAssertion> {
    const hasKey = await this._hasKeyValue("hasClassName", key, value);
    this.setDefaultMessages(
      `${this.subject} does not have class named ${key}`,
      `${this.subject} has class named ${key}`
    );
    return this.execute(hasKey, hasKey);
  }

  public async hasData(key: string, value?: string): Promise<iAssertion> {
    const hasKey = await this._hasKeyValue("hasData", key, value);
    this.setDefaultMessages(
      `${this.subject} does not have data ${key}`,
      `${this.subject} has data ${key}`
    );
    return this.execute(hasKey, hasKey);
  }

  public async hasText(text: string): Promise<iAssertion> {
    const hasValue = await this._hasValue("hasText", text);
    this.setDefaultMessages(
      `${this.subject} does not have text "${text}"`,
      `${this.subject} has text "${text}"`
    );
    return this.execute(hasValue, hasValue);
  }

  public async hasTag(tagName?: string): Promise<iAssertion> {
    const hasValue = await this._hasValue("hasTag", tagName);
    tagName
      ? this.setDefaultMessages(
          `${this.subject} is not <${tagName}>`,
          `${this.subject} is <${tagName}>`
        )
      : this.setDefaultMessages(
          `${this.subject} is not a tag`,
          `${this.subject} is a tag`
        );
    return this.execute(hasValue, this._input.tagName || "Not a tag");
  }

  public exactly(value: any): iAssertion {
    const { thisValue, thatValue } = this._getValues(value);
    const thisType = toType(thisValue);
    const thatType = toType(thatValue);
    this.setDefaultMessages(
      `${this.subject} is not exactly ${thatValue}`,
      `${this.subject} is exactly ${thatValue}`
    );
    if (thisType == "array" && thatType == "array") {
      return this.execute(arrayExactly(thisValue, thatValue), thisValue);
    }
    if (thisType == "object" && thatType == "object") {
      return this.execute(deepStrictEqual(thisValue, thatValue), thisValue);
    }
    return this.execute(thisValue === thatValue, thisValue, null);
  }

  public equals(value: any): iAssertion {
    const { thisValue, thatValue } = this._getValues(value);
    const thisType = toType(thisValue);
    const thatType = toType(thatValue);
    const thisStringified = JSON.stringify(thisValue, null, 2);
    const thatStringified = JSON.stringify(thatValue, null, 2);

    this.setDefaultMessages(
      `${this.subject} does not equal ${thatStringified}`,
      `${this.subject} equals ${thatStringified}`
    );
    if (thisType == "array" && thatType == "array") {
      return this.execute(
        arrayEquals(thisValue, thatValue),
        thisStringified,
        null,
        thatStringified
      );
    }
    if (thisType == "object" && thatType == "object") {
      return this.execute(
        deepEqual(thisValue, thatValue),
        thisStringified,
        null,
        thatStringified
      );
    }
    return this.execute(thisValue == thatValue, thisValue, null, thatValue);
  }

  public like(value: any): iAssertion {
    const thisValue: any = this.text.toLowerCase().trim();
    const thatValue: any = String(this._getCompareValue(value))
      .toLowerCase()
      .trim();
    this.setDefaultMessages(
      `${this.subject} is not like ${thatValue}`,
      `${this.subject} is like ${thatValue}`
    );
    if (Array.isArray(thisValue) && Array.isArray(thatValue)) {
      return this.execute(
        arrayEquals(
          thisValue.map((value) => String(value).toLowerCase().trim()),
          thatValue.map((value) => String(value).toLowerCase().trim())
        ),
        thisValue
      );
    }
    return this.execute(thisValue == thatValue, thisValue);
  }

  public greaterThan(value: any): iAssertion {
    const { thisValue, thatValue } = this._getValues(value);
    this.setDefaultMessages(
      `${this.subject} is not greater than ${thatValue}`,
      `${this.subject} is greater than ${thatValue}`
    );
    return this.execute(
      parseFloat(thisValue) > parseFloat(thatValue),
      thisValue,
      null,
      `> ${thatValue}`
    );
  }

  public greaterThanOrEquals(value: any): iAssertion {
    const { thisValue, thatValue } = this._getValues(value);
    this.setDefaultMessages(
      `${this.subject} is not greater than or equal to ${thatValue}`,
      `${this.subject} is greater than or equal to ${thatValue}`
    );
    return this.execute(
      parseFloat(thisValue) >= parseFloat(thatValue),
      thisValue,
      null,
      `>= ${thatValue}`
    );
  }

  public lessThan(value: any): iAssertion {
    const { thisValue, thatValue } = this._getValues(value);
    this.setDefaultMessages(
      `${this.subject} is not less than ${thatValue}`,
      `${this.subject} is less than ${thatValue}`
    );
    return this.execute(
      parseFloat(thisValue) < parseFloat(thatValue),
      thisValue,
      null,
      `< ${thatValue}`
    );
  }

  public lessThanOrEquals(value: any): iAssertion {
    const { thisValue, thatValue } = this._getValues(value);
    this.setDefaultMessages(
      `${this.subject} is not less than or equal to ${thatValue}`,
      `${this.subject} is less than or equal to ${thatValue}`
    );
    return this.execute(
      parseFloat(thisValue) <= parseFloat(thatValue),
      thisValue,
      null,
      `<= ${thatValue}`
    );
  }

  public between(min: any, max: any): iAssertion {
    const thisValue = this.value;
    const thatMin: number = parseFloat(this._getCompareValue(min));
    const thatMax: number = parseFloat(this._getCompareValue(max));
    this.setDefaultMessages(
      `${this.subject} is not between ${min} and ${max}`,
      `${this.subject} is between ${min} and ${max}`
    );
    return this.execute(
      parseFloat(thisValue) >= thatMin && parseFloat(thisValue) <= thatMax,
      thisValue,
      null,
      `Between ${min} and ${max}`
    );
  }

  public matches(value: string | RegExp): iAssertion {
    const { thisValue, thatValue } = this._getValues(value);
    const thatType = toType(thatValue);
    // Test it as regular expression
    if (["string", "regexp"].includes(thatType)) {
      const pattern = thatType == "regexp" ? thatValue : new RegExp(value);
      this.setDefaultMessages(
        `${this.subject} does not match ${String(pattern)}`,
        `${this.subject} matches ${String(pattern)}`
      );
      return this.execute(pattern.test(thisValue), String(thisValue));
    }
    // Test it as a schema template
    return this._executeSchema(
      thisValue,
      generateJsonSchema(thatValue),
      "JsonSchema"
    );
  }

  public in(values: any[]): iAssertion {
    const thisValue = this.value;
    this.setDefaultMessages(
      `${this.subject} is not in list: ${values.join(", ")}`,
      `${this.subject} is in list: ${values.join(", ")}`
    );
    return this.execute(values.indexOf(thisValue) >= 0, thisValue);
  }

  public includes(value: any): iAssertion {
    return this.contains(value);
  }

  public contains(value: any): iAssertion {
    const { thisValue, thatValue } = this._getValues(value),
      thisType = toType(thisValue),
      thatType = toType(thisValue);
    const bool: boolean = (() => {
      if (isNullOrUndefined(this._input)) {
        return thisValue === thatValue;
      } else if (thisType == "array") {
        return toArray(thatValue).every((val) => thisValue.includes(val));
      } else if (thisType == "object") {
        if (thatType == "object") {
          return objectContains(thisValue, thatValue);
        } else {
          return objectContainsKeys(thisValue, thatValue);
        }
      } else {
        return String(thisValue).includes(thatValue);
      }
    })();
    this.setDefaultMessages(
      `${this.subject} does not contain ${thatValue}`,
      `${this.subject} contains ${thatValue}`
    );
    return this.execute(bool, thisValue);
  }

  public looksLike(
    controlImage: string | Buffer,
    allowedDifference: number | string = 0
  ): iAssertion {
    const toCompare =
      this.value instanceof HttpResponse
        ? Buffer.from(this.value.body, "base64")
        : this.value;
    this.setDefaultMessages(`Images do not match.`, `Images match.`);
    let assertionPassed: boolean = false;
    let details: string = "";
    const imageCompare = new ImageCompare(
      this._context,
      toCompare,
      controlImage
    );
    // Return a number between 0 and 99.99 to represent a percentage
    const percentDifferenceAllowed: number = (() => {
      if (typeof allowedDifference === "number") {
        return allowedDifference >= 0 && allowedDifference < 1
          ? allowedDifference * 100
          : 0;
      }
      const n = parseFloat(allowedDifference);
      return !isNaN(n) && n >= 0 && n < 100 ? n : 0;
    })();
    // Do the comparison
    try {
      const result = imageCompare.compare({
        threshold: 0.1,
      });
      assertionPassed = result.percentDifferent <= percentDifferenceAllowed;
      if (!assertionPassed) {
        details =
          result.percentDifferent.toFixed(2) +
          `% of the image did not match (${result.pixelsDifferent} pixels).` +
          ` This is over the allowed difference of ${percentDifferenceAllowed}%.` +
          `  Diff image: ${result.diffPath}`;
      }
    } catch (err) {
      details = String(err);
    }
    return this.execute(assertionPassed, details);
  }

  public startsWith(value: any): iAssertion {
    const { thisValue, thatValue } = this._getValues(value);
    const bool: boolean = (() => {
      if (toType(thisValue) == "array") {
        return thisValue[0] == value;
      }
      if (!isNullOrUndefined(thisValue)) {
        return String(thisValue).startsWith(thatValue);
      }
      return false;
    })();
    this.setDefaultMessages(
      `${this.subject} does not start with ${thatValue}`,
      `${this.subject} starts with ${thatValue}`
    );
    return this.execute(bool, String(thisValue));
  }

  public endsWith(value: any): iAssertion {
    const { thisValue, thatValue } = this._getValues(value);
    const bool: boolean = (() => {
      if (toType(thisValue) == "array") {
        return thisValue[thisValue.length - 1] == thatValue;
      }
      if (!isNullOrUndefined(thisValue)) {
        return String(thisValue).endsWith(thatValue);
      }
      return false;
    })();
    this.setDefaultMessages(
      `${this.subject} does not end with ${thatValue}`,
      `${this.subject} ends with ${thatValue}`
    );
    return this.execute(bool, String(this._input));
  }

  public exists(): iAssertion {
    const thisValue = this.value;
    this.setDefaultMessages(
      `${this.subject} does not exist`,
      `${this.subject} exists`
    );
    return this.execute(
      !isNullOrUndefined(thisValue),
      this._getName(this._input),
      thisValue && thisValue.path
        ? thisValue.path
            .split(" ")
            .pop()
            .replace(/[\. "'=\[\]]/g, "")
        : null
    );
  }

  public resolves(continueOnReject: boolean = false): Promise<iAssertion> {
    const thisValue = this.value;
    this.setDefaultMessages(
      `${this.subject} was not resolved`,
      `${this.subject} was resolved`
    );
    return new Promise((resolve, reject) => {
      const result = (bool: boolean) => {
        const assertion = this.execute(bool, bool);
        if (bool) {
          resolve(assertion);
        } else {
          continueOnReject ? resolve(assertion) : reject();
        }
      };
      if (toType(thisValue) == "promise") {
        (thisValue as Promise<any>)
          .then(() => {
            result(true);
          })
          .catch(() => {
            result(false);
          });
      } else {
        result(false);
      }
    });
  }

  public rejects(continueOnReject: boolean = false): Promise<any> {
    const thisValue = this.value;
    this.setDefaultMessages(
      `${this.subject} was not rejected`,
      `${this.subject} was rejected`
    );
    return new Promise((resolve, reject) => {
      const result = (bool: boolean) => {
        const assertion = this.execute(bool, bool);
        if (bool) {
          resolve(assertion);
        } else {
          continueOnReject ? resolve(assertion) : reject();
        }
      };
      if (toType(thisValue) == "promise") {
        (thisValue as Promise<any>)
          .then(() => {
            result(false);
          })
          .catch(() => {
            result(true);
          });
      } else {
        result(false);
      }
    });
  }

  public async none(callback: IteratorBoolCallback): Promise<iAssertion> {
    this._mustBeArray(this.value);
    this.setDefaultMessages(
      `Some were true in ${this.subject}`,
      `None were true in ${this.subject}`
    );
    const result = await asyncNone(this.value, callback);
    const which = result
      ? undefined
      : `${await asyncFind(this.value, callback)}`;
    return this.execute(result, which);
  }

  public async eval(js: JsFunction, ...args: any[]): Promise<iAssertion> {
    const result = await this.context.eval.apply(undefined, [
      js,
      this.value,
      ...args,
    ]);
    this.setDefaultMessages(
      `Function evaluates false`,
      `Function evaluates true`
    );
    return this.execute(!!result, result);
  }

  public async evalEvery(js: JsFunction, ...args: any[]): Promise<iAssertion> {
    this._mustBeArray(this.value);
    this.setDefaultMessages(
      `Every function evaluates false`,
      `Every function evaluates true`
    );
    const result = await asyncEvery(this.value, (item) => {
      const val = this._getCompareValue(item);
      return !!this.context.eval.apply(undefined, [js, val, ...args]);
    });
    return this.execute(result, this.value);
  }

  public async every(callback: IteratorBoolCallback): Promise<iAssertion> {
    this._mustBeArray(this.value);
    this.setDefaultMessages(
      `Some or none were true in ${this.subject}`,
      `All were true in ${this.subject}`
    );
    const result = await asyncEvery(this.value, callback);
    const which = result
      ? undefined
      : `${JSON.stringify(await asyncFindNot(this.value, callback), null, 2)}`;

    return this.execute(result, which);
  }

  public everySync(callback: IteratorCallback): iAssertion {
    this._mustBeArray(this.value);
    this.setDefaultMessages(
      `Some or none were true in ${this.subject}`,
      `All were true in ${this.subject}`
    );
    return this.execute(
      this.value.every((value: any, index: number, array: any[]) =>
        callback(value, index, array)
      ),
      this.value
    );
  }

  public async map(callback: IteratorCallback): Promise<iAssertion> {
    const mapped = await asyncMap(this.value, callback);
    return this._clone(mapped, `Mapped ${this.subject}`);
  }

  public async some(callback: IteratorBoolCallback): Promise<iAssertion> {
    this._mustBeArray(this.value);
    this.setDefaultMessages(
      `None were true in ${this.subject}`,
      `Some were true in ${this.subject}`
    );
    return this.execute(await asyncSome(this.value, callback), this.value);
  }

  public pluck<T>(property: string): Assertion {
    return this._clone(
      toArray<T>(this.value).map((item) => item[property]),
      `Values of ${property} in ${this.subject}`
    );
  }

  public nth<T>(n: number): Assertion {
    return this._clone(
      toArray<T>(this.value)[n],
      `${toOrdinal(n + 1)} value in ${this.subject}`
    );
  }

  schema(schemaName: string, useJsonSchema: boolean): Promise<iAssertion>;
  schema(schema: string, schemaType?: AssertSchemaType): Promise<iAssertion>;
  schema(schema: Schema, schemaType?: AssertSchemaType): Promise<iAssertion>;
  public async schema(
    schema: Schema | string,
    schemaType: AssertSchemaType | boolean = "JsonSchema"
  ): Promise<iAssertion> {
    const thisValue = this.value;
    // Handle overload of schema type
    if (typeof schemaType === "boolean") {
      schemaType = schemaType ? "JsonSchema" : "JTD";
    }
    // If schema was a string, then it is a file path so load the file
    if (typeof schema === "string") {
      const schemaName: string = schema;
      try {
        schema = getSchema(schemaName);
      } catch {
        this._context.comment(
          `Created new schema snapshot called ${schemaName}`
        );
        schema = writeSchema(thisValue, schemaName, schemaType);
      }
    }
    return this._executeSchema(thisValue, schema, schemaType);
  }

  /**
   * Create a new assertion on the AssertionContext, allows chaining
   *
   * @param message
   * @param value
   */
  public assert(message: string, value: any): iAssertion;
  public assert(value: any): iAssertion;
  public assert(a: any, b?: any): iAssertion {
    return arguments.length === 2
      ? this._context.assert(a, b)
      : this._context.assert(a);
  }

  /**
   * Add a comment on the AssertionContext, allows chaining
   *
   * @param input
   */
  public comment(input: any): iAssertion {
    this._context.comment(input);
    return this;
  }

  /**
   * Save this assertion's value to the scenario context
   *
   * @param aliasName
   * @returns
   */
  public as(aliasName: string): iAssertion {
    this._context.set(aliasName, this._input);
    return this;
  }

  public execute(
    bool: boolean,
    actualValue: any,
    highlightText: string | null = null,
    expectedValue?: string
  ): iAssertion {
    // Result is immutable, so only let them assert once
    if (this.isFinalized) {
      throw new Error("Assertion result is immutable.");
    }
    // Evalulate assertion
    this._statement = this._not ? !bool : bool;
    // Passed
    if (this._statement) {
      this._result = this._context.logPassing(this._getMessage());
    }
    // Failed
    else {
      this._result = this._optional
        ? this._context.logOptionalFailure(
            this._getMessage(),
            this._getErrorDetails(actualValue, expectedValue)
          )
        : this._context.logFailure(
            this._getMessage(),
            this._getErrorDetails(actualValue, expectedValue),
            this._getSourceCode(),
            this._getHighlightText(actualValue, highlightText)
          );
    }
    // Log this result
    //this._context.scenario.result(this._result);
    this._assertionMade = true;
    this._finishedResolver(this._result);
    return this;
  }

  public setDefaultMessage(message: string): iAssertion {
    this._defaultMessages[1] = message;
    return this;
  }

  public setDefaultNotMessage(message: string): iAssertion {
    this._defaultMessages[0] = message;
    return this;
  }

  public setDefaultMessages(
    notMessage: string,
    standardMessage: string
  ): iAssertion {
    this._defaultMessages[0] = notMessage;
    this._defaultMessages[1] = standardMessage;
    return this;
  }

  public sort(compareFunc?: CompareCallback): iAssertion {
    const values: any[] = Array.isArray(this.value)
      ? this.value.sort(compareFunc)
      : isNullOrUndefined(this.value)
      ? []
      : Object.values(this.value).sort(compareFunc);
    return this._clone(values, `Sorted values of ${this.subject}`);
  }

  private _mustBeArray(value: unknown): boolean {
    if (!Array.isArray(value)) {
      throw new Error("Input value must be an array.");
    }
    return true;
  }

  private _executeSchema(
    thisValue: any,
    schema: Schema,
    schemaType: AssertSchemaType
  ) {
    const errors = validateSchema(thisValue, schema, schemaType);
    this.setDefaultMessages(
      `${this.subject} does not match schema`,
      `${this.subject} matches schema`
    );
    return this.execute(errors.length == 0, errors.join(". "));
  }

  private _getMessage(): string {
    return this._message
      ? this._message
      : this._not
      ? this._defaultMessages[0]
      : this._defaultMessages[1];
  }

  private _getSourceCode(): string {
    let source: string =
      this._input && this._input.sourceCode ? this._input.sourceCode : "";
    // Limit long source code output
    if (source.length > 500) {
      source = source.substring(0, 500);
    }
    return source;
  }

  private _getHighlightText(
    actualValue: any,
    highlightText: string | null
  ): string {
    return highlightText
      ? highlightText
      : this._input && this._input.highlight
      ? this._input.highlight
      : String(actualValue);
  }

  private _getErrorDetails(actualValue: any, expectedValue?: string): string[] {
    return [
      `Actual: ${String(actualValue)}`,
      expectedValue ? `Expected: ${expectedValue}` : "",
    ].filter((str) => str.length > 0);
  }

  private _getValues(thatValue: any) {
    return {
      thisValue: this.value,
      thatValue: this._getCompareValue(thatValue),
    };
  }

  private _getCompareValue(value: any): any {
    this._assertionMade = true;
    return value?.isFlagpoleValue ? value.$ : value;
  }

  private _getName(value: any): any {
    if (value && value["path"]) {
      return value["tagName"]
        ? `<${value["tagName"]}> @ ${value.path}`
        : value.path;
    }
    return (
      this._input?.toString ? this._input.toString() : String(this._input)
    ).substr(0, 255);
  }

  protected async _is(method: string, item?: any): Promise<boolean> {
    item = this._thisOrThat(item);
    if (Array.isArray(item)) {
      return asyncEvery(item, async (e: any) => {
        const is = await this._is(method, e);
        return is;
      });
    }
    return item?.isFlagpoleValue ? await item[method]() : false;
  }

  protected async _hasKeyValue(
    method: string,
    key: string,
    value?: any,
    item?: any
  ): Promise<boolean> {
    item = this._thisOrThat(item);
    // Recursion
    if (Array.isArray(item)) {
      return asyncEvery(
        item,
        async (e: any) => await this._hasKeyValue(method, key, value, e)
      );
    }
    // Evaluate
    return item?.isFlagpoleValue
      ? await item[method](key, value)
      : value === undefined
      ? item[key] !== undefined && item[key] !== null
      : item[key] == value;
  }

  /**
   *  If we provided an item, eval that, otherwise use our assertion input
   *
   * @param item
   * @returns
   */
  private _thisOrThat(item: any) {
    return item === undefined ? this._input : item;
  }

  protected async _hasValue(
    method: string,
    value?: any,
    item?: any
  ): Promise<boolean> {
    item = this._thisOrThat(item);
    // Recursion
    if (Array.isArray(item)) {
      return asyncEvery(
        item,
        async (e: any) => await this._hasValue(method, value, e)
      );
    }
    // Evaluate
    return item?.isFlagpoleValue
      ? await item[method](value)
      : value === undefined
      ? item !== undefined && item !== null
      : item == value;
  }

  /**
   * Resolve this assertion and make a new copy of it
   *
   * @param value
   * @param name
   * @returns
   */
  protected _clone(value: any, name: string): Assertion {
    // If no assertion statement was made, skip it by marking it resolved
    if (this._statement === null) {
      this._statement = false;
      this._finishedResolver(null);
    }
    // Create new assertion
    const assertion: Assertion = new Assertion(
      this._context,
      new Value(value, this._context, name),
      this._message
    );
    this._not && assertion.not;
    this._optional && assertion.optional;
    return assertion;
  }
}
