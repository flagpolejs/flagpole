import { BrowserControl } from "./browsercontrol";
import { Page } from "puppeteer-core";
import { Assertion } from "./assertion";
import {
  iResponse,
  iValue,
  iAssertionContext,
  iScenario,
  iSuite,
  iAssertionResult,
  ScreenshotOpts,
} from "./interfaces";
import {
  AssertionActionCompleted,
  AssertionActionFailed,
  AssertionFail,
  AssertionPass,
} from "./logging/assertionresult";
import { openInBrowser, getMessageAndCallbackFromOverloading } from "./util";
import { FlagpoleExecution } from "./flagpoleexecution";

export class AssertionContext implements iAssertionContext {
  protected _scenario: iScenario;
  protected _response: iResponse;
  protected _assertions: Assertion[] = [];
  protected _subScenarios: Promise<any>[] = [];

  /**
   * Get returned value from previous next block
   */
  public result: any;

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
    return this.response.isBrowser ? this._scenario.getBrowserControl() : null;
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
   * @param message
   */
  public comment(message: string): iAssertionContext;
  public comment(value: iValue): iAssertionContext;
  public comment(input: string | iValue): iAssertionContext {
    this._scenario.comment(input);
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
    const value = typeof b !== "undefined" ? b : a;
    const message = typeof b !== "undefined" ? a : undefined;
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
   * Get first element with the given selector that has text content matching the search
   *
   * @param selector
   * @param searchForText
   */
  public async findHavingText(
    selector: string,
    searchForText: string | RegExp
  ): Promise<iValue> {
    return this.response.findHavingText(selector, searchForText);
  }

  /**
   * Get all elements with the given selector that has text content matching the search
   *
   * @param selector
   * @param searchForText
   */
  public async findAllHavingText(
    selector: string,
    searchForText: string | RegExp
  ): Promise<iValue[]> {
    return this.response.findAllHavingText(selector, searchForText);
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
  public async select(
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
  public async evaluate(callback: Function): Promise<any> {
    return await this.response.evaluate(this, callback);
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

  public async waitForHavingText(
    selector: string,
    text: string,
    timeout?: number
  ): Promise<iValue> {
    const el: iValue = await this.response.waitForHavingText(
      selector,
      text,
      timeout
    );
    const label = `Having Text: ${text}`;
    el.isNull()
      ? this._failedAction(label, selector)
      : this._completedAction(label, selector);
    return el;
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
   * Wait for element at the selected path to exist in the DOM
   *
   * @param selector
   * @param timeout
   */
  public async waitForExists(
    selector: string,
    timeout?: number
  ): Promise<iValue> {
    const el: iValue = await this.response.waitForExists(selector, timeout);
    el.isNull()
      ? this._failedAction("EXISTS", `${selector}`)
      : this._completedAction("EXISTS", `${selector}`);
    return el;
  }

  /**
   * Find for first element at this selector path and assert it exists
   *
   * @param selector
   */
  public async exists(selector: string): Promise<iValue>;
  public async exists(message: string, selector: string): Promise<iValue>;
  public async exists(a: string, b?: string): Promise<iValue> {
    const selector = typeof b === "string" ? b : a;
    const message = typeof b === "string" ? a : null;
    const el = await this.response.find(selector);
    if (!!message) {
      el.isNull()
        ? this.scenario.result(new AssertionFail(message, selector))
        : this.scenario.result(new AssertionPass(message));
    } else {
      el.isNull()
        ? this._failedAction("EXISTS", `${selector}`)
        : this._completedAction("EXISTS", `${selector}`);
    }
    return el;
  }

  /**
   * Find for first element at this selector path
   *
   * @param selector
   */
  public async find(selector: string): Promise<iValue> {
    return this.response.find(selector);
  }

  /**
   * Find all elements at this selector path
   *
   * @param selector
   */
  public async findAll(selector: string): Promise<iValue[]> {
    return this.response.findAll(selector);
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
  public async submit(selector: string): Promise<any> {
    const el: iValue | iValue | null = await this.exists(selector);
    if (el === null) {
      throw new Error(`Element with selector ${selector} not found.`);
    }
    if ("submit" in el) {
      return el.submit();
    }
    return null;
  }

  /**
   * Click on this element
   *
   * @param selector
   */
  public click(selector: string): Promise<void>;
  public click(selector: string, scenario: iScenario): Promise<iScenario>;
  public click(selector: string, message: string): Promise<iScenario>;
  public click(selector: string, callback: Function): Promise<iScenario>;
  public async click(
    selector: string,
    a?: string | Function | iScenario,
    b?: Function
  ): Promise<iScenario | void> {
    const el: iValue = await this.find(selector);
    const overloaded = getMessageAndCallbackFromOverloading(a, b, selector);
    if ("click" in el) {
      if (overloaded.scenario) {
        return el.click(overloaded.scenario);
      }
      if (overloaded.isSubScenario) {
        return el.click(overloaded.message, overloaded.callback);
      }
      return el.click();
    }
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

  public set(aliasName: string, value: any): iAssertionContext {
    this._scenario.set(aliasName, value);
    return this;
  }

  public get(aliasName: string): any {
    return this._scenario.get(aliasName);
  }

  protected async _completedAction(verb: string, noun?: string) {
    this.scenario.result(new AssertionActionCompleted(verb, noun || ""));
  }

  protected async _failedAction(verb: string, noun?: string) {
    this.scenario.result(new AssertionActionFailed(verb, noun || ""));
  }
}
