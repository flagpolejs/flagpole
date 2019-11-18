import { Value } from "./value";
import {
  AssertionResult,
  AssertionFail,
  AssertionFailOptional,
  AssertionPass
} from "./logging/assertionresult";
import { AssertionSchema, iAjvLike } from "./assertionschema";
import * as Ajv from "ajv";
import { iAssertionContext, iAssertion } from "./interfaces";
import { toType } from "./util";
import { isNullOrUndefined } from "util";

export class Assertion implements iAssertion {
  /**
   * Creates a new assertion with the same value and settings, just no result
   */
  public get and(): Assertion {
    // If no assertion statement was made, skip it by marking it resolved
    this._resolveAssertion();
    // Create new assertion
    const assertion: Assertion = new Assertion(
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
  public get type(): Assertion {
    // If no assertion statement was made, skip it by marking it resolved
    this._resolveAssertion();
    // Generate type value object
    const type: Value = new Value(
      toType(this._getCompareValue(this._input)),
      this._context,
      `Type of ${this._getSubject()}`
    );
    // Generate new assertion
    const assertion: Assertion = new Assertion(
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
  public get length(): Assertion {
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

  /**
   * Flips the expected assertion evaluation
   */
  public get not(): Assertion {
    this._not = true;
    return this;
  }

  /**
   * Marks this assertion optional if it fails
   */
  public get optional(): Assertion {
    this._optional = true;
    return this;
  }

  public get result(): Promise<AssertionResult | null> {
    return this._finishedPromise;
  }

  public get assertionMade(): boolean {
    return this._assertionMade || this._finishedPromise.isResolved();
  }

  public get name(): string {
    return this._message || String(this._input);
  }

  private _context: iAssertionContext;
  private _ajv: any;
  private _input: any;
  private _message: string | null;
  private _not: boolean = false;
  private _optional: boolean = false;
  private _result: AssertionResult | null = null;
  private _finishedPromise: Promise<AssertionResult | null>;
  private _finishedResolver: Function = () => {};
  private _statement: boolean | null = null;
  private _assertionMade: boolean = false;

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
    this._finishedPromise = new Promise(resolve => {
      this._finishedResolver = resolve;
    });
  }

  public exactly(value: any): Assertion {
    const thisValue = this._getCompareValue(this._input);
    const thatValue = this._getCompareValue(value);
    const bool: boolean = this._eval(thisValue === thatValue);
    this._assert(
      bool,
      this._not
        ? `${this._getSubject()} is not exactly ${thatValue}`
        : `${this._getSubject()} is exactly ${thatValue}`,
      thatValue
    );
    return this;
  }

  public equals(value: any): Assertion {
    const thisValue = this._getCompareValue(this._input);
    const thatValue = this._getCompareValue(value);
    const bool: boolean = this._eval(thisValue == thatValue);
    this._assert(
      bool,
      this._not
        ? `${this._getSubject()} does not equal ${thatValue}`
        : `${this._getSubject()} equals ${thatValue}`,
      thisValue
    );
    return this;
  }

  public like(value: any): Assertion {
    const thisVal: any = String(this._getCompareValue(this._input))
      .toLowerCase()
      .trim();
    const thatVal: any = String(this._getCompareValue(value))
      .toLowerCase()
      .trim();
    const bool: boolean = this._eval(thisVal == thatVal);
    this._assert(
      bool,
      this._not
        ? `${this._getSubject()} is not like ${thatVal}`
        : `${this._getSubject()} is like ${thatVal}`,
      thisVal
    );
    return this;
  }

  public greaterThan(value: any): Assertion {
    const thisValue = this._getCompareValue(this._input);
    const thatValue = this._getCompareValue(value);
    const bool: boolean = this._eval(
      parseFloat(thisValue) > parseFloat(thatValue)
    );
    this._assert(
      bool,
      this._not
        ? `${this._getSubject()} is not greater than ${thatValue}`
        : `${this._getSubject()} is greater than ${thatValue}`,
      thisValue
    );
    return this;
  }

  public greaterThanOrEquals(value: any): Assertion {
    const thisValue = this._getCompareValue(this._input);
    const thatValue = this._getCompareValue(value);
    const bool: boolean = this._eval(
      parseFloat(thisValue) >= parseFloat(thatValue)
    );
    this._assert(
      bool,
      this._not
        ? `${this._getSubject()} is not greater than or equal to ${thatValue}`
        : `${this._getSubject()} is greater than or equal to ${thatValue}`,
      thisValue
    );
    return this;
  }

  public lessThan(value: any): Assertion {
    const thisValue = this._getCompareValue(this._input);
    const thatValue = this._getCompareValue(value);
    const bool: boolean = this._eval(
      parseFloat(thisValue) < parseFloat(thatValue)
    );
    this._assert(
      bool,
      this._not
        ? `${this._getSubject()} is not less than ${thatValue}`
        : `${this._getSubject()} is less than ${thatValue}`,
      thisValue
    );
    return this;
  }

  public lessThanOrEquals(value: any): Assertion {
    const thisValue = this._getCompareValue(this._input);
    const thatValue = this._getCompareValue(value);
    const bool: boolean = this._eval(
      parseFloat(thisValue) <= parseFloat(thatValue)
    );
    this._assert(
      bool,
      this._not
        ? `${this._getSubject()} is not less than or equal to ${thatValue}`
        : `${this._getSubject()} is less than or equal to ${thatValue}`,
      thisValue
    );
    return this;
  }

  public between(min: any, max: any): Assertion {
    const thisValue = this._getCompareValue(this._input);
    const thatMin: number = parseFloat(this._getCompareValue(min));
    const thatMax: number = parseFloat(this._getCompareValue(max));
    const bool: boolean = this._eval(
      parseFloat(thisValue) >= thatMin && parseFloat(thisValue) <= thatMax
    );
    this._assert(
      bool,
      this._not
        ? `${this._getSubject()} is not between ${min} and ${max}`
        : `${this._getSubject()} is between ${min} and ${max}`,
      thisValue
    );
    return this;
  }

  public matches(value: any): Assertion {
    const thisValue = this._getCompareValue(this._input);
    const thatValue = this._getCompareValue(value);
    const pattern = toType(value) == "regexp" ? thatValue : new RegExp(value);
    const bool: boolean = this._eval(pattern.test(thisValue));
    this._assert(
      bool,
      this._not
        ? `${this._getSubject()} does not match ${String(pattern)}`
        : `${this._getSubject()} matches ${String(pattern)}`,
      thisValue
    );
    return this;
  }

  public contains(value: any): Assertion {
    let bool: boolean = false;
    const thisValue = this._getCompareValue(this._input);
    const thatValue = this._getCompareValue(value);
    if (isNullOrUndefined(this._input)) {
      bool = this._eval(thisValue === thatValue);
    } else if (toType(this._input) == "array") {
      bool = this._eval(thisValue.indexOf(thatValue) >= 0);
    } else if (toType(this._input) == "object") {
      bool = this._eval(typeof this._input[thatValue] !== "undefined");
    } else {
      bool = this._eval(String(this._input).indexOf(thatValue) >= 0);
    }
    this._assert(
      bool,
      this._not
        ? `${this._getSubject()} does not contain ${thatValue}`
        : `${this._getSubject()} contains ${thatValue}`,
      thisValue
    );
    return this;
  }

  public startsWith(value: any): Assertion {
    let bool: boolean = false;
    const thisValue = this._getCompareValue(this._input);
    const thatValue = this._getCompareValue(value);
    if (toType(thisValue) == "array") {
      bool = this._eval(thisValue[0] == value);
    }
    if (!isNullOrUndefined(thisValue)) {
      bool = this._eval(String(thisValue).indexOf(thatValue) === 0);
    }
    this._assert(
      bool,
      this._not
        ? `${this._getSubject()} does not start with ${thatValue}`
        : `${this._getSubject()} starts with ${thatValue}`,
      String(thisValue)
    );
    return this;
  }

  public endsWith(value: any): Assertion {
    let bool: boolean = false;
    const thisValue = this._getCompareValue(this._input);
    const thatValue = this._getCompareValue(value);
    if (toType(thisValue) == "array") {
      bool = this._eval(thisValue[thisValue.length - 1] == thatValue);
    }
    if (!isNullOrUndefined(thisValue)) {
      bool = this._eval(
        String(thisValue).substr(
          0,
          String(thisValue).length - String(thatValue).length
        ) == thatValue
      );
    }
    this._assert(
      bool,
      this._not
        ? `${this._getSubject()} does not end with ${thatValue}`
        : `${this._getSubject()} ends with ${thatValue}`,
      String(this._input)
    );
    return this;
  }

  public in(values: any[]): Assertion {
    const thisValue = this._getCompareValue(this._input);
    let bool: boolean = this._eval(values.indexOf(thisValue) >= 0);
    this._assert(
      bool,
      this._not
        ? `${this._getSubject()} is not in list: ${values.join(", ")}`
        : `${this._getSubject()} is in list: ${values.join(", ")}`,
      thisValue
    );
    return this;
  }

  public includes(value: any): Assertion {
    const thisValue = this._getCompareValue(this._input);
    const thatValue = String(this._getCompareValue(value));
    let bool: boolean = this._eval(
      thisValue && thisValue.indexOf && thisValue.indexOf(thatValue) >= 0
    );
    this._assert(
      bool,
      this._not
        ? `${this._getSubject()} does not include ${thatValue}`
        : `${this._getSubject()} includes ${thatValue}`,
      thisValue
    );
    return this;
  }

  public exists(): Assertion {
    const thisValue = this._getCompareValue(this._input);
    const bool: boolean = this._eval(!isNullOrUndefined(thisValue));
    this._assert(
      bool,
      this._not
        ? `${this._getSubject()} does not exist`
        : `${this._getSubject()} exists`,
      thisValue
    );
    return this;
  }

  public resolves(continueOnReject: boolean = false): Promise<Assertion> {
    const assertion: Assertion = this;
    const thisValue = this._getCompareValue(this._input);
    return new Promise((resolve, reject) => {
      const result = (bool: boolean) => {
        this._assert(
          this._eval(bool),
          this._not
            ? `${this._getSubject()} was not resolved`
            : `${this._getSubject()} was resolved`,
          bool
        );
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
    const assertion: Assertion = this;
    const thisValue = this._getCompareValue(this._input);
    return new Promise((resolve, reject) => {
      const result = (bool: boolean) => {
        this._assert(
          this._eval(bool),
          this._not
            ? `${this._getSubject()} was not rejected`
            : `${this._getSubject()} was rejected`,
          bool
        );
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

  public none(callback: Function): Assertion {
    let bool: boolean = false;
    const thisValue = this._getCompareValue(this._input);
    if (toType(thisValue) == "array") {
      const arr: Array<any> = thisValue;
      bool = arr.every((value: any, index: number, array: any[]) => {
        return !callback(value, index, array);
      });
    }
    this._assert(
      this._eval(bool),
      this._not
        ? `${this._getSubject()} some were true`
        : `${this._getSubject()} none were true`,
      thisValue
    );
    return this;
  }

  public every(callback: Function): Assertion {
    let bool: boolean = false;
    const thisValue = this._getCompareValue(this._input);
    if (toType(thisValue) == "array") {
      const arr: Array<any> = thisValue;
      bool = arr.every((value: any, index: number, array: any[]) => {
        return callback(value, index, array);
      });
    }
    this._assert(
      this._eval(bool),
      this._not
        ? `${this._getSubject()} not all were true`
        : `${this._getSubject()} all were true`,
      thisValue
    );
    return this;
  }

  public some(callback: Function): Assertion {
    let bool: boolean = false;
    const thisValue = this._getCompareValue(this._input);
    if (toType(thisValue) == "array") {
      const arr: Array<any> = thisValue;
      bool = arr.some((value: any, index: number, array: any[]) => {
        return callback(value, index, array);
      });
    }
    this._assert(
      this._eval(bool),
      this._not
        ? `${this._getSubject()} none were true`
        : `${this._getSubject()} some were true`,
      thisValue
    );
    return this;
  }

  public async schema(
    schema: any,
    simple: boolean = false
  ): Promise<Assertion> {
    const validator = simple
      ? new AssertionSchema()
      : await this._loadSchemaValidator();
    const isValid: boolean = await validator.validate(
      schema,
      this._getCompareValue(this._input)
    );
    const errors: Error[] | Ajv.ErrorObject[] | null | undefined =
      validator.errors;
    let error: string = "";
    if (typeof errors != "undefined" && errors !== null) {
      errors.forEach((err: Error | Ajv.ErrorObject) => {
        error += err.message + " ";
      });
    }
    return this._assert(
      this._eval(isValid),
      this._not
        ? `${this._getSubject()} does not match schema`
        : `${this._getSubject()} matches schema`,
      error
    );
  }

  /**
   * Create a new assertion on the AssertionContext, allows chaining
   *
   * @param message
   * @param value
   */
  public assert(message: string, value: any): Assertion;
  public assert(value: any): Assertion;
  public assert(a: any, b?: any): iAssertion {
    return this._context.assert(a, b);
  }

  private async _loadSchemaValidator(): Promise<iAjvLike> {
    // We haven't tried to load query engines yet
    if (typeof this._ajv == "undefined") {
      // Try importing jmespath
      return (
        import("ajv")
          // Got it, so save it and return it
          .then(ajv => {
            this._ajv = new Ajv();
            return this._ajv;
          })
          // Couldn't load jmespath, so set it to null
          .catch(e => {
            this._ajv = new AssertionSchema();
            return this._ajv;
          })
      );
    } else {
      return this._ajv;
    }
  }

  private async _assert(
    statement: boolean,
    defaultMessage: string,
    actualValue: any
  ): Promise<Assertion> {
    // Result is immutable, so only let them assert once
    if (this._result !== null || this._statement !== null) {
      throw new Error("Assertion result is immutable.");
    }
    this._statement = statement;
    const message: string = this._message || defaultMessage;
    // Assertion passes
    if (!!statement) {
      this._result = new AssertionPass(message);
    }
    // Assertion fails
    else {
      const source: string =
        this._input && this._input.sourceCode ? this._input.sourceCode : "";
      const highlight: string =
        this._input && this._input.highlight
          ? this._input.highlight
          : String(actualValue);
      let details: string = `Actual value: ${String(actualValue)}`;
      this._result = this._optional
        ? new AssertionFailOptional(message, details)
        : new AssertionFail(message, details, source, highlight);
    }
    // Log this result
    this._context.scenario.result(this._result);
    this._finishedResolver(this._result);
    return this;
  }

  private _getCompareValue(value: any): any {
    this._assertionMade = true;
    if (toType(value) == "value") {
      return value.$;
    } else {
      return value;
    }
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

  private _eval(bool: boolean): boolean {
    this._not && (bool = !bool);
    return bool;
  }

  private _resolveAssertion() {
    if (this._statement === null) {
      this._statement = false;
      this._finishedResolver(null);
    }
  }
}
