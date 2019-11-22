import { BrowserControl } from "./browsercontrol";
import { Page, Browser } from "puppeteer";
import { Assertion } from "./assertion";
import {
  iResponse,
  iValue,
  iAssertionContext,
  iScenario,
  iSuite,
  iAssertionResult,
  iDOMElement
} from "./interfaces";
import {
  AssertionActionCompleted,
  AssertionActionFailed
} from "./logging/assertionresult";
import { openInBrowser } from "./util";
import {
  FlagpoleExecution,
  FlagpoleExecutionOptions
} from "./flagpoleexecutionoptions";
import { Value } from ".";

export class AssertionContext implements iAssertionContext {
  private _scenario: iScenario;
  private _response: iResponse;
  private _assertions: Assertion[] = [];
  private _subScenarios: Promise<any>[] = [];

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

  public get executionOptions(): FlagpoleExecutionOptions {
    return FlagpoleExecution.opts;
  }

  public get page(): Page | null {
    return this.browserControl !== null ? this.browserControl.page : null;
  }

  public get incompleteAssertions(): Assertion[] {
    const incompleteAssertions: Assertion[] = [];
    this._assertions.forEach(assertion => {
      if (!assertion.assertionMade) {
        incompleteAssertions.push(assertion);
      }
    });
    return incompleteAssertions;
  }

  public get assertionsResolved(): Promise<(iAssertionResult | null)[]> {
    const promises: Promise<iAssertionResult | null>[] = [];
    this._assertions.forEach(assertion => {
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
  public comment(message: string): iAssertionContext {
    this._scenario.comment(message);
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
    return new Promise(resolve => {
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
  ): Promise<iDOMElement | iValue> {
    return this.findHavingText(selector, searchForText);
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
  ): Promise<iDOMElement[]> {
    return this.findAllHavingText(selector, searchForText);
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

  /**
   * Wait for element at the selected path to be hidden
   *
   * @param selector
   * @param timeout
   */
  public async waitForHidden(
    selector: string,
    timeout: number = 100
  ): Promise<iValue | iDOMElement> {
    const el: iValue | iDOMElement = await this.response.waitForHidden(
      selector,
      timeout
    );
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
  ): Promise<iValue | iDOMElement> {
    const el: iValue | iDOMElement = await this.response.waitForVisible(
      selector,
      timeout
    );
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
  ): Promise<iValue | iDOMElement> {
    const el: iValue | iDOMElement = await this.response.waitForExists(
      selector,
      timeout
    );
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
  public async exists(selector: string): Promise<iValue | iDOMElement> {
    const el = await this.response.find(selector);
    el.isNull;
    el === null
      ? this._failedAction("EXISTS", `${selector}`)
      : this._completedAction("EXISTS", `${selector}`);
    return el;
  }

  /**
   * Find for first element at this selector path
   *
   * @param selector
   */
  public async find(selector: string): Promise<iValue | iDOMElement> {
    return this.response.find(selector);
  }

  /**
   * Find all elements at this selector path
   *
   * @param selector
   */
  public async findAll(selector: string): Promise<(iValue | iDOMElement)[]> {
    return this.response.findAll(selector);
  }

  /**
   * Submit this form
   *
   * @param selector
   */
  public async submit(selector: string): Promise<any> {
    const el: iDOMElement | iValue | null = await this.exists(selector);
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
  public async click(selector: string): Promise<any> {
    const el: iDOMElement | iValue | null = await this.find(selector);
    if (el === null) {
      throw new Error(`Element with selector ${selector} not found.`);
    }
    if ("click" in el) {
      return el.click();
    }
    return null;
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

  public async screenshot(opts: any): Promise<Buffer | string> {
    const output: Buffer | string = await this.response.screenshot(opts);
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
