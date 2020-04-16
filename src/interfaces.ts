import { BrowserControl } from "./browsercontrol";
import { Page } from "puppeteer-core";
import {
  LogItemType,
  ConsoleLineType,
  ConsoleColor,
  ResponseType,
  SuiteStatusEvent,
  ScenarioStatusEvent,
} from "./enums";
import { HttpResponse } from "./httpresponse";
import { URL } from "url";
import { FlagpoleExecutionOptions } from "./flagpoleexecutionoptions";
import {
  HttpRequest,
  HttpRequestOptions,
  HttpProxy,
  HttpTimeout,
  HttpAuth,
  HttpMethodVerb,
  BrowserOptions,
} from "./httprequest";

export interface ScreenshotOpts {
  path?: string;
  fullPage?: boolean;
  clip?: { x: number; y: number; width: number; height: number };
  omitBackground?: boolean;
}

export interface iNextCallback {
  (context: iAssertionContext): Promise<any> | void;
}

export type ResponsePipe = (resp: HttpResponse) => void | HttpResponse;
export type ScenarioCallback = (scenario: iScenario) => any;
export type ScenarioErrorCallback = (error: string, scenario: iScenario) => any;
export type ScenarioStatusCallback = (
  scenario: iScenario,
  status: ScenarioStatusEvent
) => any;
export type ScenarioOnCompleted = (scenario: iScenario) => Promise<void>;
export type SuiteCallback = (scenario: iSuite) => any;
export type SuiteErrorCallback = (error: string, scenario: iSuite) => any;
export type SuiteStatusCallback = (
  suite: iSuite,
  statusEvent: SuiteStatusEvent
) => any;
export type SuiteBaseCallback = (suite: iSuite) => string;
export type IteratorCallback = (value: any, index: number, arr: any[]) => any;

export interface iConsoleLine {
  timestamp: Date;
  color: ConsoleColor;
  message: string;
  type: ConsoleLineType;
  toConsoleString(): string;
  toString(): string;
}

export interface iLogItem {
  type: LogItemType;
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
  type: LogItemType;
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
  length: iValue;
  highlight: string;
  parent: any;
  sourceCode: string;
  valueOf(): any;
  toArray(): any[];
  toString(): string;
  toInteger(): number;
  toFloat(): number;
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
  hasProperty(key: string): Promise<iValue>;
  as(aliasName: string): iValue;
  // DOM Elements only
  click(): Promise<void>;
  click(scenario: iScenario): Promise<iScenario>;
  click(message: string): Promise<iScenario>;
  click(callback: Function): Promise<iScenario>;
  click(message: string, callback: Function): Promise<iScenario>;
  submit(): Promise<void>;
  submit(scenario: iScenario): Promise<iScenario>;
  submit(message: string): Promise<iScenario>;
  submit(callback: Function): Promise<iScenario>;
  submit(message: string, callback: Function): Promise<iScenario>;
  load(): void;
  load(message: string): iScenario;
  load(scenario: iScenario): iScenario;
  load(callback: Function): iScenario;
  load(message: string, callback: Function): iScenario;
  fillForm(formData: any): Promise<void>;
  exists(): Promise<iValue>;
  exists(selector: string): Promise<iValue>;
  find(selector: string): Promise<iValue>;
  findAll(selector: string): Promise<iValue[]>;
  getClassName(): Promise<iValue>;
  hasClassName(className: string): Promise<iValue>;
  getTagName(): Promise<iValue>;
  getInnerText(): Promise<iValue>;
  getInnerHtml(): Promise<iValue>;
  getOuterHtml(): Promise<iValue>;
  hasAttribute(key: string): Promise<iValue>;
  getAttribute(key: string): Promise<iValue>;
  getProperty(key: string): Promise<iValue>;
  hasData(key: string): Promise<iValue>;
  getData(key: string): Promise<iValue>;
  getValue(): Promise<iValue>;
  getText(): Promise<iValue>;
  getStyleProperty(key: string): Promise<iValue>;
  download(): Promise<Buffer | null>;
  download(localFilePath: string): Promise<Buffer | null>;
  download(
    localFilePath: string,
    opts: HttpRequestOptions
  ): Promise<Buffer | null>;
  download(opts: HttpRequestOptions): Promise<Buffer | null>;
  download(
    localFilePath: string,
    opts: HttpRequestOptions
  ): Promise<string | null>;
  download(opts: HttpRequestOptions): Promise<string | null>;
  screenshot(): Promise<Buffer>;
  screenshot(localFilePath: string): Promise<Buffer>;
  screenshot(localFilePath: string, opts: ScreenshotOpts): Promise<Buffer>;
  screenshot(opts: ScreenshotOpts): Promise<Buffer>;
}

/**
 * Responses may be HTML or JSON, so this interface let's us know how to handle either
 */
export interface iResponse {
  responseType: ResponseType;
  responseTypeName: string;
  statusCode: iValue;
  statusMessage: iValue;
  body: iValue;
  jsonBody: iValue;
  url: iValue;
  finalUrl: iValue;
  length: iValue;
  loadTime: iValue;
  context: iAssertionContext;
  headers: iValue;
  cookies: iValue;
  isBrowser: boolean;
  init(httpResponse: HttpResponse): void;
  getRoot(): any;
  find(path: string): Promise<iValue>;
  findAll(path: string): Promise<iValue[]>;
  findHavingText(
    selector: string,
    searchForText: string | RegExp
  ): Promise<iValue>;
  findAllHavingText(
    selector: string,
    searchForText: string | RegExp
  ): Promise<iValue[]>;
  findXPath(xPath: string): Promise<iValue>;
  findAllXPath(xPath: string): Promise<iValue[]>;
  header(key?: string): iValue;
  cookie(key?: string): iValue;
  absolutizeUri(uri: string): string;
  evaluate(context: any, callback: Function): Promise<any>;
  waitForNavigation(
    timeout: number,
    waitFor?: string | string[]
  ): Promise<void>;
  waitForLoad(timeout: number): Promise<void>;
  waitForNetworkIdle(timeout: number): Promise<void>;
  waitForReady(timeout: number): Promise<void>;
  waitForHidden(selector: string, timeout: number): Promise<iValue>;
  waitForVisible(selector: string, timeout: number): Promise<iValue>;
  waitForExists(selector: string, timeout?: number): Promise<iValue>;
  waitForHavingText(
    selector: string,
    text: string,
    timeout?: number
  ): Promise<iValue>;
  waitForXPath(xPath: string, timeout?: number): Promise<iValue>;
  screenshot(): Promise<Buffer>;
  screenshot(localFilePath: string): Promise<Buffer>;
  screenshot(localFilePath: string, opts: ScreenshotOpts): Promise<Buffer>;
  screenshot(opts: ScreenshotOpts): Promise<Buffer>;
  clear(selector: string): Promise<any>;
  type(selector: string, textToType: string, opts: any): Promise<any>;
  selectOption(selector: string, value: string | string[]): Promise<string[]>;
  readonly scenario: iScenario;
}

export interface iAssertion {
  and: iAssertion;
  type: iAssertion;
  length: iAssertion;
  keys: iAssertion;
  values: iAssertion;
  not: iAssertion;
  optional: iAssertion;
  result: Promise<any>;
  assertionMade: boolean;
  name: string;
  passed: boolean | null;
  isFinalized: boolean;
  as(aliasName: string): iAssertion;
  exactly(value: any): iAssertion;
  equals(value: any): iAssertion;
  like(value: any): iAssertion;
  greaterThan(value: any): iAssertion;
  greaterThanOrEquals(value: any): iAssertion;
  lessThan(value: any): iAssertion;
  lessThanOrEquals(value: any): iAssertion;
  between(min: any, max: any): iAssertion;
  matches(value: any): iAssertion;
  contains(value: any): iAssertion;
  startsWith(value: any): iAssertion;
  endsWith(value: any): iAssertion;
  in(values: any[]): iAssertion;
  includes(value: any): iAssertion;
  exists(): iAssertion;
  resolves(continueOnReject?: boolean): Promise<iAssertion>;
  rejects(continueOnReject?: boolean): Promise<any>;
  none(callback: IteratorCallback): Promise<iAssertion>;
  every(callback: IteratorCallback): Promise<iAssertion>;
  some(callback: IteratorCallback): Promise<iAssertion>;
  schema(schema: any, simple?: boolean): Promise<iAssertion>;
  assert(a: any, b?: any): iAssertion;
  comment(value: iValue): iAssertion;
  comment(message: string): iAssertion;
  comment(input: string | iValue): iAssertion;
  looksLike(image: Buffer | string): iAssertion;
  looksLike(image: Buffer | string, threshhold: number): iAssertion;
  looksLike(image: Buffer | string, percent: string): iAssertion;
}

export interface iAssertionContext {
  result: any;
  response: iResponse;
  scenario: iScenario;
  suite: iSuite;
  browserControl: BrowserControl | null;
  executionOptions: FlagpoleExecutionOptions;
  page: Page | null;
  incompleteAssertions: iAssertion[];
  assertionsResolved: Promise<(iAssertionResult | null)[]>;
  subScenariosResolved: Promise<any[]>;
  comment(value: iValue): iAssertionContext;
  comment(message: string): iAssertionContext;
  comment(input: string | iValue): iAssertionContext;
  assert(a: any, b?: any): iAssertion;
  pause(milliseconds: number): Promise<void>;
  exists(message: string, selector: string): Promise<iValue>;
  exists(selector: string): Promise<iValue>;
  set(aliasName: string, value: any): iAssertionContext;
  get(aliasName: string): any;
  find(selector: string): Promise<iValue>;
  findAll(selector: string): Promise<iValue[]>;
  findHavingText(
    selector: string,
    searchForText: string | RegExp
  ): Promise<iValue>;
  findAllHavingText(
    selector: string,
    searchForText: string | RegExp
  ): Promise<iValue[]>;
  clearThenType(selector: string, textToType: string, opts?: any): Promise<any>;
  clear(selector: string): Promise<void>;
  click(selector: string): Promise<void>;
  click(selector: string, scenario: iScenario): Promise<iScenario>;
  click(selector: string, message: string): Promise<iScenario>;
  click(selector: string, callback: Function): Promise<iScenario>;
  click(
    selector: string,
    message: string,
    callback: Function
  ): Promise<iScenario>;
  submit(selector: string): Promise<void>;
  submit(selector: string, scenario: iScenario): Promise<iScenario>;
  submit(selector: string, message: string): Promise<iScenario>;
  submit(selector: string, callback: Function): Promise<iScenario>;
  submit(
    selector: string,
    message: string,
    callback: Function
  ): Promise<iScenario>;
  type(selector: string, textToType: string, opts?: any): Promise<void>;
  select(selector: string, value: string | string[]): Promise<void>;
  evaluate(callback: Function): Promise<any>;
  waitForReady(timeout?: number): Promise<void>;
  waitForLoad(timeout?: number): Promise<void>;
  waitForNetworkIdle(timeout?: number): Promise<void>;
  waitForNavigation(
    timeout?: number,
    waitFor?: string | string[]
  ): Promise<void>;
  waitForHidden(selector: string, timeout?: number): Promise<iValue>;
  waitForVisible(selector: string, timeout?: number): Promise<iValue>;
  waitForExists(selector: string, timeout?: number): Promise<iValue>;
  openInBrowser(): Promise<string>;
  screenshot(): Promise<Buffer>;
  screenshot(localFilePath: string): Promise<Buffer>;
  screenshot(localFilePath: string, opts: {}): Promise<Buffer>;
  screenshot(opts: {}): Promise<Buffer>;
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
  title: string;
  suite: iSuite;
  finished: Promise<void>;
  subscribe(callback: SuiteStatusCallback): iSuite;
  verifyCert(verify: boolean): iSuite;
  verifySslCert(verify: boolean): iSuite;
  wait(bool?: boolean): iSuite;
  print(exitAfterPrint?: boolean): void;
  scenario(title: string, type: ResponseType, opts?: BrowserOptions): iScenario;
  json(title: string): iScenario;
  image(title: string): iScenario;
  video(title: string): iScenario;
  html(title: string): iScenario;
  stylesheet(title: string): iScenario;
  script(title: string): iScenario;
  resource(title: string): iScenario;
  browser(title: string, opts?: BrowserOptions): iScenario;
  extjs(title: string, opts?: BrowserOptions): iScenario;
  base(url: string | KeyValue): iSuite;
  execute(): iSuite;
  beforeAll(callback: SuiteCallback): iSuite;
  beforeEach(callback: ScenarioCallback): iSuite;
  afterEach(callback: ScenarioCallback): iSuite;
  afterAll(callback: SuiteCallback): iSuite;
  error(callback: SuiteErrorCallback): iSuite;
  success(callback: SuiteCallback): iSuite;
  failure(callback: SuiteCallback): iSuite;
  finally(callback: SuiteCallback): iSuite;
  promise(): Promise<iSuite>;
}

export interface iScenario {
  suite: iSuite;
  responseType: ResponseType;
  title: string;
  totalDuration: number | null;
  executionDuration: number | null;
  requestDuration: number | null;
  hasFailed: boolean;
  hasPassed: boolean;
  canExecute: boolean;
  hasExecuted: boolean;
  hasFinished: boolean;
  buildUrl(): URL;
  url: string | null;
  finalUrl: string | null;
  redirectCount: number;
  redirectChain: string[];
  request: HttpRequest;
  set(aliasName: string, value: any): iScenario;
  get(aliasName: string): any;
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
  setCookie(key: string, value: string): iScenario;
  setHeaders(headers: KeyValue): iScenario;
  setHeader(key: string, value: any): iScenario;
  setMethod(method: HttpMethodVerb): iScenario;
  wait(bool?: boolean): iScenario;
  comment(value: iValue): iScenario;
  comment(message: string): iScenario;
  comment(input: string | iValue): iScenario;
  result(result: iAssertionResult): iScenario;
  ignore(assertions?: boolean | Function): iScenario;
  open(url: string, opts?: HttpRequestOptions): iScenario;
  next(callback: iNextCallback): iScenario;
  next(...callbacks: iNextCallback[]): iScenario;
  next(message: string, callback: iNextCallback): iScenario;
  nextPrepend(callback: iNextCallback): iScenario;
  nextPrepend(message: string, callback: iNextCallback): iScenario;
  skip(message?: string): Promise<iScenario>;
  cancel(): Promise<iScenario>;
  getBrowserControl(): BrowserControl;
  execute(): Promise<iScenario>;
  execute(params: { [key: string]: string | number }): Promise<iScenario>;
  error(message: string, callback: ScenarioErrorCallback): iScenario;
  error(callback: ScenarioErrorCallback): iScenario;
  error(...callbacks: ScenarioErrorCallback[]): iScenario;
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
  mock(localPath: string): iScenario;
  setResponseType(
    type: ResponseType,
    opts?: BrowserOptions | HttpRequestOptions
  ): iScenario;
  promise(): Promise<iScenario>;
  waitFor(thatScenario: iScenario): iScenario;
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
  points: { x: number; y: number }[];
}

export type KeyValue = {
  [key: string]: any;
};
