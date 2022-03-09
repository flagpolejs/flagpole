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
import { AssertionResult } from "../logging/assertion-result";
import { NumericValue } from "../values/numeric-value";
import { StringValue } from "../values/string-value";
import { UnknownValue } from "../values/unknown-value";
import { Scenario } from "../scenario";

export class AssertionContext<ScenarioType extends Scenario = Scenario> {
  protected _assertions: Assertion[] = [];
  protected _subScenarios: Promise<any>[] = [];

  constructor(public readonly scenario: ScenarioType) {}

  /**
   * Get returned value from previous next block
   */
  public result: any;

  public suite = this.scenario.suite;
  public request = this.scenario.request;
  public response = this.scenario.response;
  public scenarioType = this.scenario.typeName;
  public executionOptions = FlagpoleExecution.global;

  public currentUrl = this.response.currentUrl;

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

  public comment = this.scenario.comment;

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

  public type = this.response.type;
  public clear = this.response.clear;
  public clearThenType = this.response.clearThenType;
  public selectOption = this.response.selectOption;
  public eval = this.response.eval;

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
    ).every((element: UnknownValue[]) => !element[0].isNullOrUndefined());
    return flatten<UnknownValue>(elements);
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
    ).some((element: UnknownValue[]) => !element[0].isNullOrUndefined());
    return flatten<UnknownValue>(elements);
  }

  public find = this.response.find;
  public findAll = this.response.findAll;
  public findXPath = this.response.findXPath;
  public findAllXPath = this.response.findAllXPath;

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

  public click = this.response.click;
  public screenshot = this.response.screenshot;

  /**
   * Save the response body into a temporary file and open it. This is mainly for debugging.
   */
  public async openInBrowser(): Promise<string> {
    const output = this.response.body.toString();
    const filePath: string = await openInBrowser(output);
    this.scenario.comment(`Open response in browser temp file: ${filePath}`);
    return filePath;
  }

  public movePointer = this.response.movePointer;
  public gesture = this.response.gesture;

  public push = this.scenario.push;
  public set = this.scenario.set;
  public get = this.scenario.get;

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

  public abort = this.scenario.abort;

  public rotateScreen = this.response.rotateScreen;
  public getScreenProperties = this.response.getScreenProperties;
  public hideKeyboard = this.response.hideKeyboard;

  public getSource(): ValuePromise<StringValue> {
    return ValuePromise.execute(async () => {
      return await this.response.getSource();
    });
  }

  protected async _findAllForSelectors(
    selectors: string[],
    a?: string | FindAllOptions | RegExp,
    b?: FindAllOptions
  ): Promise<{ [selector: string]: UnknownValue[] }> {
    return asyncMapToObject<UnknownValue[]>(selectors, async (selector) =>
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
    el: UnknownValue
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
