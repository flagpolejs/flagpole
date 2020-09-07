import { Value } from "./value";
import { AssertionSchema, getSchema, writeSchema } from "./assertionschema";
import {
  iAssertionContext,
  iAssertion,
  iAssertionResult,
  IteratorCallback,
  iAjvLike,
  iAjvErrorObject,
  JsonSchema,
  iValue,
} from "./interfaces";
import {
  toType,
  isNullOrUndefined,
  asyncEvery,
  asyncNone,
  asyncSome,
  isAsyncCallback,
  isArray,
  asyncMap,
} from "./util";
import { ImageCompare } from "./imagecompare";
import { EvaluateFn, SerializableOrJSHandle } from "puppeteer-core";

export class Assertion implements iAssertion {
  /**
   * Creates a new assertion with the same value and settings, just no result
   */
  public get and(): iAssertion {
    // If no assertion statement was made, skip it by marking it resolved
    this._resolveAssertion();
    // Create new assertion
    const assertion: iAssertion = new Assertion(
      this._context,
      this._input,
      this._message ? `&& ${this._message}` : null
    );
    this._not && assertion.not;
    this._optional && assertion.optional;
    return assertion;
  }

  /**
   * Creates a new assertion with the type of this one
   */
  public get type(): iAssertion {
    // If no assertion statement was made, skip it by marking it resolved
    this._resolveAssertion();
    // Generate type value object
    const type: Value = new Value(
      toType(this._getCompareValue(this._input)),
      this._context,
      `Type of ${this._getSubject()}`
    );
    // Generate new assertion
    const assertion: iAssertion = new Assertion(
      this._context,
      type,
      this._message
    );
    this._not && assertion.not;
    this._optional && assertion.optional;
    return assertion;
  }

  /**
   * Creates a new assertion with the lengh of this one
   */
  public get length(): iAssertion {
    // If no assertion statement was made, skip it by marking it resolved
    this._resolveAssertion();
    // Generate length Value object
    const length: number = (() => {
      const thisValue: any = this._getCompareValue(this._input);
      return thisValue && thisValue.length ? thisValue.length : 0;
    })();
    // Create new assertion
    const assertion: Assertion = new Assertion(
      this._context,
      new Value(length, this._context, `Length of ${this._getSubject()}`),
      this._message
    );
    this._not && assertion.not;
    this._optional && assertion.optional;
    return assertion;
  }

  public get trim(): iAssertion {
    // If no assertion statement was made, skip it by marking it resolved
    this._resolveAssertion();
    // Generate length Value object
    const trimmedValue: string = (() => {
      const thisValue: any = String(this._getCompareValue(this._input));
      return thisValue.trim();
    })();
    // Create new assertion
    const assertion: Assertion = new Assertion(
      this._context,
      new Value(trimmedValue, this._context, `Trim of ${this._getSubject()}`),
      this._message
    );
    this._not && assertion.not;
    this._optional && assertion.optional;
    return assertion;
  }

  /**
   * Creates a new assertion with the keys of the object as the value
   */
  public get keys(): iAssertion {
    // If no assertion statement was made, skip it by marking it resolved
    this._resolveAssertion();
    // Get keys
    const keys: string[] = (() => {
      const thisValue: any = this._getCompareValue(this._input);
      return isNullOrUndefined(thisValue) ? [] : Object.keys(thisValue);
    })();
    // Create new assertion
    const assertion: Assertion = new Assertion(
      this._context,
      new Value(keys, this._context, `Keys of ${this._getSubject()}`),
      this._message
    );
    this._not && assertion.not;
    this._optional && assertion.optional;
    return assertion;
  }

  /**
   * Creates a new assertion with the values of the object as the value
   */
  public get values(): iAssertion {
    // If no assertion statement was made, skip it by marking it resolved
    this._resolveAssertion();
    // Get values
    const values: any[] = (() => {
      const thisValue: any = this._getCompareValue(this._input);
      return isNullOrUndefined(thisValue) ? [] : Object.values(thisValue);
    })();
    // Create new assertion
    const assertion: Assertion = new Assertion(
      this._context,
      new Value(values, this._context, `Values of ${this._getSubject()}`),
      this._message
    );
    this._not && assertion.not;
    this._optional && assertion.optional;
    return assertion;
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
  private _ajv: any;
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
    this._setDefaultMessages(
      `${this._getSubject()} is not visible`,
      `${this._getSubject()} is visible`
    );
    return this._evalulate(is, is);
  }

  public async hidden(): Promise<iAssertion> {
    const is = await this._is("isHidden");
    this._setDefaultMessages(
      `${this._getSubject()} is not hidden`,
      `${this._getSubject()} is hidden`
    );
    return this._evalulate(is, is);
  }

  public async hasValue(value: any): Promise<iAssertion> {
    const hasValue = await this._hasValue("hasValue", value);
    const thatValue = this._getCompareValue(value);
    this._setDefaultMessages(
      `${this._getSubject()} does not have value ${thatValue}`,
      `${this._getSubject()} has value ${thatValue}`
    );
    return this._evalulate(hasValue, hasValue);
  }

  public async hasProperty(key: string, value?: string): Promise<iAssertion> {
    const hasKey = await this._hasKeyValue("hasProperty", key, value);
    this._setDefaultMessages(
      `${this._getSubject()} does not have property ${key}`,
      `${this._getSubject()} has property ${key}`
    );
    return this._evalulate(hasKey, hasKey);
  }

  public async hasAttribute(key: string, value?: string): Promise<iAssertion> {
    const hasKey = await this._hasKeyValue("hasAttribute", key, value);
    this._setDefaultMessages(
      `${this._getSubject()} does not have attribute ${key}`,
      `${this._getSubject()} has attribute ${key}`
    );
    return this._evalulate(hasKey, hasKey);
  }

  public async hasClassName(key: string, value?: string): Promise<iAssertion> {
    const hasKey = await this._hasKeyValue("hasClassName", key, value);
    this._setDefaultMessages(
      `${this._getSubject()} does not have class named ${key}`,
      `${this._getSubject()} has class named ${key}`
    );
    return this._evalulate(hasKey, hasKey);
  }

  public async hasData(key: string, value?: string): Promise<iAssertion> {
    const hasKey = await this._hasKeyValue("hasData", key, value);
    this._setDefaultMessages(
      `${this._getSubject()} does not have data ${key}`,
      `${this._getSubject()} has data ${key}`
    );
    return this._evalulate(hasKey, hasKey);
  }

  public async hasText(text: string): Promise<iAssertion> {
    const hasValue = await this._hasValue("hasText", text);
    this._setDefaultMessages(
      `${this._getSubject()} does not have text "${text}"`,
      `${this._getSubject()} has text "${text}"`
    );
    return this._evalulate(hasValue, hasValue);
  }

  public async hasTag(tagName?: string): Promise<iAssertion> {
    const hasValue = await this._hasValue("hasTag", tagName);
    tagName
      ? this._setDefaultMessages(
          `${this._getSubject()} is not <${tagName}>`,
          `${this._getSubject()} is <${tagName}>`
        )
      : this._setDefaultMessages(
          `${this._getSubject()} is not a tag`,
          `${this._getSubject()} is a tag`
        );
    return this._evalulate(hasValue, this._input.tagName || "Not a tag");
  }

  public exactly(value: any): iAssertion {
    const thisValue = this._getCompareValue(this._input);
    const thatValue = this._getCompareValue(value);
    this._setDefaultMessages(
      `${this._getSubject()} is not exactly ${thatValue}`,
      `${this._getSubject()} is exactly ${thatValue}`
    );
    return this._evalulate(thisValue === thatValue, thisValue);
  }

  public equals(value: any): iAssertion {
    const thisValue = this._getCompareValue(this._input);
    const thatValue = this._getCompareValue(value);
    this._setDefaultMessages(
      `${this._getSubject()} does not equal ${thatValue}`,
      `${this._getSubject()} equals ${thatValue}`
    );
    return this._evalulate(thisValue == thatValue, thisValue);
  }

  public like(value: any): iAssertion {
    const thisValue: any = String(this._getCompareValue(this._input))
      .toLowerCase()
      .trim();
    const thatValue: any = String(this._getCompareValue(value))
      .toLowerCase()
      .trim();
    this._setDefaultMessages(
      `${this._getSubject()} is not like ${thatValue}`,
      `${this._getSubject()} is like ${thatValue}`
    );
    return this._evalulate(thisValue == thatValue, thisValue);
  }

  public greaterThan(value: any): iAssertion {
    const thisValue = this._getCompareValue(this._input);
    const thatValue = this._getCompareValue(value);
    this._setDefaultMessages(
      `${this._getSubject()} is not greater than ${thatValue}`,
      `${this._getSubject()} is greater than ${thatValue}`
    );
    return this._evalulate(
      parseFloat(thisValue) > parseFloat(thatValue),
      thisValue
    );
  }

  public greaterThanOrEquals(value: any): iAssertion {
    const thisValue = this._getCompareValue(this._input);
    const thatValue = this._getCompareValue(value);
    this._setDefaultMessages(
      `${this._getSubject()} is not greater than or equal to ${thatValue}`,
      `${this._getSubject()} is greater than or equal to ${thatValue}`
    );
    return this._evalulate(
      parseFloat(thisValue) >= parseFloat(thatValue),
      thisValue
    );
  }

  public lessThan(value: any): iAssertion {
    const thisValue = this._getCompareValue(this._input);
    const thatValue = this._getCompareValue(value);
    this._setDefaultMessages(
      `${this._getSubject()} is not less than ${thatValue}`,
      `${this._getSubject()} is less than ${thatValue}`
    );
    return this._evalulate(
      parseFloat(thisValue) < parseFloat(thatValue),
      thisValue
    );
  }

  public lessThanOrEquals(value: any): iAssertion {
    const thisValue = this._getCompareValue(this._input);
    const thatValue = this._getCompareValue(value);
    this._setDefaultMessages(
      `${this._getSubject()} is not less than or equal to ${thatValue}`,
      `${this._getSubject()} is less than or equal to ${thatValue}`
    );
    return this._evalulate(
      parseFloat(thisValue) <= parseFloat(thatValue),
      thisValue
    );
  }

  public between(min: any, max: any): iAssertion {
    const thisValue = this._getCompareValue(this._input);
    const thatMin: number = parseFloat(this._getCompareValue(min));
    const thatMax: number = parseFloat(this._getCompareValue(max));
    this._setDefaultMessages(
      `${this._getSubject()} is not between ${min} and ${max}`,
      `${this._getSubject()} is between ${min} and ${max}`
    );
    return this._evalulate(
      parseFloat(thisValue) >= thatMin && parseFloat(thisValue) <= thatMax,
      thisValue
    );
  }

  public matches(value: any): iAssertion {
    const thisValue = this._getCompareValue(this._input);
    const thatValue = this._getCompareValue(value);
    const pattern = toType(value) == "regexp" ? thatValue : new RegExp(value);
    this._setDefaultMessages(
      `${this._getSubject()} does not match ${String(pattern)}`,
      `${this._getSubject()} matches ${String(pattern)}`
    );
    return this._evalulate(pattern.test(thisValue), thisValue);
  }

  public contains(value: any): iAssertion {
    const thisValue = this._getCompareValue(this._input);
    const thatValue = this._getCompareValue(value);
    const bool: boolean = (() => {
      if (isNullOrUndefined(this._input)) {
        return thisValue === thatValue;
      } else if (toType(this._input) == "array") {
        return thisValue.indexOf(thatValue) >= 0;
      } else if (toType(this._input) == "object") {
        return typeof this._input[thatValue] !== "undefined";
      } else {
        return String(this._input).indexOf(thatValue) >= 0;
      }
    })();
    this._setDefaultMessages(
      `${this._getSubject()} does not contain ${thatValue}`,
      `${this._getSubject()} contains ${thatValue}`
    );
    return this._evalulate(bool, thisValue);
  }

  public looksLike(imageData: Buffer): iAssertion;
  public looksLike(imageLocalPath: string): iAssertion;
  public looksLike(imageData: Buffer, threshold: number): iAssertion;
  public looksLike(imageLocalPath: string, threshold: number): iAssertion;
  public looksLike(imageData: Buffer, thresholdPercent: string): iAssertion;
  public looksLike(
    imageLocalPath: string,
    thresholdPercent: string
  ): iAssertion;
  public looksLike(
    controlImage: string | Buffer,
    allowedDifference: number | string = 0
  ): iAssertion {
    this._setDefaultMessages(`Images do not match.`, `Images match.`);
    let assertionPassed: boolean = false;
    let details: string = "";
    const imageCompare = new ImageCompare(
      this._context,
      this._getCompareValue(this._input),
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
      details = err;
    }
    return this._evalulate(assertionPassed, details);
  }

  public startsWith(value: any): iAssertion {
    const thisValue = this._getCompareValue(this._input);
    const thatValue = this._getCompareValue(value);
    const bool: boolean = (() => {
      if (toType(thisValue) == "array") {
        return thisValue[0] == value;
      }
      if (!isNullOrUndefined(thisValue)) {
        return String(thisValue).indexOf(thatValue) === 0;
      }
      return false;
    })();
    this._setDefaultMessages(
      `${this._getSubject()} does not start with ${thatValue}`,
      `${this._getSubject()} starts with ${thatValue}`
    );
    return this._evalulate(bool, String(thisValue));
  }

  public endsWith(value: any): iAssertion {
    const thisValue = this._getCompareValue(this._input);
    const thatValue = this._getCompareValue(value);
    const bool: boolean = (() => {
      if (toType(thisValue) == "array") {
        return thisValue[thisValue.length - 1] == thatValue;
      }
      if (!isNullOrUndefined(thisValue)) {
        return (
          String(thisValue).substr(
            0,
            String(thisValue).length - String(thatValue).length
          ) == thatValue
        );
      }
      return false;
    })();
    this._setDefaultMessages(
      `${this._getSubject()} does not end with ${thatValue}`,
      `${this._getSubject()} ends with ${thatValue}`
    );
    return this._evalulate(bool, String(this._input));
  }

  public in(values: any[]): iAssertion {
    const thisValue = this._getCompareValue(this._input);
    this._setDefaultMessages(
      `${this._getSubject()} is not in list: ${values.join(", ")}`,
      `${this._getSubject()} is in list: ${values.join(", ")}`
    );
    return this._evalulate(values.indexOf(thisValue) >= 0, thisValue);
  }

  public includes(value: any): iAssertion {
    const thisValue = this._getCompareValue(this._input);
    const thatValue = String(this._getCompareValue(value));
    const bool: boolean = (() => {
      if (thisValue && thisValue.indexOf) {
        return thisValue.indexOf(thatValue) >= 0;
      }
      return false;
    })();
    this._setDefaultMessages(
      `${this._getSubject()} does not include ${thatValue}`,
      `${this._getSubject()} includes ${thatValue}`
    );
    return this._evalulate(bool, thisValue);
  }

  public exists(): iAssertion {
    const thisValue = this._getCompareValue(this._input);
    this._setDefaultMessages(
      `${this._getSubject()} does not exist`,
      `${this._getSubject()} exists`
    );
    return this._evalulate(
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
    const thisValue = this._getCompareValue(this._input);
    this._setDefaultMessages(
      `${this._getSubject()} was not resolved`,
      `${this._getSubject()} was resolved`
    );
    return new Promise((resolve, reject) => {
      const result = (bool: boolean) => {
        const assertion = this._evalulate(bool, bool);
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
    const thisValue = this._getCompareValue(this._input);
    this._setDefaultMessages(
      `${this._getSubject()} was not rejected`,
      `${this._getSubject()} was rejected`
    );
    return new Promise((resolve, reject) => {
      const result = (bool: boolean) => {
        const assertion = this._evalulate(bool, bool);
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

  public none(callback: IteratorCallback): Promise<iAssertion> {
    const thisValue = this._getCompareValue(this._input);
    this._setDefaultMessages(
      `Some were true in ${this._getSubject()}`,
      `None were true in ${this._getSubject()}`
    );
    // This must be an array
    if (toType(thisValue) !== "array") {
      throw new Error("Input value must be an array.");
    }
    return new Promise(async (resolve) => {
      resolve(this._evalulate(await asyncNone(thisValue, callback), thisValue));
    });
  }

  public async eval(
    js: EvaluateFn<any>,
    ...args: SerializableOrJSHandle[]
  ): Promise<iAssertion> {
    const thisValue = this._getCompareValue(this._input);
    const result = await this.context.eval.apply(undefined, [
      js,
      thisValue,
      ...args,
    ]);
    this._setDefaultMessages(
      `Function evaluates false`,
      `Function evaluates true`
    );
    return this._evalulate(!!result, result);
  }

  public async evalEvery(
    js: EvaluateFn<any>,
    ...args: SerializableOrJSHandle[]
  ): Promise<iAssertion> {
    const thisValue = this._getCompareValue(this._input);
    // This must be an array
    if (toType(thisValue) !== "array") {
      throw new Error("Input value must be an array.");
    }
    this._setDefaultMessages(
      `Every function evaluates false`,
      `Every function evaluates true`
    );
    return new Promise(async (resolve) => {
      const result = await asyncEvery(thisValue, (item) => {
        const val = this._getCompareValue(item);
        return this.context.eval.apply(undefined, [js, val, ...args]);
      });
      resolve(this._evalulate(result, thisValue));
    });
  }

  public every(callback: IteratorCallback): Promise<iAssertion> {
    const thisValue = this._getCompareValue(this._input);
    this._setDefaultMessages(
      `Some or none were true in ${this._getSubject()}`,
      `All were true in ${this._getSubject()}`
    );
    // This must be an array
    if (toType(thisValue) !== "array") {
      throw new Error("Input value must be an array.");
    }
    return new Promise(async (resolve) => {
      resolve(
        this._evalulate(await asyncEvery(thisValue, callback), thisValue)
      );
    });
  }

  public everySync(callback: IteratorCallback): iAssertion {
    const thisValue = this._getCompareValue(this._input);
    this._setDefaultMessages(
      `Some or none were true in ${this._getSubject()}`,
      `All were true in ${this._getSubject()}`
    );
    // This must be an array
    if (toType(thisValue) !== "array") {
      throw new Error("Input value must be an array.");
    }
    return this._evalulate(
      thisValue.every((value: any, index: number, array: any[]) => {
        return callback(value, index, array);
      }),
      thisValue
    );
  }

  public async map(callback: IteratorCallback): Promise<iAssertion> {
    const thisValue = this._getCompareValue(this._input);
    // If no assertion statement was made, skip it by marking it resolved
    this._resolveAssertion();
    // Generate length Value object
    const newValue = await asyncMap(thisValue, callback);
    // Create new assertion
    const assertion: Assertion = new Assertion(
      this._context,
      new Value(newValue, this._context, `Mapped ${this._getSubject()}`),
      this._message
    );
    this._not && assertion.not;
    this._optional && assertion.optional;
    return assertion;
  }

  public some(callback: IteratorCallback): Promise<iAssertion> {
    const thisValue = this._getCompareValue(this._input);
    this._setDefaultMessages(
      `None were true in ${this._getSubject()}`,
      `Some were true in ${this._getSubject()}`
    );

    // This must be an array
    if (toType(thisValue) !== "array") {
      throw new Error("Input value must be an array.");
    }
    return new Promise(async (resolve) => {
      resolve(this._evalulate(await asyncSome(thisValue, callback), thisValue));
    });
  }

  schema(schemaName: string, simple?: boolean): Promise<iAssertion>;
  schema(schema: JsonSchema, simple?: boolean): Promise<iAssertion>;
  public async schema(
    schema: JsonSchema | string,
    simple: boolean = false
  ): Promise<iAssertion> {
    const thisValue = this._getCompareValue(this._input);
    if (typeof schema === "string") {
      const schemaName: string = schema;
      try {
        schema = getSchema(schemaName);
      } catch {
        this._context.comment(
          `Created new schema snapshot called ${schemaName}`
        );
        schema = writeSchema(thisValue, schemaName);
      }
    }
    const validator = simple
      ? new AssertionSchema()
      : await this._loadSchemaValidator();
    const isValid: boolean = await validator.validate(schema, thisValue);
    const errors: Error[] | iAjvErrorObject[] | null | undefined =
      validator.errors;
    let error: string = "";
    if (typeof errors != "undefined" && errors !== null) {
      errors.forEach((err: Error | iAjvErrorObject) => {
        error += err.message + " ";
      });
    }
    this._setDefaultMessages(
      `${this._getSubject()} does not match schema`,
      `${this._getSubject()} matches schema`
    );
    return this._evalulate(isValid, error);
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
    return this._context.assert(a, b);
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

  public as(aliasName: string): iAssertion {
    this._context.set(aliasName, this._input);
    return this;
  }

  private async _loadSchemaValidator(): Promise<iAjvLike> {
    // We haven't tried to load query engines yet
    if (typeof this._ajv == "undefined") {
      // Try importing ajv
      return import("ajv")
        .then((Ajv: any) => {
          this._ajv = new Ajv();
          return this._ajv;
        })
        .catch(() => {
          this._ajv = new AssertionSchema();
          return this._ajv;
        });
    } else {
      return this._ajv;
    }
  }

  private _returnsPromise(callback: Function, values: any[]): boolean {
    return (
      isAsyncCallback(callback) ||
      (values.length > 0 &&
        toType(callback(values[0], 0, values)) === "promise")
    );
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

  private _getActualValueText(actualValue: any): string {
    return `Actual value: ${String(actualValue)}`;
  }

  private _evalulate(
    bool: boolean,
    actualValue: any,
    highlightText: string | null = null
  ): iAssertion {
    // Result is immutable, so only let them assert once
    if (this.isFinalized) {
      throw new Error("Assertion result is immutable.");
    }
    // Evalulate assertion
    this._statement = this._not ? !bool : bool;
    // Passed
    if (!!this._statement) {
      this._result = this._context.logPassing(this._getMessage());
    }
    // Failed
    else {
      this._result = this._optional
        ? this._context.logOptionalFailure(
            this._getMessage(),
            this._getActualValueText(actualValue)
          )
        : this._context.logFailure(
            this._getMessage(),
            this._getActualValueText(actualValue),
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
    return this._input.toString().substr(0, 255);
  }

  private _getSubject(): string {
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

  private _resolveAssertion() {
    if (this._statement === null) {
      this._statement = false;
      this._finishedResolver(null);
    }
  }

  private _setDefaultMessages(standardMessage: string, notMessage?: string) {
    this._defaultMessages = [standardMessage, notMessage || standardMessage];
  }

  protected async _is(method: string, item?: any): Promise<boolean> {
    item = item === undefined ? this._input : item;
    if (isArray(item)) {
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
    // If we provided an item, eval that, otherwise use our assertion input
    item = item === undefined ? this._input : item;
    // Recursion
    if (isArray(item)) {
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

  protected async _hasValue(
    method: string,
    value?: any,
    item?: any
  ): Promise<boolean> {
    // If we provided an item, eval that, otherwise use our assertion input
    item = item === undefined ? this._input : item;
    // Recursion
    if (isArray(item)) {
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
}
