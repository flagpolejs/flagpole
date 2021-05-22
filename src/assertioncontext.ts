import { BrowserControl } from "./puppeteer/browsercontrol";
import {
  Page,
  EvaluateFn,
  SerializableOrJSHandle,
  PageFnOptions,
} from "puppeteer-core";
import { Assertion } from "./assertion";
import {
  iResponse,
  iValue,
  iAssertionContext,
  iScenario,
  iSuite,
  iAssertionResult,
  ScreenshotOpts,
  iAssertion,
  FindOptions,
  FindAllOptions,
  OptionalXY,
  iHttpRequest,
} from "./interfaces";
import {
  AssertionActionCompleted,
  AssertionActionFailed,
  AssertionFail,
  AssertionPass,
  AssertionFailOptional,
} from "./logging/assertionresult";
import {
  openInBrowser,
  asyncMap,
  asyncSome,
  asyncEvery,
  asyncFilter,
  asyncNone,
  asyncForEach,
  asyncForEachUntilFirst,
  arrayify,
  asyncMapToObject,
  flatten,
} from "./util";
import { FlagpoleExecution } from "./flagpoleexecution";
import { getFindParams, getFindName, wrapAsValue } from "./helpers";
import { ValuePromise } from "./value-promise";
import { HttpRequest } from "./httprequest";
import { SchemaValidator } from "./assertionschema";
import * as bluebird from "bluebird";

const getParamsFromExists = (
  a: string,
  b?: string | FindOptions | FindAllOptions | RegExp,
  c?: string | RegExp | FindOptions | FindAllOptions,
  d?: FindOptions | FindAllOptions
): {
  selector: string;
  message: string | null;
  matches: RegExp | null;
  contains: string | null;
  opts: FindOptions | FindAllOptions;
} => {
  const selector = typeof b === "string" ? b : a;
  const message = typeof b === "string" ? a : null;
  const matches = c instanceof RegExp ? c : b instanceof RegExp ? b : null;
  const contains = typeof c === "string" ? c : null;
  const opts = ((contains ? d : message ? c : b) || {}) as FindOptions;
  return {
    selector: selector,
    message: message,
    matches: matches,
    contains: contains,
    opts: opts,
  };
};

export class AssertionContext implements iAssertionContext {
  protected _scenario: iScenario;
  protected _response: iResponse;
  protected _assertions: Assertion[] = [];
  protected _subScenarios: Promise<any>[] = [];

  /**
   * Get returned value from previous next block
   */
  public result: any;

  public get request(): iHttpRequest {
    return this._scenario.request;
  }

  public get response(): iResponse {
    return this._response;
  }

  public get scenario(): iScenario {
    return this._scenario;
  }

  public get suite(): iSuite {
    return this._scenario.suite;
  }

  public get browserControl(): BrowserControl | null {
    return this.response.isBrowser ? this._scenario.browserControl : null;
  }

  public get executionOptions(): FlagpoleExecution {
    return FlagpoleExecution.global;
  }

  public get page(): Page | null {
    return this.browserControl !== null ? this.browserControl.page : null;
  }

  public get incompleteAssertions(): Assertion[] {
    const incompleteAssertions: Assertion[] = [];
    this._assertions.forEach((assertion) => {
      if (!assertion.assertionMade) {
        incompleteAssertions.push(assertion);
      }
    });
    return incompleteAssertions;
  }

  public get assertionsResolved(): Promise<(iAssertionResult | null)[]> {
    const promises: Promise<iAssertionResult | null>[] = [];
    this._assertions.forEach((assertion) => {
      if (assertion.assertionMade) {
        promises.push(assertion.result);
      }
    });
    return Promise.all(promises);
  }

  public get subScenariosResolved(): Promise<any[]> {
    return Promise.all(this._subScenarios);
  }

  constructor(scenario: iScenario, response: iResponse) {
    this._scenario = scenario;
    this._response = response;
  }

  /**
   * Make a comment in the scenario output
   *
   * @param input
   */
  public comment(input: any): iAssertionContext {
    this._scenario.comment(input);
    return this;
  }

  /**
   * Create a new assertion based on this value
   *
   * @param message
   * @param value
   */
  public assert(message: string, value: any): iAssertion;
  public assert(value: any): iAssertion;
  public assert(a: any, b?: any): iAssertion {
    const { value, message } =
      arguments.length === 2
        ? { value: b, message: a }
        : { value: a, message: undefined };
    const assertion = new Assertion(this, value, message);
    this._assertions.push(assertion);
    return assertion;
  }

  /**
   * Wait for this number of milliseconds
   *
   * @param milliseconds
   */
  public pause(milliseconds: number): Promise<any> {
    return new Promise((resolve) => {
      setTimeout(() => {
        this._completedAction("PAUSE", `${milliseconds}ms`);
        resolve();
      }, milliseconds);
    });
  }

  /**
   * Clear any current input and then type this into the input box
   *
   * @param selector
   * @param textToType
   * @param opts
   */
  public async clearThenType(
    selector: string,
    textToType: string,
    opts: any = {}
  ): Promise<any> {
    await this.clear(selector);
    return this.type(selector, textToType, opts);
  }

  /**
   * Clear any current input in this input box
   *
   * @param selector
   */
  public async clear(selector: string): Promise<void> {
    await this.response.clear(selector);
    this._completedAction("CLEAR", selector);
  }

  public async type(
    selector: string,
    textToType: string,
    opts: any = {}
  ): Promise<void> {
    await this.response.type(selector, textToType, opts);
    this._completedAction("TYPE", textToType);
  }

  /**
   * Select items from a dropdown or multi-select box
   *
   * @param selector
   * @param value
   */
  public async selectOption(
    selector: string,
    value: string | string[]
  ): Promise<void> {
    await this.response.selectOption(selector, value);
    this._completedAction(
      "SELECT",
      typeof value == "string" ? value : value.join(", ")
    );
  }

  /**
   * Execute this javascript against the response
   *
   * @param callback
   */
  public async eval(
    js: EvaluateFn<any>,
    ...args: SerializableOrJSHandle[]
  ): Promise<any> {
    return await this.response.eval.apply(this, [js, ...args]);
  }

  public async waitForFunction(
    js: EvaluateFn<any>,
    opts?: PageFnOptions,
    ...args: SerializableOrJSHandle[]
  ): Promise<void> {
    await this.response.waitForFunction.apply(this.response, [
      js,
      opts,
      ...args,
    ]);
    this._completedAction("WAIT", "Function to evaluate as true");
  }

  public async waitForReady(timeout: number = 15000): Promise<void> {
    await this.response.waitForReady(timeout);
    this._completedAction("WAIT", "Ready");
  }

  public async waitForLoad(timeout: number = 30000): Promise<void> {
    await this.response.waitForLoad(timeout);
    this._completedAction("WAIT", "Load");
  }

  public async waitForNetworkIdle(timeout: number = 10000): Promise<void> {
    await this.response.waitForNetworkIdle(timeout);
    this._completedAction("WAIT", "Network Idle");
  }

  public async waitForNavigation(
    timeout: number = 10000,
    waitFor?: string | string[]
  ): Promise<void> {
    await this.response.waitForNavigation(timeout, waitFor);
    this._completedAction("WAIT", "Navigation");
  }

  public async waitForXPath(xPath: string, timeout?: number): Promise<iValue> {
    const el: iValue = await this.response.waitForXPath(xPath, timeout);
    el.isNull()
      ? this._failedAction("XPATH", xPath)
      : this._completedAction("XPATH", xPath);
    return el;
  }

  /**
   * Wait for element at the selected path to be hidden
   *
   * @param selector
   * @param timeout
   */
  public async waitForHidden(
    selector: string,
    timeout: number = 100
  ): Promise<iValue> {
    const el: iValue = await this.response.waitForHidden(selector, timeout);
    el.isNull()
      ? this._failedAction("HIDDEN", selector)
      : this._completedAction("HIDDEN", selector);
    return el;
  }

  /**
   * Wait for element at the selected path to be visible
   *
   * @param selector
   * @param timeout
   */
  public async waitForVisible(
    selector: string,
    timeout: number = 100
  ): Promise<iValue> {
    const el: iValue = await this.response.waitForVisible(selector, timeout);
    el.isNull()
      ? this._failedAction("VISIBLE", selector)
      : this._completedAction("VISIBLE", selector);
    return el;
  }

  /**
   * Wait for element at the selected path with the given text to exist
   *
   * @param selector
   * @param text
   * @param timeout
   */
  public async waitForHavingText(
    selector: string,
    text: string | RegExp,
    timeout: number = 100
  ): Promise<iValue> {
    const el: iValue = await this.response.waitForHavingText(
      selector,
      text,
      timeout
    );
    el.isNull()
      ? this._failedAction("WAIT", `selector "${selector}" with text "${text}"`)
      : this._completedAction(
          "WAIT",
          `selector "${selector}" with text "${text}"`
        );
    return el;
  }

  /**
   * Wait for element at the selected path to exist in the DOM
   */
  public async waitForExists(
    selector: string | string[],
    timeout?: number
  ): Promise<iValue>;
  public async waitForExists(
    selector: string | string[],
    contains: string | RegExp,
    timeout?: number
  ): Promise<iValue>;
  public async waitForExists(
    selector: string | string[],
    a?: number | string | RegExp,
    b?: number
  ): Promise<iValue> {
    const selectors = arrayify<string>(selector);
    try {
      const promises = selectors.map((selector) =>
        // @ts-ignore TypeScript is being stupid
        this.response.waitForExists(selector, a, b)
      );
      const el: iValue = await bluebird.any(promises);
      this._completedAction("EXISTS", `${selector}`);
      return el;
    } catch (ex) {
      this._failedAction("EXISTS", `${selector}`);
      throw `${selector} did not exist before timeout`;
    }
  }

  public async waitForNotExists(
    selector: string,
    a?: number | string | RegExp,
    b?: number
  ): Promise<iValue> {
    try {
      // @ts-ignore This is fine, TypeScript is being stupid
      const val = await this.response.waitForNotExists(selector, a, b);
      this._completedAction("NOT EXISTS", `${selector}`);
      return val;
    } catch (ex) {
      this._failedAction("NOT EXISTS", `${selector}`);
      throw `${selector} still exists after timeout`;
    }
  }

  /**
   * Find for first element at this selector path and assert it exists
   *
   * @param selector
   */
  public async exists(
    selector: string | string[],
    a?: string | FindOptions | RegExp,
    b?: FindOptions
  ): Promise<iValue> {
    const selectors = arrayify<string>(selector);
    const params = getFindParams(a, b);
    const opts = params.opts || {};
    const element = await asyncForEachUntilFirst(
      selectors,
      async (selector) => {
        return params.contains
          ? await this.response.find(selector, params.contains, opts)
          : params.matches
          ? await this.response.find(selector, params.matches, opts)
          : await this.response.find(selector, opts);
      }
    );
    this._assertExists(null, getFindName(params, selectors, 0), element);
    return element;
  }

  /**
   * Find for first element at this selector path and assert it exists
   *
   * @param selector
   */
  public async existsAll(
    selector: string | string[],
    a?: string | FindAllOptions | RegExp,
    b?: FindAllOptions
  ): Promise<iValue[]> {
    const selectors = arrayify<string>(selector);
    const elements = await this._findAllForSelectors(selectors, a, b);
    this.assert(
      selectors.length > 1
        ? `${selectors.join(", ")} all exist`
        : `${selectors[0]} exists`,
      Object.values(elements)
    ).every((element: iValue[]) => !element[0].isNullOrUndefined());
    return flatten<iValue>(elements);
  }

  public async existsAny(
    selectors: string[],
    a?: string | FindAllOptions | RegExp,
    b?: FindAllOptions
  ): Promise<iValue[]> {
    const elements = await this._findAllForSelectors(selectors, a, b);
    this.assert(
      selectors.length > 1
        ? `${selectors.join(", ")} some exist`
        : `${selectors[0]} exists`,
      Object.values(elements)
    ).some((element: iValue[]) => !element[0].isNullOrUndefined());
    return flatten<iValue>(elements);
  }

  /**
   * Find for first element at this selector path
   *
   * @param selector
   */
  public find(
    selector: string | string[],
    a?: string | RegExp | FindOptions,
    b?: FindOptions
  ): ValuePromise {
    return ValuePromise.execute(async () => {
      const selectors = arrayify<string>(selector);
      const params = getFindParams(a, b);
      const element: iValue | false = await asyncForEachUntilFirst(
        selectors,
        async (selector) => {
          const value =
            typeof a == "string"
              ? await this.response.find(selector, a, b)
              : a instanceof RegExp
              ? await this.response.find(selector, a, b)
              : await this.response.find(selector, b);
          return value.isNullOrUndefined() ? false : value;
        }
      );
      return element === false
        ? wrapAsValue(this, null, getFindName(params, selectors, null))
        : element;
    });
  }

  /**
   * Find all elements at this selector path
   *
   * @param selector
   */
  public async findAll(
    selector: string | string[],
    a?: string | RegExp | FindAllOptions,
    b?: FindAllOptions
  ): Promise<iValue[]> {
    const selectors = arrayify<string>(selector);
    const elements = await this._findAllForSelectors(selectors, a, b);
    return flatten<iValue>(elements);
  }

  public async findXPath(xPath: string): Promise<iValue> {
    return this.response.findXPath(xPath);
  }

  public findAllXPath(xPath: string): Promise<iValue[]> {
    return this.response.findAllXPath(xPath);
  }

  /**
   * Submit this form
   *
   * @param selector
   */
  public async submit(selector: string): Promise<void> {
    const el: iValue = await this.exists(selector);
    if (el.isTag()) {
      el.submit();
    }
  }

  public logFailure(
    message: string,
    errorDetails?: any,
    sourceCode?: any,
    highlightText?: any
  ): iAssertionResult {
    const result = new AssertionFail(
      message,
      errorDetails,
      sourceCode,
      highlightText
    );
    this.scenario.result(result);
    return result;
  }

  public logOptionalFailure(
    message: string,
    errorDetails?: any
  ): iAssertionResult {
    const result = new AssertionFailOptional(message, errorDetails);
    this.scenario.result(result);
    return result;
  }

  public logPassing(message: string): iAssertionResult {
    const result = new AssertionPass(message);
    this.scenario.result(result);
    return result;
  }

  /**
   * Click on this element
   *
   * @param selector
   */
  click(selector: string, opts?: FindOptions): Promise<iValue>;
  click(
    selector: string,
    contains: string,
    opts?: FindOptions
  ): Promise<iValue>;
  click(selector: string, matches: RegExp, opts?: FindOptions): Promise<iValue>;
  public async click(
    selector: string,
    a?: FindOptions | string | RegExp,
    b?: FindOptions
  ): Promise<iValue> {
    return typeof a == "string"
      ? this.response.click(selector, a, b)
      : a instanceof RegExp
      ? this.response.click(selector, a, b)
      : this.response.click(selector, b);
  }

  /**
   * Save the response body into a temporary file and open it. This is mainly for debugging.
   */
  public async openInBrowser(): Promise<string> {
    const output = this.response.body.toString();
    const filePath: string = await openInBrowser(output);
    this.scenario.comment(`Open response in browser temp file: ${filePath}`);
    return filePath;
  }

  public screenshot(): Promise<Buffer>;
  public screenshot(localFilePath: string): Promise<Buffer>;
  public screenshot(
    localFilePath: string,
    opts: ScreenshotOpts
  ): Promise<Buffer>;
  public screenshot(opts: ScreenshotOpts): Promise<Buffer>;
  public screenshot(
    a?: string | ScreenshotOpts,
    b?: ScreenshotOpts
  ): Promise<Buffer> {
    const output = (() => {
      if (typeof a === "string") {
        return b ? this.response.screenshot(a, b) : this.response.screenshot(a);
      }
      return a ? this.response.screenshot(a) : this.response.screenshot();
    })();
    this._completedAction("SCREENSHOT");
    return output;
  }

  public push(key: string, value: any): iAssertionContext {
    this._scenario.push(key, value);
    return this;
  }

  public set(aliasName: string, value: any): iAssertionContext {
    this._scenario.set(aliasName, value);
    return this;
  }

  public get<T = any>(aliasName: string): T {
    return this._scenario.get<T>(aliasName);
  }

  public async scrollTo(point: OptionalXY): Promise<iAssertionContext> {
    return (await this.response.scrollTo(point)).context;
  }

  public map = asyncMap;
  public some = asyncSome;
  public every = asyncEvery;
  public filter = asyncFilter;
  public none = asyncNone;
  public each = asyncForEach;

  public abort(message?: string): Promise<iScenario> {
    return this.scenario.abort(message);
  }

  public schema(schema: any): SchemaValidator {
    return new SchemaValidator(schema);
  }

  protected async _findAllForSelectors(
    selectors: string[],
    a?: string | FindAllOptions | RegExp,
    b?: FindAllOptions
  ): Promise<{ [selector: string]: iValue[] }> {
    return asyncMapToObject<iValue[]>(selectors, async (selector) =>
      typeof a == "string"
        ? this.response.findAll(selector, a, b)
        : a instanceof RegExp
        ? this.response.findAll(selector, a, b)
        : this.response.findAll(selector, b)
    );
  }

  protected async _completedAction(verb: string, noun?: string) {
    this.scenario.result(new AssertionActionCompleted(verb, noun || ""));
  }

  protected async _failedAction(verb: string, noun?: string) {
    this.scenario.result(new AssertionActionFailed(verb, noun || ""));
  }

  protected _assertExists(message: string | null, name: string, el: iValue) {
    if (message) {
      el.isNullOrUndefined()
        ? this.scenario.result(new AssertionFail(message, name))
        : this.scenario.result(new AssertionPass(message));
    } else {
      el.isNullOrUndefined()
        ? this._failedAction("EXISTS", `${name}`)
        : this._completedAction("EXISTS", `${name}`);
    }
  }
}
