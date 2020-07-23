import { BrowserControl } from "./puppeteer/browsercontrol";
import { Page, EvaluateFn, SerializableOrJSHandle } from "puppeteer-core";
import {
  ResponseType,
  SuiteStatusEvent,
  ScenarioStatusEvent,
  LineType,
} from "./enums";
import { HttpResponse } from "./httpresponse";
import {
  HttpRequest,
  HttpRequestOptions,
  HttpProxy,
  HttpTimeout,
  HttpAuth,
  HttpMethodVerb,
  BrowserOptions,
} from "./httprequest";
import { FlagpoleExecution } from "./flagpoleexecution";
import Bluebird = require("bluebird");
import { Link } from "./link";
//import * as Ajv from "ajv";

interface AjvSchema {
  // TODO: Add this reference
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

export type IteratorCallback = (value: any, index: number, arr: any[]) => any;

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
  length: iValue;
  trim: iValue;
  highlight: string;
  parent: any;
  sourceCode: string;
  isFlagpoleValue: true;
  keys: iValue;
  values: iValue;
  context: iAssertionContext;
  valueOf(): any;
  toArray(): any[];
  toString(): string;
  toInteger(): number;
  toFloat(): number;
  toBoolean(): boolean;
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
  hasProperty(key: string): Promise<iValue>;
  hasValue(key: string): Promise<iValue>;
  as(aliasName: string): iValue;
  // DOM Elements only
  click(): Promise<void>;
  submit(): Promise<void>;
  open(message: string): iScenario;
  open(message: string, type: ResponseType): iScenario;
  open(message: string, type: ResponseType, callback: iNextCallback): iScenario;
  open(message: string, callback: iNextCallback): iScenario;
  open(callback: iNextCallback): iScenario;
  open(scenario: iScenario): iScenario;
  fillForm(attribute: string, formData: KeyValue): Promise<iValue>;
  fillForm(formData: KeyValue): Promise<iValue>;
  exists(): Promise<iValue>;
  exists(message: string): Promise<iValue>;
  find(selector: string, opts?: FindOptions): Promise<iValue>;
  find(selector: string, contains: string, opts?: FindOptions): Promise<iValue>;
  find(selector: string, matches: RegExp, opts?: FindOptions): Promise<iValue>;
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
  getClassName(): Promise<iValue>;
  hasClassName(className: string): Promise<iValue>;
  getTagName(): Promise<iValue>;
  getInnerText(): Promise<iValue>;
  getInnerHtml(): Promise<iValue>;
  getOuterHtml(): Promise<iValue>;
  hasAttribute(key: string): Promise<iValue>;
  getAttribute(key: string): Promise<iValue>;
  getProperty(key: string): Promise<iValue>;
  getClosest(selector?: string): Promise<iValue>;
  getChildren(selector?: string): Promise<iValue[]>;
  getParent(): Promise<iValue>;
  getSiblings(selector?: string): Promise<iValue[]>;
  getPreviousSibling(selector?: string): Promise<iValue>;
  getPreviousSiblings(selector?: string): Promise<iValue[]>;
  getNextSibling(selector?: string): Promise<iValue>;
  getNextSiblings(selector?: string): Promise<iValue[]>;
  getBounds(boxType: string): Promise<iBounds | null>;
  getUrl(): Promise<iValue>;
  getLink(): Promise<Link>;
  hasData(key: string): Promise<iValue>;
  getData(key: string): Promise<iValue>;
  getValue(): Promise<iValue>;
  getText(): Promise<iValue>;
  getStyleProperty(key: string): Promise<iValue>;
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
  focus(): Promise<any>;
  blur(): Promise<any>;
  hover(): Promise<void>;
  tap(): Promise<void>;
  press(key: string, opts?: any): Promise<void>;
  clearThenType(textToType: string, opts?: any): Promise<void>;
  type(textToType: string, opts?: any): Promise<void>;
  clear(): Promise<void>;
  eval(js: EvaluateFn<any>, ...args: SerializableOrJSHandle[]): Promise<any>;
  selectOption(value: string | string[]): Promise<void>;
  pressEnter(): Promise<void>;
  scrollTo(): Promise<void>;
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
  readonly scenario: iScenario;
  init(httpResponse: HttpResponse): void;
  getRoot(): any;
  find(path: string, opts?: FindOptions): Promise<iValue>;
  find(path: string, contains: string, opts?: FindOptions): Promise<iValue>;
  find(path: string, mathces: RegExp, opts?: FindOptions): Promise<iValue>;
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
  waitForHidden(selector: string, timeout?: number): Promise<iValue>;
  waitForVisible(selector: string, timeout?: number): Promise<iValue>;
  waitForExists(selector: string, timeout?: number): Promise<iValue>;
  waitForXPath(xPath: string, timeout?: number): Promise<iValue>;
  screenshot(): Promise<Buffer>;
  screenshot(localFilePath: string): Promise<Buffer>;
  screenshot(localFilePath: string, opts: ScreenshotOpts): Promise<Buffer>;
  screenshot(opts: ScreenshotOpts): Promise<Buffer>;
  clear(selector: string): Promise<any>;
  type(selector: string, textToType: string, opts: any): Promise<any>;
  selectOption(selector: string, value: string | string[]): Promise<void>;
  scrollTo(point: OptionalXY): Promise<iResponse>;
}

export interface iAssertion {
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
  assert(a: any, b?: any): iAssertion;
  comment(input: any): iAssertion;
  schema(schemaName: string, simple?: boolean): Promise<iAssertion>;
  schema(schema: JsonSchema | AjvSchema, simple?: boolean): Promise<iAssertion>;
  looksLike(image: Buffer | string): iAssertion;
  looksLike(image: Buffer | string, threshhold: number): iAssertion;
  looksLike(image: Buffer | string, percent: string): iAssertion;
  hasValue(value: any): Promise<iAssertion>;
  hasProperty(key: string): Promise<iAssertion>;
  hasAttribute(key: string): Promise<iAssertion>;
  hasClassName(key: string): Promise<iAssertion>;
  hasData(key: string): Promise<iAssertion>;
  hasText(text: string): Promise<iAssertion>;
  isTag(...tagNames: string[]): iAssertion;
}

export interface iAssertionContext {
  result: any;
  response: iResponse;
  scenario: iScenario;
  suite: iSuite;
  browserControl: BrowserControl | null;
  executionOptions: FlagpoleExecution;
  page: Page | null;
  incompleteAssertions: iAssertion[];
  assertionsResolved: Promise<(iAssertionResult | null)[]>;
  subScenariosResolved: Promise<any[]>;
  comment(input: any): iAssertionContext;
  assert(a: any, b?: any): iAssertion;
  pause(milliseconds: number): Promise<void>;
  set(aliasName: string, value: any): iAssertionContext;
  get(aliasName: string): any;
  exists(selector: string, opts?: FindOptions): Promise<iValue>;
  exists(
    selector: string,
    contains: string,
    opts?: FindOptions
  ): Promise<iValue>;
  exists(
    selector: string,
    matches: RegExp,
    opts?: FindOptions
  ): Promise<iValue>;
  existsAll(selector: string, opts?: FindOptions): Promise<iValue[]>;
  existsAll(
    selector: string,
    contains: string,
    opts?: FindOptions
  ): Promise<iValue[]>;
  existsAll(
    selector: string,
    matches: RegExp,
    opts?: FindOptions
  ): Promise<iValue[]>;
  find(selector: string, opts?: FindOptions): Promise<iValue>;
  find(selector: string, contains: string, opts?: FindOptions): Promise<iValue>;
  find(selector: string, matches: RegExp, opts?: FindOptions): Promise<iValue>;
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
  findXPath(xPath: string): Promise<iValue>;
  findAllXPath(xPath: string): Promise<iValue[]>;
  clearThenType(
    selector: string,
    textToType: string,
    opts?: any
  ): Promise<void>;
  click(selector: string, opts?: FindOptions): Promise<void>;
  click(selector: string, contains: string, opts?: FindOptions): Promise<void>;
  click(selector: string, matches: RegExp, opts?: FindOptions): Promise<void>;
  submit(selector: string): Promise<void>;
  type(selector: string, textToType: string, opts?: any): Promise<void>;
  selectOption(selector: string, value: string | string[]): Promise<void>;
  eval(js: EvaluateFn<any>, ...args: SerializableOrJSHandle[]): Promise<any>;
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
  waitForXPath(xPath: string, timeout?: number): Promise<iValue>;
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
  finished: Promise<void>;
  subscribe(callback: SuiteStatusCallback): iSuite;
  verifyCert(verify: boolean): iSuite;
  verifySslCert(verify: boolean): iSuite;
  setConcurrencyLimit(maxExecutions: number): iSuite;
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
  isReadyToExecute: boolean;
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
  comment(input: any): iScenario;
  result(result: iAssertionResult): iScenario;
  ignore(assertions?: boolean | Function): iScenario;
  open(url: string, opts?: HttpRequestOptions): iScenario;
  open(link: iValue, opts?: HttpRequestOptions): iScenario;
  next(callback: iNextCallback): iScenario;
  next(...callbacks: iNextCallback[]): iScenario;
  next(message: string, callback: iNextCallback): iScenario;
  nextPrepend(callback: iNextCallback): iScenario;
  nextPrepend(message: string, callback: iNextCallback): iScenario;
  skip(message?: string): Promise<iScenario>;
  cancel(message?: string): Promise<iScenario>;
  getBrowserControl(): BrowserControl;
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
  mock(localPath: string): iScenario;
  setResponseType(
    type: ResponseType,
    opts?: BrowserOptions | HttpRequestOptions
  ): iScenario;
  promise(): Promise<iScenario>;
  waitForFinished(): Promise<void>;
  waitForResponse(): Promise<void>;
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

export type JsonSchema_Type =
  | "object"
  | "array"
  | "string"
  | "number"
  | "integer"
  | "null";

export type JsonSchema = {
  type: JsonSchema_Type | JsonSchema_Type[];
  properties?: { [key: string]: JsonSchema };
  items?: JsonSchema;
  enum?: any[];
  pattern?: RegExp | string;
};

export interface iAjvLike {
  errors: Error[];
  validate(schema: any, root: any): Promise<boolean>;
}

export interface iAjvErrorObject {
  keyword: string;
  dataPath: string;
  schemaPath: string;
  params: any;
  // Added to validation errors of propertyNames keyword schema
  propertyName?: string;
  // Excluded if messages set to false.
  message?: string;
  // These are added with the `verbose` option.
  schema?: any;
  parentSchema?: object;
  data?: any;
}
