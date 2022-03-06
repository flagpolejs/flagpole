import { Assertion } from "./assertion";
import {
  AssertionActionCompleted,
  AssertionActionFailed,
  AssertionFail,
  AssertionPass,
  AssertionFailOptional,
} from "../logging/assertion-result";
import {
  openInBrowser,
  asyncMap,
  asyncSome,
  asyncEvery,
  asyncFilter,
  asyncNone,
  asyncForEach,
  asyncUntil,
  toArray,
  asyncMapToObject,
  flatten,
  asyncCount,
} from "../util";
import { FlagpoleExecution } from "../flagpole-execution";
import { getFindParams, getFindName } from "../helpers";
import { ValuePromise } from "../value-promise";
import { IteratorBoolCallback } from "../interfaces/iterator-callbacks";
import { FindAllOptions, FindOptions } from "../interfaces/find-options";
import { JsFunction, KeyValue, OptionalXY } from "../interfaces/generic-types";
import { ScreenshotOpts } from "../interfaces/screenshot";
import { GestureOpts, GestureType } from "../interfaces/gesture";
import { PointerMove } from "../interfaces/pointer";
import { ScreenProperties } from "../interfaces/screen-properties";
import { HttpRequest, ProtoResponse, Scenario, Suite, Value } from "..";
import { AssertionResult } from "../logging/assertion-result";
import { ValueOptions } from "../interfaces/value-options";
import { NumericValue } from "../values/numeric-value";
import { StringValue } from "../values/string-value";
import { UnknownValue } from "../values/unknown-value";
import { GenericValue } from "../values/generic-value";

export class AssertionContext<
  RequestType extends HttpRequest = HttpRequest,
  ResponseType extends ProtoResponse = ProtoResponse,
  WrapperType extends Value = Value
> {
  protected _assertions: Assertion[] = [];
  protected _subScenarios: Promise<any>[] = [];

  constructor(
    public readonly scenario: Scenario,
    public readonly request: RequestType,
    public readonly response: ResponseType
  ) {}

  public createStandardValue<T>(
    data: T,
    opts: ValueOptions | string
  ): Value<T> {
    if (typeof opts == "string") opts = { name: opts };
    return new Value(data, this.scenario.context, opts);
  }

  /**
   * Get returned value from previous next block
   */
  public result: any;

  public get suite(): Suite {
    return this.scenario.suite;
  }

  public get executionOptions(): FlagpoleExecution {
    return FlagpoleExecution.global;
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

  public get assertionsResolved(): Promise<(AssertionResult | null)[]> {
    const promises: Promise<AssertionResult | null>[] = [];
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

  public get currentUrl() {
    return this.response.currentUrl;
  }

  /**
   * Make a comment in the scenario output
   *
   * @param input
   */
  public comment(input: any): this {
    this.scenario.comment(input);
    return this;
  }

  /**
   * Create a new assertion based on this value
   *
   * @param message
   * @param value
   */
  public assert(message: string, value: any): Assertion;
  public assert(value: any): Assertion;
  public assert(a: any, b?: any): Assertion {
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
  public pause(milliseconds: number): Promise<void> {
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
  public clearThenType(selector: string, textToType: string, opts: any = {}) {
    return this.response.clearThenType(selector, textToType, opts);
  }

  /**
   * Clear any current input in this input box
   *
   * @param selector
   */
  public clear(selector: string) {
    return this.response.clear(selector);
  }

  public type(selector: string, textToType: string, opts: any = {}) {
    return this.response.type(selector, textToType, opts);
  }

  /**
   * Select items from a dropdown or multi-select box
   *
   * @param selector
   * @param value
   */
  public async selectOption(selector: string, value: string | string[]) {
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
  public async eval(js: JsFunction, ...args: any[]) {
    return await this.response.eval.apply(this, [js, ...args]);
  }

  public async waitForFunction(
    js: JsFunction,
    opts?: KeyValue,
    ...args: any[]
  ) {
    await this.response.waitForFunction.apply(this.response, [
      js,
      opts,
      ...args,
    ]);
    this._completedAction("WAIT", "Function to evaluate as true");
  }

  public async waitForReady(timeout: number = 15000) {
    await this.response.waitForReady(timeout);
    this._completedAction("WAIT", "Ready");
  }

  public async waitForLoad(timeout: number = 30000) {
    await this.response.waitForLoad(timeout);
    this._completedAction("WAIT", "Load");
  }

  public async waitForNetworkIdle(timeout: number = 10000) {
    await this.response.waitForNetworkIdle(timeout);
    this._completedAction("WAIT", "Network Idle");
  }

  public async waitForNavigation(
    timeout: number = 10000,
    waitFor?: string | string[]
  ) {
    await this.response.waitForNavigation(timeout, waitFor);
    this._completedAction("WAIT", "Navigation");
  }

  public waitForXPath(xPath: string, timeout?: number) {
    return ValuePromise.execute(async () => {
      const el = await this.response.waitForXPath(xPath, timeout);
      el.isNull()
        ? this._failedAction("XPATH", xPath)
        : this._completedAction("XPATH", xPath);
      return el;
    });
  }

  /**
   * Wait for element at the selected path to be hidden
   *
   * @param selector
   * @param timeout
   */
  public waitForHidden(selector: string, timeout?: number) {
    return ValuePromise.execute(async () => {
      const el = await this.response.waitForHidden(selector, timeout);
      el.isNull()
        ? this._failedAction("HIDDEN", selector)
        : this._completedAction("HIDDEN", selector);
      return el;
    });
  }

  /**
   * Wait for element at the selected path to be visible
   *
   * @param selector
   * @param timeout
   */
  public waitForVisible(selector: string, timeout?: number) {
    return ValuePromise.execute(async () => {
      const el = await this.response.waitForVisible(selector, timeout);
      el.isNull()
        ? this._failedAction("VISIBLE", selector)
        : this._completedAction("VISIBLE", selector);
      return el;
    });
  }

  /**
   * Wait for element at the selected path with the given text to exist
   *
   * @param selector
   * @param text
   * @param timeout
   */
  public waitForHavingText(
    selector: string,
    text: string | RegExp,
    timeout?: number
  ) {
    return ValuePromise.execute(async () =>
      this.waitForExists(selector, text, timeout)
    );
  }

  /**
   * Wait for element at the selected path to exist in the DOM
   */
  public waitForExists(
    selector: string,
    timeout?: number
  ): ValuePromise<UnknownValue>;
  public waitForExists(
    selector: string,
    contains: string | RegExp,
    timeout?: number
  ): ValuePromise<UnknownValue>;
  public waitForExists(
    selector: string,
    a?: number | string | RegExp,
    b?: number
  ) {
    return ValuePromise.execute(async () => {
      const selectors = toArray<string>(selector);
      try {
        // @ts-ignore TypeScript is being stupid
        const el = await this.response.waitForExists(selector, a, b);
        this._completedAction("EXISTS", `${selector}`);
        return el;
      } catch (ex) {
        this._failedAction("EXISTS", `${selector}`);
        throw `${selector} did not exist before timeout`;
      }
    });
  }

  public waitForNotExists(
    selector: string,
    a?: number | string | RegExp,
    b?: number
  ) {
    return ValuePromise.execute(async () => {
      try {
        // @ts-ignore This is fine, TypeScript is being stupid
        const val = await this.response.waitForNotExists(selector, a, b);
        this._completedAction("NOT EXISTS", `${selector}`);
        return val;
      } catch (ex) {
        this._failedAction("NOT EXISTS", `${selector}`);
        throw `${selector} still exists after timeout`;
      }
    });
  }

  /**
   * Find for first element at this selector path and assert it exists
   *
   * @param selector
   */
  public exists(
    selector: string | string[],
    a?: string | FindOptions | RegExp,
    b?: FindOptions
  ) {
    return ValuePromise.execute<UnknownValue>(async () => {
      const selectors = toArray<string>(selector);
      const params = getFindParams(a, b);
      const opts = params.opts || {};
      const element = await asyncUntil(selectors, async (selector) =>
        params.contains
          ? await this.response.find(selector, params.contains, opts)
          : params.matches
          ? await this.response.find(selector, params.matches, opts)
          : await this.response.find(selector, opts)
      );
      const name = getFindName(params, selectors, 0);
      const value = new UnknownValue(element, this, name);
      this._assertExists(null, name, value);
      return value;
    });
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
  ) {
    const selectors = toArray<string>(selector);
    const elements = await this._findAllForSelectors(selectors, a, b);
    this.assert(
      selectors.length > 1
        ? `${selectors.join(", ")} all exist`
        : `${selectors[0]} exists`,
      Object.values(elements)
    ).every((element: Value<any>[]) => !element[0].isNullOrUndefined());
    return flatten<Value<any>>(elements);
  }

  public async existsAny(
    selectors: string[],
    a?: string | FindAllOptions | RegExp,
    b?: FindAllOptions
  ) {
    const elements = await this._findAllForSelectors(selectors, a, b);
    this.assert(
      selectors.length > 1
        ? `${selectors.join(", ")} some exist`
        : `${selectors[0]} exists`,
      Object.values(elements)
    ).some((element: Value<any>[]) => !element[0].isNullOrUndefined());
    return flatten<Value<any>>(elements);
  }

  /**
   * Find for first element at this selector path
   *
   * @param selector
   */
  public find<InputType>(
    selector: string | string[],
    a?: string | RegExp | FindOptions,
    b?: FindOptions
  ): ValuePromise<UnknownValue> {
    const selectors = toArray<string>(selector);
    const params = getFindParams(a, b);
    return ValuePromise.execute(async () => {
      const element = await asyncUntil<WrapperType>(
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
      return new UnknownValue(
        element,
        this,
        getFindName(params, selectors, null)
      );
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
  ): Promise<Value<any>[]> {
    const selectors = toArray<string>(selector);
    const elements = await this._findAllForSelectors(selectors, a, b);
    return flatten<Value<any>>(elements);
  }

  public findXPath(xPath: string) {
    return ValuePromise.execute(async () => {
      return this.response.findXPath(xPath);
    });
  }

  public findAllXPath(xPath: string) {
    return this.response.findAllXPath(xPath);
  }

  /**
   * Submit this form
   *
   * @param selector
   */
  public submit(selector: string) {
    return ValuePromise.execute(async () => {
      const el = await this.exists(selector);
      if (el.isTag()) {
        el.submit();
      }
      return el;
    });
  }

  public logFailure(
    message: string,
    errorDetails?: any,
    sourceCode?: any,
    highlightText?: any
  ): AssertionResult {
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
  ): AssertionResult {
    const result = new AssertionFailOptional(message, errorDetails);
    this.scenario.result(result);
    return result;
  }

  public logPassing(message: string): AssertionResult {
    const result = new AssertionPass(message);
    this.scenario.result(result);
    return result;
  }

  /**
   * Click on this element
   *
   * @param selector
   */
  click(selector: string, opts?: FindOptions): ValuePromise<UnknownValue>;
  click(
    selector: string,
    contains: string,
    opts?: FindOptions
  ): ValuePromise<UnknownValue>;
  click(
    selector: string,
    matches: RegExp,
    opts?: FindOptions
  ): ValuePromise<UnknownValue>;
  public click(
    selector: string,
    a?: FindOptions | string | RegExp,
    b?: FindOptions
  ) {
    return ValuePromise.execute(async () => {
      return typeof a == "string"
        ? this.response.click(selector, a, b)
        : a instanceof RegExp
        ? this.response.click(selector, a, b)
        : this.response.click(selector, b);
    });
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

  public async movePointer(...pointers: PointerMove[]): Promise<this> {
    await this.response.movePointer(...pointers);
    return this;
  }

  public async gesture(type: GestureType, opts: GestureOpts): Promise<this> {
    await this.response.gesture(type, opts);
    return this;
  }

  public push(key: string, value: any): this {
    this.scenario.push(key, value);
    return this;
  }

  public set(aliasName: string, value: any): this {
    this.scenario.set(aliasName, value);
    return this;
  }

  public get<T = any>(aliasName: string): T {
    return this.scenario.get<T>(aliasName);
  }

  public async scrollTo(point: OptionalXY): Promise<this> {
    await this.response.scrollTo(point);
    return this;
  }

  public map = asyncMap;
  public some = asyncSome;
  public every = asyncEvery;
  public filter = asyncFilter;
  public none = asyncNone;
  public each = asyncForEach;

  public count<T>(
    arr: T[],
    callback?: IteratorBoolCallback
  ): ValuePromise<NumericValue> {
    return ValuePromise.execute<NumericValue>(async () => {
      if (callback) {
        const n = await asyncCount<T>(arr, callback);
        return new NumericValue(n, this, "Count");
      }
      return new NumericValue(arr.length, this, "Count");
    });
  }

  public async abort(message?: string): Promise<void> {
    await this.scenario.abort(message);
  }

  public async rotateScreen(
    rotation: string | number
  ): Promise<string | number> {
    return await this.response.rotateScreen(rotation);
  }

  public async getScreenProperties(): Promise<ScreenProperties> {
    return await this.response.getScreenProperties();
  }

  /* Hides the software keyboard */
  public async hideKeyboard(): Promise<void> {
    await this.response.hideKeyboard();
  }

  public getSource(): ValuePromise<StringValue> {
    return ValuePromise.execute(async () => {
      return await this.response.getSource();
    });
  }

  protected async _findAllForSelectors(
    selectors: string[],
    a?: string | FindAllOptions | RegExp,
    b?: FindAllOptions
  ): Promise<{ [selector: string]: Value<any>[] }> {
    return asyncMapToObject<Value<any>[]>(selectors, async (selector) =>
      typeof a == "string"
        ? this.response.findAll(selector, a, b)
        : a instanceof RegExp
        ? this.response.findAll(selector, a, b)
        : this.response.findAll(selector, a)
    );
  }

  protected async _completedAction(verb: string, noun?: string) {
    this.scenario.result(new AssertionActionCompleted(verb, noun || ""));
  }

  protected async _failedAction(verb: string, noun?: string) {
    this.scenario.result(new AssertionActionFailed(verb, noun || ""));
  }

  protected _assertExists(
    message: string | null,
    name: string,
    el: Value<any>
  ) {
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
