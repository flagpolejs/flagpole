import { BrowserControl } from "./puppeteer/browsercontrol";
import {
  Page,
  EvaluateFn,
  SerializableOrJSHandle,
  PageFnOptions,
} from "puppeteer-core";
import {
  SuiteStatusEvent,
  ScenarioStatusEvent,
  LineType,
  ScenarioDisposition,
} from "./enums";
import { HttpResponse } from "./httpresponse";
import { FlagpoleExecution } from "./flagpoleexecution";
import { Link } from "./link";
import { ServerOptions } from "https";
import { Server } from "minikin";
import validator from "validator";
import { ValuePromise } from "./value-promise";
import { ScenarioType } from "./scenario-types";
import { LaunchOptions } from "puppeteer-core";
import * as http from "http";
import { ErrorObject, Schema } from "ajv";
import {
  IteratorBoolCallback,
  IteratorCallback,
  SyncIteratorBoolCallback,
  SyncIteratorCallback,
  SyncMapperCallback,
  SyncReducerCallback,
} from "./interfaces/iterator-callbacks";

export type CompareCallback = (a: any, b: any) => number;

export interface ScreenshotOpts {
  path?: string;
  fullPage?: boolean;
  clip?: { x: number; y: number; width: number; height: number };
  omitBackground?: boolean;
}

export interface iNextCallback {
  (context: iAssertionContext, ...args: any[]): Promise<any> | void;
}

export interface iCallbackAndMessage {
  message: string;
  callback: Function;
}

export interface FindOptions {
  findBy?: "text" | "value" | "html";
  offset?: number;
}

export interface FindAllOptions extends FindOptions {
  limit?: number;
}

export type ResponseSyncPipe = (resp: HttpResponse) => void | HttpResponse;
export type ResponseAsyncPipe = (
  resp: HttpResponse
) => Promise<void | HttpResponse>;
export type ResponsePipe = ResponseSyncPipe | ResponseAsyncPipe;
export type ResponsePipeCallbackAndMessage = {
  message: string;
  callback: ResponsePipe;
};
export type OptionalXY = { x?: number; y?: number };

export type ScenarioStatusCallback = (
  scenario: iScenario,
  status: ScenarioStatusEvent
) => any;
export type SuiteStatusCallback = (
  suite: iSuite,
  statusEvent: SuiteStatusEvent
) => any;

export type PointerButton = "default" | "left" | "right" | "middle";
export type PointerDisposition = "down" | "up";
export type PointerType = "default" | "mouse" | "pen" | "touch";
export type PointerPoint = [x: number, y: number];

export interface PointerMove {
  start: PointerPoint;
  end?: PointerPoint;
  duration?: number;
  type?: PointerType;
  disposition?: {
    start: PointerDisposition;
    end: PointerDisposition;
  };
  button?: PointerButton;
}

export type TapType = "single" | "double";

export type GestureType = "pinch" | "stretch";
export interface GestureOpts {
  start?: PointerPoint;
  duration?: number;
  amount?: PointerPoint;
}

export type SuiteAsyncCallback = (suite: iSuite) => Promise<void>;
export type SuiteSyncCallback = (suite: iSuite) => void;
export type SuiteCallback = SuiteAsyncCallback | SuiteSyncCallback;
export type SuiteCallbackAndMessage = {
  message: string;
  callback: SuiteCallback;
};

export type ScenarioAsyncCallback = (
  scenario: iScenario,
  suite: iSuite
) => Promise<void>;
export type ScenarioSyncCallback = (scenario: iScenario, suite: iSuite) => void;
export type ScenarioCallback = ScenarioAsyncCallback | ScenarioSyncCallback;
export type ScenarioCallbackAndMessage = {
  message: string;
  callback: ScenarioCallback;
};

export type ScenarioMapper = (
  value: any,
  index: number,
  arr: any[],
  suite: iSuite
) => iScenario;

export interface iConsoleLine {
  timestamp: Date;
  fg: [number, number, number];
  message: string;
  type: LineType;
  toConsoleString(): string;
  toString(): string;
}

export interface iLogItem {
  type: LineType;
  className: string;
  message: string;
  passed: boolean;
  failed: boolean;
  isOptional: boolean;
  timestamp: Date;
  toConsole(): iConsoleLine[];
  toJson(): any;
  toCsv(): string;
  toPsv(): string;
  toTsv(): string;
  toHtml(): string;
}

export interface iAssertionResult {
  className: string;
  toConsole(): iConsoleLine[];
  type: LineType;
  message: string;
  passed: boolean;
  failed: boolean;
  isOptional: boolean;
  timestamp: Date;
  toConsole(): iConsoleLine[];
  toJson(): any;
  toCsv(): string;
  toPsv(): string;
  toTsv(): string;
  toHtml(): string;
}

export interface iValue {
  $: any;
  name: string;
  tagName: string;
  outerHTML: string;
  path: string;
  highlight: string;
  parent: any;
  sourceCode: string;
  isFlagpoleValue: true;
  context: iAssertionContext;
  length: iValue;
  trim: iValue;
  uppercase: iValue;
  lowercase: iValue;
  keys: iValue;
  values: iValue;
  first: iValue;
  mid: iValue;
  last: iValue;
  random: iValue;
  array: iValue;
  string: iValue;
  int: iValue;
  float: iValue;
  bool: iValue;
  json: iValue;
  is: iAssertionIs;
  assert(message?: string): iAssertion;
  item(key: string | number): iValue;
  valueOf(): any;
  toArray(): any[];
  toString(): string;
  toInteger(): number;
  toFloat(): number;
  toBoolean(): boolean;
  toURL(baseUrl?: string | URL): URL;
  toJSON(): any;
  toType(): string;
  isNullOrUndefined(): boolean;
  isUndefined(): boolean;
  isNull(): boolean;
  isNaN(): boolean;
  isNumber(): boolean;
  isNumeric(): boolean;
  isObject(): boolean;
  isPromise(): boolean;
  isRegularExpression(): boolean;
  isString(): boolean;
  isArray(): boolean;
  isCookie(): boolean;
  isPuppeteerElement(): boolean;
  isCheerioElement(): boolean;
  isTag(): boolean;
  isTag(...tagNames: string[]): boolean;
  isVisible(): Promise<boolean>;
  isHidden(): Promise<boolean>;
  split(splitter: string | RegExp, limit?: number): iValue;
  join(splitter: string): iValue;
  pluck(property: string): iValue;
  nth(index: number): iValue;
  map(mapper: SyncMapperCallback): iValue;
  filter(callback: SyncIteratorBoolCallback): iValue;
  each(callback: SyncIteratorCallback): iValue;
  every(callback: SyncIteratorBoolCallback): iValue;
  some(callback: SyncIteratorBoolCallback): iValue;
  none(callback: SyncIteratorBoolCallback): iValue;
  reduce(callback: SyncReducerCallback, initial?: any): iValue;
  sum(key?: string): iValue;
  median(key?: string): iValue;
  count(key?: string): iValue;
  avg(key?: string): iValue;
  min(key?: string): iValue;
  max(key?: string): iValue;
  asc(key?: string): iValue;
  desc(key?: string): iValue;
  col(keys: string[]): iValue;
  col(key: string): iValue;
  groupBy(key: string): iValue;
  unique(): iValue;
  //as(aliasName: string): iValue;
  rename(newName: string): iValue;
  echo(callback: (str: string) => void): iValue;
  echo(): iValue;
  // DOM Elements only
  click(): Promise<iValue>;
  submit(): Promise<iValue>;
  open(message: string): iScenario;
  open(message: string, type: ScenarioType): iScenario;
  open(message: string, type: ScenarioType, callback: iNextCallback): iScenario;
  open(message: string, callback: iNextCallback): iScenario;
  open(callback: iNextCallback): iScenario;
  open(scenario: iScenario): iScenario;
  fillForm(attribute: string, formData: KeyValue): Promise<iValue>;
  fillForm(formData: KeyValue): Promise<iValue>;
  getInnerText(): Promise<iValue>;
  getInnerHtml(): Promise<iValue>;
  getOuterHtml(): Promise<iValue>;
  setValue(text: string): Promise<void>;
  getBounds(boxType?: string): Promise<iBounds | null>;
  getUrl(): Promise<iValue>;
  getLink(): Promise<Link>;
  getStyleProperty(key: string): Promise<iValue>;
  getValue(): Promise<iValue>;
  getText(): Promise<iValue>;
  getClassName(): Promise<iValue>;
  getAttribute(key: string): Promise<iValue>;
  getProperty(key: string): Promise<iValue>;
  getTag(): Promise<iValue>;
  hasTag(tag?: string | RegExp): Promise<boolean>;
  hasAttribute(key: string, value?: string | RegExp): Promise<boolean>;
  hasClassName(className: string | RegExp): Promise<boolean>;
  hasText(text?: string | RegExp): Promise<boolean>;
  hasProperty(key: string, value?: any): Promise<boolean>;
  hasValue(value?: any): Promise<boolean>;
  download(): Promise<HttpResponse | null>;
  download(localFilePath: string): Promise<HttpResponse | null>;
  download(
    localFilePath: string,
    opts: HttpRequestOptions
  ): Promise<HttpResponse | null>;
  download(opts: HttpRequestOptions): Promise<HttpResponse | null>;
  screenshot(): Promise<Buffer>;
  screenshot(localFilePath: string): Promise<Buffer>;
  screenshot(localFilePath: string, opts: ScreenshotOpts): Promise<Buffer>;
  screenshot(opts: ScreenshotOpts): Promise<Buffer>;
  focus(): Promise<iValue>;
  blur(): Promise<iValue>;
  hover(): Promise<iValue>;
  tap(duration?: number, tapType?: TapType): Promise<iValue>;
  press(key: string, opts?: any): Promise<iValue>;
  clearThenType(textToType: string, opts?: any): Promise<iValue>;
  type(textToType: string, opts?: any): Promise<iValue>;
  clear(): Promise<iValue>;
  eval(js: EvaluateFn<any>, ...args: SerializableOrJSHandle[]): Promise<any>;
  selectOption(value: string | string[]): Promise<void>;
  pressEnter(): Promise<iValue>;
  scrollTo(): Promise<void>;
  waitForFunction(
    js: EvaluateFn<any>,
    timeout: number,
    ...args: SerializableOrJSHandle[]
  ): Promise<iValue>;
  waitForFunction(
    js: EvaluateFn<any>,
    opts?: PageFnOptions,
    ...args: SerializableOrJSHandle[]
  ): Promise<iValue>;
  waitForHidden(timeout?: number): Promise<iValue>;
  waitForVisible(timeout?: number): Promise<iValue>;
  // Tree traversal
  exists(selector?: string): Promise<iValue>;
  find(selector: string, opts?: FindOptions): ValuePromise;
  find(selector: string, contains: string, opts?: FindOptions): ValuePromise;
  find(selector: string, matches: RegExp, opts?: FindOptions): ValuePromise;
  findAll(selector: string, opts?: FindAllOptions): Promise<iValue[]>;
  findAll(
    selector: string,
    contains: string,
    opts?: FindAllOptions
  ): Promise<iValue[]>;
  findAll(
    selector: string,
    matches: RegExp,
    opts?: FindAllOptions
  ): Promise<iValue[]>;
  getChildren(selector?: string): Promise<iValue[]>;
  getFirstChild(selector?: string): Promise<iValue>;
  getLastChild(selector?: string): Promise<iValue>;
  getChildOrSelf(selector: string): Promise<iValue>;
  getDescendants(selector: string): Promise<iValue[]>;
  getDescendantOrSelf(selector: string): Promise<iValue>;
  getParent(): Promise<iValue>;
  getAncestor(selector: string): Promise<iValue>;
  getAncestors(selector: string): Promise<iValue[]>;
  getAncestorOrSelf(selector: string): Promise<iValue>;
  getSiblings(selector?: string): Promise<iValue[]>;
  getFirstSibling(selector?: string): Promise<iValue>;
  getLastSibling(selector?: string): Promise<iValue>;
  getPreviousSibling(selector?: string): Promise<iValue>;
  getPreviousSiblings(selector?: string): Promise<iValue[]>;
  getNextSibling(selector?: string): Promise<iValue>;
  getNextSiblings(selector?: string): Promise<iValue[]>;
  gesture(type: GestureType, opts: GestureOpts): Promise<iValue>;
}

/**
 * Responses may be HTML or JSON, so this interface let's us know how to handle either
 */
export interface iResponse {
  responseType: ScenarioType;
  responseTypeName: string;
  statusCode: iValue;
  statusMessage: iValue;
  body: iValue;
  jsonBody: iValue;
  url: iValue; // The URL initially requested
  finalUrl: iValue; // The URL after any redirects
  currentUrl: iValue; // The URL right now, after any further navigation
  length: iValue;
  loadTime: iValue;
  context: iAssertionContext;
  headers: iValue;
  cookies: iValue;
  trailers: iValue;
  method: iValue;
  isBrowser: boolean;
  readonly scenario: iScenario;
  init(res: HttpResponse): void;
  navigate(req: iHttpRequest): Promise<void>;
  getRoot(): any;
  find(path: string, opts?: FindOptions): ValuePromise;
  find(path: string, contains: string, opts?: FindOptions): ValuePromise;
  find(path: string, mathces: RegExp, opts?: FindOptions): ValuePromise;
  findAll(path: string, opts?: FindAllOptions): Promise<iValue[]>;
  findAll(
    path: string,
    contains: string,
    opts?: FindAllOptions
  ): Promise<iValue[]>;
  findAll(
    path: string,
    matches: RegExp,
    opts?: FindAllOptions
  ): Promise<iValue[]>;
  findXPath(xPath: string): Promise<iValue>;
  findAllXPath(xPath: string): Promise<iValue[]>;
  header(key?: string): iValue;
  cookie(key?: string): iValue;
  absolutizeUri(uri: string): string;
  eval(js: EvaluateFn<any>, ...args: SerializableOrJSHandle[]): Promise<any>;
  waitForNavigation(
    timeout?: number,
    waitFor?: string | string[]
  ): Promise<void>;
  waitForLoad(timeout?: number): Promise<void>;
  waitForNetworkIdle(timeout?: number): Promise<void>;
  waitForReady(timeout?: number): Promise<void>;
  waitForFunction(
    js: EvaluateFn<any>,
    opts?: PageFnOptions,
    ...args: SerializableOrJSHandle[]
  ): Promise<void>;
  waitForHidden(selector: string, timeout?: number): Promise<iValue>;
  waitForVisible(selector: string, timeout?: number): Promise<iValue>;
  waitForExists(selector: string, timeout?: number): Promise<iValue>;
  waitForExists(
    selector: string,
    contains: string | RegExp,
    timeout?: number
  ): Promise<iValue>;
  waitForNotExists(selector: string, timeout?: number): Promise<iValue>;
  waitForNotExists(
    selector: string,
    contains: string | RegExp,
    timeout?: number
  ): Promise<iValue>;
  waitForXPath(xPath: string, timeout?: number): Promise<iValue>;
  waitForHavingText(
    selector: string,
    text: string | RegExp,
    timeout?: number
  ): Promise<iValue>;
  screenshot(): Promise<Buffer>;
  screenshot(localFilePath: string): Promise<Buffer>;
  screenshot(localFilePath: string, opts: ScreenshotOpts): Promise<Buffer>;
  screenshot(opts: ScreenshotOpts): Promise<Buffer>;
  clear(selector: string): ValuePromise;
  type(selector: string, textToType: string, opts: any): ValuePromise;
  clearThenType(selector: string, textToType: string, opts: any): ValuePromise;
  selectOption(selector: string, value: string | string[]): Promise<void>;
  scrollTo(point: OptionalXY): Promise<iResponse>;
  click(selector: string, opts?: FindOptions): Promise<iValue>;
  click(
    selector: string,
    contains: string,
    opts?: FindOptions
  ): Promise<iValue>;
  click(selector: string, matches: RegExp, opts?: FindOptions): Promise<iValue>;
  serialize(): object;
  movePointer(...pointers: PointerMove[]): Promise<iResponse>;
  gesture(type: GestureType, opts: GestureOpts): Promise<iResponse>;
  rotateScreen(rotation: string | number): Promise<string | number>;
  getScreenProperties(): Promise<ScreenProperties>;
  hideKeyboard(): Promise<void>;
}

export interface iAssertionIs {
  not: iAssertionIs;
  optional: iAssertionIs;
  email(): iAssertion;
  alpha(): iAssertion;
  alphaNumeric(): iAssertion;
  ascii(): iAssertion;
  creditCard(): iAssertion;
  currency(): iAssertion;
  decimal(): iAssertion;
  float(): iAssertion;
  ip(): iAssertion;
  integer(): iAssertion;
  json(): iAssertion;
  jwt(): iAssertion;
  numeric(): iAssertion;
  postalCode(locale?: validator.PostalCodeLocale): iAssertion;
  url(): iAssertion;
  mobilePhone(locale?: validator.MobilePhoneLocale): iAssertion;
  boolean(): iAssertion;
  base32(): iAssertion;
  base64(): iAssertion;
  beforeDate(date?: string): iAssertion;
  afterDate(date?: string): iAssertion;
  sameOrAfterDate(date?: string): iAssertion;
  sameOrBeforeDate(date?: string): iAssertion;
  dataUri(): iAssertion;
  empty(): iAssertion;
  fqdn(): iAssertion;
  hash(): iAssertion;
  hexColor(): iAssertion;
  hexadecimal(): iAssertion;
  in(values: any[]): iAssertion;
  latLong(): iAssertion;
  lowercase(): iAssertion;
  md5(): iAssertion;
  mimeType(): iAssertion;
  octal(): iAssertion;
  port(): iAssertion;
  rgbColor(): iAssertion;
  slug(): iAssertion;
  uuid(): iAssertion;
  uppercase(): iAssertion;
  date(): iAssertion;
  null(): iAssertion;
  undefined(): iAssertion;
  string(): iAssertion;
  array(): iAssertion;
  object(): iAssertion;
  number(): iAssertion;
  regionCode(countries?: ("US" | "CA")[]): iAssertion;
  countryCode(format: "iso-alpha-2" | "iso-alpha-3"): iAssertion;
  timezone(): iAssertion;
}

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
  eval(
    js: EvaluateFn<any>,
    ...args: SerializableOrJSHandle[]
  ): Promise<iAssertion>;
  evalEvery(
    js: EvaluateFn<any>,
    ...args: SerializableOrJSHandle[]
  ): Promise<iAssertion>;
  execute(
    bool: boolean,
    actualValue: any,
    highlightText?: string | null
  ): iAssertion;
}

export interface iAssertionContext {
  result: any;
  request: iHttpRequest;
  response: iResponse;
  scenario: iScenario;
  suite: iSuite;
  browserControl: BrowserControl | null;
  executionOptions: FlagpoleExecution;
  page: Page | null;
  incompleteAssertions: iAssertion[];
  assertionsResolved: Promise<(iAssertionResult | null)[]>;
  subScenariosResolved: Promise<any[]>;
  currentUrl: iValue;
  comment(input: any): iAssertionContext;
  assert(a: any, b?: any): iAssertion;
  pause(milliseconds: number): Promise<void>;
  push(aliasName: string, value: any): iAssertionContext;
  set(aliasName: string, value: any): iAssertionContext;
  get<T = any>(aliasName: string): T;
  exists(selector: string | string[], opts?: FindOptions): ValuePromise;
  exists(
    selector: string | string[],
    contains: string,
    opts?: FindOptions
  ): ValuePromise;
  exists(
    selector: string | string[],
    matches: RegExp,
    opts?: FindOptions
  ): ValuePromise;
  existsAll(selector: string | string[], opts?: FindOptions): Promise<iValue[]>;
  existsAll(
    selector: string | string[],
    contains: string,
    opts?: FindOptions
  ): Promise<iValue[]>;
  existsAll(
    selector: string | string[],
    matches: RegExp,
    opts?: FindOptions
  ): Promise<iValue[]>;
  existsAny(selectors: string[], opts?: FindOptions): Promise<iValue[]>;
  existsAny(
    selector: string[],
    contains: string,
    opts?: FindOptions
  ): Promise<iValue[]>;
  existsAny(
    selector: string[],
    matches: RegExp,
    opts?: FindOptions
  ): Promise<iValue[]>;
  find(selector: string | string[], opts?: FindOptions): ValuePromise;
  find(
    selector: string | string[],
    contains: string,
    opts?: FindOptions
  ): ValuePromise;
  find(
    selector: string | string[],
    matches: RegExp,
    opts?: FindOptions
  ): ValuePromise;
  findAll(
    selector: string | string[],
    opts?: FindAllOptions
  ): Promise<iValue[]>;
  findAll(
    selector: string | string[],
    contains: string,
    opts?: FindAllOptions
  ): Promise<iValue[]>;
  findAll(
    selector: string | string[],
    matches: RegExp,
    opts?: FindAllOptions
  ): Promise<iValue[]>;
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
  eval(js: EvaluateFn<any>, ...args: SerializableOrJSHandle[]): Promise<any>;
  waitForFunction(
    js: EvaluateFn<any>,
    opts?: { polling?: string | number; timeout?: number },
    ...args: SerializableOrJSHandle[]
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
  abort(message?: string): Promise<iScenario>;
  rotateScreen(rotation: string | number): Promise<string | number>;
  getScreenProperties(): Promise<ScreenProperties>;
  hideKeyboard(): Promise<void>;
  movePointer(...pointers: PointerMove[]): Promise<iResponse>;
  gesture(type: GestureType, opts: GestureOpts): Promise<iResponse>;
}
export interface iSuite {
  scenarios: Array<iScenario>;
  baseUrl: URL | null;
  failCount: number;
  hasPassed: boolean;
  hasFailed: boolean;
  hasExecuted: boolean;
  hasFinished: boolean;
  totalDuration: number | null;
  executionDuration: number | null;
  maxScenarioDuration: number;
  maxSuiteDuration: number;
  concurrencyLimit: number;
  title: string;
  finished: Promise<void>;
  executionOptions: FlagpoleExecution;
  import(scenario: iScenario): iScenario;
  subscribe(callback: SuiteStatusCallback): iSuite;
  verifyCert(verify: boolean): iSuite;
  verifySslCert(verify: boolean): iSuite;
  wait(bool?: boolean): iSuite;
  print(exitAfterPrint?: boolean): void;
  scenario(
    title: string,
    type: "browser" | "extjs",
    opts?: BrowserOptions
  ): iScenario;
  scenario(title: string, type?: ScenarioType, opts?: any): iScenario;
  json(title: string): iScenario;
  image(title: string): iScenario;
  html(title: string): iScenario;
  resource(title: string): iScenario;
  browser(title: string, opts?: BrowserOptions): iScenario;
  extjs(title: string, opts?: BrowserOptions): iScenario;
  base(url: string | KeyValue): iSuite;
  execute(): iSuite;
  beforeAll(callback: SuiteCallback): iSuite;
  beforeEach(callback: ScenarioCallback): iSuite;
  afterEach(callback: ScenarioCallback): iSuite;
  afterAll(callback: SuiteCallback): iSuite;
  success(callback: SuiteCallback): iSuite;
  failure(callback: SuiteCallback): iSuite;
  finally(callback: SuiteCallback): iSuite;
  promise(): Promise<iSuite>;
  mapScenarios(key: string, mapper: ScenarioMapper): Promise<iScenario[]>;
  mapScenarios(arr: any[], mapper: ScenarioMapper): Promise<iScenario[]>;
  push(key: string, value: any): iSuite;
  set<T = any>(key: string, value: any): iSuite;
  get<T = any>(key: string): T;
  template(
    templateOptions: ScenarioInitOptions
  ): (title: string, scenarioOptions: ScenarioInitOptions) => iScenario;
}

export interface iScenario {
  opts: any;
  suite: iSuite;
  responseType: ScenarioType;
  title: string;
  totalDuration: number | null;
  executionDuration: number | null;
  requestDuration: number | null;
  hasFailed: boolean;
  hasPassed: boolean;
  isReadyToExecute: boolean;
  hasExecuted: boolean;
  hasFinished: boolean;
  hasRequestStarted: boolean;
  buildUrl(): URL;
  url: string | null;
  finalUrl: string | null;
  redirectCount: number;
  redirectChain: string[];
  request: iHttpRequest;
  browserControl: BrowserControl | null;
  hasAborted: boolean;
  hasBeenCancelled: boolean;
  hasBeenSkipped: boolean;
  isPending: boolean;
  isExecuting: boolean;
  isCompleted: boolean;
  disposition: ScenarioDisposition;
  nextCallbacks: Array<{
    message: string;
    callback: iNextCallback;
  }>;
  push(aliasName: string, value: any): iScenario;
  set(aliasName: string, value: any): iScenario;
  get<T = any>(aliasName: string): T;
  getLog(): Promise<iLogItem[]>;
  subscribe(callback: ScenarioStatusCallback): iScenario;
  setJsonBody(jsonObject: any): iScenario;
  setRawBody(str: string): iScenario;
  verifyCert(verify: boolean): iScenario;
  setProxy(proxy: HttpProxy): iScenario;
  setTimeout(timeout: number): iScenario;
  setTimeout(timeout: HttpTimeout): iScenario;
  setFormData(form: FormData): iScenario;
  setFormData(form: KeyValue, isMultipart?: boolean): iScenario;
  setMaxRedirects(n: number): iScenario;
  setBasicAuth(authorization: HttpAuth): iScenario;
  setDigestAuth(authorization: HttpAuth): iScenario;
  setBearerToken(token: string): iScenario;
  setCookies(cookies: KeyValue): iScenario;
  setCookie(key: string, value: string): iScenario;
  setHeaders(headers: KeyValue): iScenario;
  setHeader(key: string, value: any): iScenario;
  setMethod(method: HttpMethodVerb): iScenario;
  wait(bool?: boolean): iScenario;
  comment(input: any): iScenario;
  result(result: iAssertionResult): iScenario;
  ignore(assertions?: boolean | Function): iScenario;
  open(url: string, opts?: HttpRequestOptions): iScenario;
  open(link: iValue, opts?: HttpRequestOptions): iScenario;
  next(callback: iNextCallback): iScenario;
  next(...callbacks: iNextCallback[]): iScenario;
  next(message: string, callback: iNextCallback): iScenario;
  next(responseValues: { [key: string]: any }): iScenario;
  next(message: string, responseValues: { [key: string]: any }): iScenario;
  nextPrepend(callback: iNextCallback): iScenario;
  nextPrepend(message: string, callback: iNextCallback): iScenario;
  skip(message?: string): Promise<iScenario>;
  abort(message?: string): Promise<iScenario>;
  cancel(message?: string): Promise<iScenario>;
  cancelOrAbort(message?: string): Promise<iScenario>;
  execute(): Promise<iScenario>;
  execute(params: { [key: string]: string | number }): Promise<iScenario>;
  success(message: string, callback: ScenarioCallback): iScenario;
  success(callback: ScenarioCallback): iScenario;
  success(...callbacks: ScenarioCallback[]): iScenario;
  failure(message: string, callback: ScenarioCallback): iScenario;
  failure(callback: ScenarioCallback): iScenario;
  failure(...callbacks: ScenarioCallback[]): iScenario;
  pipe(message: string, callback: ResponsePipe): iScenario;
  pipe(callback: ResponsePipe): iScenario;
  pipe(...callbacks: ResponsePipe[]): iScenario;
  before(message: string, callback: ScenarioCallback): iScenario;
  before(callback: ScenarioCallback): iScenario;
  before(...callbacks: ScenarioCallback[]): iScenario;
  after(message: string, callback: ScenarioCallback): iScenario;
  after(callback: ScenarioCallback): iScenario;
  after(...callbacks: ScenarioCallback[]): iScenario;
  finally(message: string, callback: ScenarioCallback): iScenario;
  finally(callback: ScenarioCallback): iScenario;
  finally(...callbacks: ScenarioCallback[]): iScenario;
  mock(): iScenario;
  mock(content: string): iScenario;
  mock(response: HttpResponseOptions): iScenario;
  local(localPath: string): iScenario;
  webhook(): iScenario;
  webhook(route: string): iScenario;
  webhook(route: string, port: number): iScenario;
  webhook(route: string, port: number, opts: ServerOptions): iScenario;
  webhook(route: string, opts: ServerOptions): iScenario;
  webhook(port: number): iScenario;
  webhook(port: number, opts: ServerOptions): iScenario;
  webhook(opts: ServerOptions): iScenario;
  server(): Promise<WebhookServer>;
  setResponseType(type: ScenarioType, opts?: KeyValue): iScenario;
  promise(): Promise<iScenario>;
  waitForFinished(): Promise<iScenario>;
  waitForResponse(): Promise<iScenario>;
  waitFor(thatScenario: iScenario): iScenario;
  repeat(): iScenario;
  repeat(count: number): iScenario[];
}

export interface iMessageAndCallback {
  isSubScenario: boolean;
  message: string;
  callback: iNextCallback;
  scenario?: iScenario;
}

export interface iBounds {
  x: number;
  y: number;
  width: number;
  height: number;
  left: number;
  right: number;
  top: number;
  bottom: number;
  middle: { x: number; y: number };
  points: { x: number; y: number }[];
}

export type KeyValue = {
  [key: string]: any;
};

export type AssertSchemaType = "JsonSchema" | "JTD";

export type AjvErrors =
  | ErrorObject<string, Record<string, any>, unknown>[]
  | null
  | undefined;

export interface HttpResponseOptions {
  body?: any;
  status?: [number, string];
  headers?: KeyValue;
  cookies?: KeyValue;
  trailers?: KeyValue;
  method?: string;
  url?: string;
}

export interface WebhookServer {
  port: number;
  opts: ServerOptions;
  server: Server;
}

export interface BrowserOptions extends LaunchOptions {
  width?: number;
  height?: number;
  recordConsole?: boolean;
  outputConsole?: boolean;
  product?: "chrome" | "firefox";
  ignoreHTTPSErrors?: boolean;
  headless?: boolean;
  executablePath?: string;
  slowMo?: number;
  args?: string[];
  ignoreDefaultArgs?: boolean | string[];
  timeout?: number;
  devtools?: boolean;
  defaultViewport?: {
    width?: number;
    height?: number;
    deviceScaleFactor?: number;
    isMobile?: boolean;
    hasTouch?: boolean;
    isLandscape?: boolean;
  };
  handleSIGINT?: boolean;
  handleSIGTERM?: boolean;
  handleSIGHUP?: boolean;
  dumpio?: boolean;
  userDataDir?: string;
  env?: { [key: string]: any };
  pipe?: boolean;
  extraPrefsFirefox?: any;
}

export type HttpRequestFetch = (
  request: iHttpRequest,
  opts?: KeyValue
) => Promise<HttpResponse>;

export type HttpMethodVerb =
  | "get"
  | "head"
  | "delete"
  | "patch"
  | "post"
  | "put"
  | "options";

export type HttpAuthType = "basic" | "digest" | "auto";

export type HttpAuth = {
  username: string;
  password: string;
};

export type HttpTimeout = {
  read?: number;
  open?: number;
  response?: number;
};

export type HttpProxy = {
  host: string;
  port: number;
  auth: HttpAuth;
};

export type HttpData =
  | Buffer
  | KeyValue
  | NodeJS.ReadableStream
  | string
  | null
  | undefined;

export type HttpRequestOptions = {
  browserOptions?: BrowserOptions;
  auth?: HttpAuth;
  authType?: HttpAuthType;
  data?: HttpData;
  cookies?: KeyValue;
  headers?: KeyValue;
  maxRedirects?: number;
  method?: HttpMethodVerb;
  outputFile?: string;
  proxy?: HttpProxy;
  timeout?: HttpTimeout | number;
  type?: ScenarioType;
  uri?: string | null;
  /**
   * For https, should we reject unauthorized certs?
   */
  verifyCert?: boolean;
  cacheKey?: string;
};

export interface iHttpRequest {
  uri: string | null;
  method: HttpMethodVerb;
  headers: KeyValue;
  cookies: KeyValue;
  verifyCert: boolean;
  proxy: HttpProxy | undefined;
  timeout: HttpTimeout;
  maxRedirects: number;
  auth: HttpAuth | undefined;
  authType?: HttpAuthType;
  data: HttpData;
  browser: BrowserOptions;
  type: ScenarioType;
  outputFile?: string;
  options: HttpRequestOptions;
  proxyAgent?: http.Agent;
}

export const CONTENT_TYPE_JSON = "application/json";
export const CONTENT_TYPE_SOAP = "application/soap+xml";
export const CONTENT_TYPE_FORM_MULTIPART = "multipart/form-data";
export const CONTENT_TYPE_FORM = "application/x-www-form-urlencoded";
export const ENCODING_GZIP = "gzip,deflate";

export interface ScenarioInitOptions {
  type?: ScenarioType;
  bearerToken?: string;
  url?: string;
  httpRequestOpts?: HttpRequestOptions;
  jsonBody?: any;
  method?: HttpMethodVerb;
  headers?: KeyValue;
  cookies?: KeyValue;
  rawBody?: string;
  proxy?: HttpProxy;
  timeout?: number;
  formData?: KeyValue;
  basicAuth?: HttpAuth;
  digestAuth?: HttpAuth;
  maxRedirects?: number;
  next?: iNextCallback | { [title: string]: iNextCallback } | iNextCallback[];
  set?: KeyValue;
  statusCode?: number;
  maxLoadTime?: number;
  opts?: any;
}

export type AppiumElementIdResponse = {
  [0]: string;
  ELEMENT: string;
};

export type ScreenProperties = {
  angle: string | number;
  dimensions: {
    height: number;
    width: number;
  };
  orientation: string;
};

export interface DeviceProperties {
  airplaneMode?: boolean;
  locationServices?: boolean;
  wifi?: boolean;
  mobileData?: boolean;
  location?: {
    latitude: number;
    longitude: number;
    altitude?: number;
  };
}
