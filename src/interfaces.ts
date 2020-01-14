import { BrowserControl } from "./browsercontrol";
import { Page, LaunchOptions } from "puppeteer-core";
import {
  LogItemType,
  ConsoleLineType,
  ConsoleColor,
  ResponseType
} from "./enums";
import { HttpResponse } from "./httpresponse";
import { URL } from "url";
import { CookieJar } from "tough-cookie";
import { RequestPromiseOptions } from "request-promise";
import { FlagpoleExecutionOptions } from "./flagpoleexecutionoptions";

export interface RequestOptions extends RequestPromiseOptions {
  encoding?: never;
  resolveWithFullResponse?: never | false;
}

export interface RequestOptionsWithEncoding extends RequestPromiseOptions {
  encoding: string;
  resolveWithFullResponse?: never | false;
}

export interface ScreenshotOpts {
  path?: string;
  fullPage?: boolean;
  clip?: { x: number; y: number; width: number; height: number };
  omitBackground?: boolean;
}

export interface iNextCallback {
  (context: iAssertionContext): Promise<any> | void;
}

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
  download(localFilePath: string, opts: RequestOptions): Promise<Buffer | null>;
  download(opts: RequestOptions): Promise<Buffer | null>;
  download(
    localFilePath: string,
    opts: RequestOptionsWithEncoding
  ): Promise<string | null>;
  download(opts: RequestOptionsWithEncoding): Promise<string | null>;
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
  none(callback: Function): iAssertion;
  every(callback: Function): iAssertion;
  some(callback: Function): iAssertion;
  schema(schema: any, simple?: boolean): Promise<iAssertion>;
  assert(a: any, b?: any): iAssertion;
  comment(message: string): iAssertionContext;
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
  comment(message: string): iAssertionContext;
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
  subscribe(callback: Function): iSuite;
  verifySslCert(verify: boolean): iSuite;
  wait(bool?: boolean): iSuite;
  print(exitAfterPrint?: boolean): void;
  scenario(title: string, type: ResponseType, opts: any): iScenario;
  json(title: string, opts?: any): iScenario;
  image(title: string, opts?: any): iScenario;
  video(title: string, opts?: any): iScenario;
  html(title: string, opts?: any): iScenario;
  stylesheet(title: string, opts?: any): iScenario;
  script(title: string, opts?: any): iScenario;
  resource(title: string, opts?: any): iScenario;
  browser(title: string, opts?: any): iScenario;
  extjs(title: string, opts?: any): iScenario;
  base(url: string | {}): iSuite;
  buildUrl(path: string): string;
  execute(): iSuite;
  beforeAll(callback: Function): iSuite;
  beforeEach(callback: Function): iSuite;
  afterEach(callback: Function): iSuite;
  afterAll(callback: Function): iSuite;
  error(callback: Function): iSuite;
  success(callback: Function): iSuite;
  failure(callback: Function): iSuite;
  finally(callback: Function): iSuite;
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
  url: string | null;
  finalUrl: string | null;
  requestUrl: string;
  redirectCount: number;
  redirectChain: string[];
  requestOptions: any;
  set(aliasName: string, value: any): iScenario;
  get(aliasName: string): any;
  getLog(): Promise<iLogItem[]>;
  subscribe(callback: Function): iScenario;
  setJsonBody(jsonObject: any): iScenario;
  setRawBody(str: string): iScenario;
  verifySslCert(verify: boolean): iScenario;
  setProxyUrl(proxyUrl: string): iScenario;
  setTimeout(timeout: number): iScenario;
  setFormData(form: {}): iScenario;
  setMaxRedirects(n: number): iScenario;
  shouldFollowRedirects(onRedirect: boolean | Function): iScenario;
  setBasicAuth(authorization: {
    username: string;
    password: string;
  }): iScenario;
  setBearerToken(token: string): iScenario;
  setCookie(key: string, value: string, opts?: any): iScenario;
  setHeaders(headers: {}): iScenario;
  setHeader(key: string, value: any): iScenario;
  setMethod(method: string): iScenario;
  wait(bool?: boolean): iScenario;
  comment(message: string): iScenario;
  result(result: iAssertionResult): iScenario;
  ignore(assertions?: boolean | Function): iScenario;
  open(url: string): iScenario;
  next(callback: iNextCallback): iScenario;
  next(message: string, callback: iNextCallback): iScenario;
  nextPrepend(callback: iNextCallback): iScenario;
  nextPrepend(message: string, callback: iNextCallback): iScenario;
  skip(message?: string): Promise<iScenario>;
  cancel(): Promise<iScenario>;
  getBrowserControl(): BrowserControl;
  execute(): Promise<iScenario>;
  execute(params: { [key: string]: string | number }): Promise<iScenario>;
  error(message: string, callback: Function): iScenario;
  error(callback: Function): iScenario;
  success(message: string, callback: Function): iScenario;
  success(callback: Function): iScenario;
  failure(message: string, callback: Function): iScenario;
  failure(callback: Function): iScenario;
  before(message: string, callback: Function): iScenario;
  before(callback: Function): iScenario;
  after(message: string, callback: Function): iScenario;
  after(callback: Function): iScenario;
  finally(message: string, callback: Function): iScenario;
  finally(callback: Function): iScenario;
  mock(localPath: string): iScenario;
  setResponseType(type: ResponseType, opts?: any): iScenario;
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

export interface BrowserOptions extends LaunchOptions {
  uri?: string;
  width?: number;
  height?: number;
  jar?: CookieJar;
  recordConsole?: boolean;
  outputConsole?: boolean;
}
