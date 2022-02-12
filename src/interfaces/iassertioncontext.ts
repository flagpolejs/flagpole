import {
  FlagpoleExecution,
  HttpRequest,
  iScenario,
  iSuite,
  ValuePromise,
} from "..";
import { FindAllOptions, FindOptions } from "./find-options";
import { JsFunction, OptionalXY } from "./generic-types";
import { GestureOpts, GestureType } from "./gesture";
import { iAssertion } from "./iassertion";
import { iAssertionResult } from "./iassertion-result";
import { iResponse } from "./iresponse";
import { IteratorBoolCallback, IteratorCallback } from "./iterator-callbacks";
import { iValue } from "./ivalue";
import { PointerMove } from "./pointer";
import { ScreenProperties } from "./screen-properties";
import { ValueOptions } from "./value-options";

export interface iNextCallback<T = iAssertionContext> {
  (context: T, ...args: any[]): Promise<any> | void;
}

export interface iAssertionContext<
  ScenarioType extends iScenario = iScenario,
  ResponseType extends iResponse = iResponse
> {
  result: any;
  request: HttpRequest;
  response: ResponseType;
  scenario: ScenarioType;
  suite: iSuite;
  executionOptions: FlagpoleExecution;
  incompleteAssertions: iAssertion[];
  assertionsResolved: Promise<(iAssertionResult | null)[]>;
  subScenariosResolved: Promise<any[]>;
  currentUrl: iValue<string | null>;
  comment(input: any): this;
  assert(a: any, b?: any): iAssertion;
  pause(milliseconds: number): Promise<void>;
  push(aliasName: string, value: any): this;
  set(aliasName: string, value: any): this;
  get<T = any>(aliasName: string): T;
  exists<T extends iValue>(
    selector: string | string[],
    opts?: FindOptions
  ): ValuePromise<T>;
  exists<T extends iValue>(
    selector: string | string[],
    contains: string,
    opts?: FindOptions
  ): ValuePromise<T>;
  exists<T extends iValue>(
    selector: string | string[],
    matches: RegExp,
    opts?: FindOptions
  ): ValuePromise<T>;
  existsAll<T extends iValue>(
    selector: string | string[],
    opts?: FindOptions
  ): Promise<T[]>;
  existsAll<T extends iValue>(
    selector: string | string[],
    contains: string,
    opts?: FindOptions
  ): Promise<T[]>;
  existsAll<T extends iValue>(
    selector: string | string[],
    matches: RegExp,
    opts?: FindOptions
  ): Promise<T[]>;
  existsAny<T extends iValue>(
    selectors: string[],
    opts?: FindOptions
  ): Promise<T[]>;
  existsAny<T extends iValue>(
    selector: string[],
    contains: string,
    opts?: FindOptions
  ): Promise<T[]>;
  existsAny<T extends iValue>(
    selector: string[],
    matches: RegExp,
    opts?: FindOptions
  ): Promise<T[]>;
  find<T extends iValue>(
    selector: string | string[],
    opts?: FindOptions
  ): ValuePromise<T>;
  find<T extends iValue>(
    selector: string | string[],
    contains: string,
    opts?: FindOptions
  ): ValuePromise<T>;
  find<T extends iValue>(
    selector: string | string[],
    matches: RegExp,
    opts?: FindOptions
  ): ValuePromise<T>;
  findAll<T extends iValue>(
    selector: string | string[],
    opts?: FindAllOptions
  ): Promise<T[]>;
  findAll<T extends iValue>(
    selector: string | string[],
    contains: string,
    opts?: FindAllOptions
  ): Promise<T[]>;
  findAll<T extends iValue>(
    selector: string | string[],
    matches: RegExp,
    opts?: FindAllOptions
  ): Promise<T[]>;
  findXPath(xPath: string): ValuePromise;
  findAllXPath(xPath: string): Promise<iValue[]>;
  click(selector: string, opts?: FindOptions): ValuePromise;
  click(selector: string, contains: string, opts?: FindOptions): ValuePromise;
  click(selector: string, matches: RegExp, opts?: FindOptions): ValuePromise;
  submit(selector: string): ValuePromise;
  type(selector: string, textToType: string, opts?: any): ValuePromise;
  clear(selector: string): ValuePromise;
  clearThenType(selector: string, textToType: string, opts?: any): ValuePromise;
  selectOption(selector: string, value: string | string[]): Promise<void>;
  eval(js: JsFunction, ...args: any[]): Promise<any>;
  waitForFunction(
    js: JsFunction,
    opts?: { polling?: string | number; timeout?: number },
    ...args: any[]
  ): Promise<void>;
  waitForReady(timeout?: number): Promise<void>;
  waitForLoad(timeout?: number): Promise<void>;
  waitForNetworkIdle(timeout?: number): Promise<void>;
  waitForNavigation(
    timeout?: number,
    waitFor?: string | string[]
  ): Promise<void>;
  waitForHidden(selector: string, timeout?: number): ValuePromise;
  waitForVisible(selector: string, timeout?: number): ValuePromise;
  waitForExists(selector: string, timeout?: number): ValuePromise;
  waitForExists(
    selector: string,
    contains: string | RegExp,
    timeout?: number
  ): ValuePromise;
  waitForNotExists(selector: string, timeout?: number): ValuePromise;
  waitForNotExists(
    selector: string,
    contains: string | RegExp,
    timeout?: number
  ): ValuePromise;
  waitForXPath(xPath: string, timeout?: number): ValuePromise;
  waitForHavingText(
    selector: string,
    text: string | RegExp,
    timeout?: number
  ): ValuePromise;
  openInBrowser(): Promise<string>;
  screenshot(): Promise<Buffer>;
  screenshot(localFilePath: string): Promise<Buffer>;
  screenshot(localFilePath: string, opts: {}): Promise<Buffer>;
  screenshot(opts: {}): Promise<Buffer>;
  logFailure(
    message: string,
    errorDetails?: any,
    sourceCode?: any,
    highlightText?: any
  ): iAssertionResult;
  logOptionalFailure(message: string, errorDetails?: any): iAssertionResult;
  logPassing(message: string): iAssertionResult;
  scrollTo(point: OptionalXY): Promise<iAssertionContext>;
  count<T>(array: T[]): ValuePromise;
  count<T>(array: T[], callback: IteratorBoolCallback): ValuePromise;
  some<T>(array: T[], callback: IteratorBoolCallback): Promise<boolean>;
  none<T>(array: T[], callback: IteratorBoolCallback): Promise<boolean>;
  every<T>(array: T[], callback: IteratorBoolCallback): Promise<boolean>;
  each<T>(array: T[], callback: IteratorCallback): Promise<void>;
  filter<T>(array: T[], callback: IteratorBoolCallback): Promise<T[]>;
  map<T>(array: T[], callback: IteratorCallback): Promise<any[]>;
  abort(message?: string): Promise<void>;
  rotateScreen(rotation: string | number): Promise<string | number>;
  getScreenProperties(): Promise<ScreenProperties>;
  hideKeyboard(): Promise<void>;
  movePointer(...pointers: PointerMove[]): Promise<iResponse>;
  gesture(type: GestureType, opts: GestureOpts): Promise<iResponse>;
  getSource(): ValuePromise;
  wrapValue<T>(data: T, opts: ValueOptions): iValue<T>;
}
