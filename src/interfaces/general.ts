import {
  SuiteStatusEvent,
  ScenarioStatusEvent,
  ScenarioDisposition,
} from "./enums";
import { HttpResponse } from "../http-response";
import { FlagpoleExecution } from "../flagpole-execution";
import { Link } from "../link";
import { ServerOptions } from "https";
import { ValuePromise } from "../value-promise";
import { ScenarioType } from "../scenario-types";
import {
  IteratorBoolCallback,
  IteratorCallback,
  SyncIteratorBoolCallback,
  SyncIteratorCallback,
  SyncMapperCallback,
  SyncReducerCallback,
} from "./iterator-callbacks";
import {
  ClassConstructor,
  JsFunction,
  KeyValue,
  OptionalXY,
} from "./generic-types";
import { iAssertionIs } from "./iassertion-is";
import { iAssertion } from "./iassertion";
import { PointerClick, PointerMove } from "./pointer";
import { GestureOpts, GestureType } from "./gesture";
import { ScreenProperties } from "./screen-properties";
import { iBounds } from "./ibounds";
import {
  HttpAuth,
  HttpMethodVerb,
  HttpProxy,
  HttpRequestOptions,
  HttpResponseOptions,
  HttpTimeout,
  iHttpRequest,
} from "./http";
import { WebhookServer } from "./webhook";
import { ScreenshotOpts } from "./screenshot";
import { FindAllOptions, FindOptions } from "./find-options";
import { iAssertionResult } from "./iassertion-result";
import { iLogItem } from "./ilog-item";
import { ResponsePipe } from "./response-pipe";

export type ScenarioConstructor = ClassConstructor<iScenario>;

export interface iNextCallback {
  (context: iAssertionContext, ...args: any[]): Promise<any> | void;
}

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

export type ScenarioMapper = (
  value: any,
  index: number,
  arr: any[],
  suite: iSuite
) => iScenario;

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
  click(opts?: PointerClick): ValuePromise;
  submit(): ValuePromise;
  open(scenario: iScenario): iScenario;
  open(title: string, type?: ScenarioConstructor): iScenario;
  fillForm(attribute: string, formData: KeyValue): ValuePromise;
  fillForm(formData: KeyValue): ValuePromise;
  getInnerText(): ValuePromise;
  getInnerHtml(): ValuePromise;
  getOuterHtml(): ValuePromise;
  setValue(text: string): ValuePromise;
  getBounds(boxType?: string): Promise<iBounds | null>;
  getUrl(): ValuePromise;
  getLink(): Promise<Link>;
  getStyleProperty(key: string): ValuePromise;
  getValue(): ValuePromise;
  getText(): ValuePromise;
  getClassName(): ValuePromise;
  getAttribute(key: string): ValuePromise;
  getProperty(key: string): ValuePromise;
  getTag(): ValuePromise;
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
  focus(): ValuePromise;
  blur(): ValuePromise;
  hover(): ValuePromise;
  tap(opts?: PointerClick): ValuePromise;
  longpress(opts?: PointerClick): ValuePromise;
  press(key: string, opts?: any): ValuePromise;
  clearThenType(textToType: string, opts?: any): ValuePromise;
  type(textToType: string, opts?: any): ValuePromise;
  clear(): ValuePromise;
  eval(js: JsFunction, ...args: any[]): Promise<any>;
  selectOption(value: string | string[]): ValuePromise;
  pressEnter(): ValuePromise;
  scrollTo(): ValuePromise;
  waitForFunction(
    js: JsFunction,
    opts?: KeyValue,
    ...args: any[]
  ): ValuePromise;
  waitForHidden(timeout?: number): ValuePromise;
  waitForVisible(timeout?: number): ValuePromise;
  // Tree traversal
  exists(selector?: string): ValuePromise;
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
  getFirstChild(selector?: string): ValuePromise;
  getLastChild(selector?: string): ValuePromise;
  getChildOrSelf(selector: string): ValuePromise;
  getDescendants(selector: string): Promise<iValue[]>;
  getDescendantOrSelf(selector: string): ValuePromise;
  getParent(): ValuePromise;
  getAncestor(selector: string): ValuePromise;
  getAncestors(selector: string): Promise<iValue[]>;
  getAncestorOrSelf(selector: string): ValuePromise;
  getSiblings(selector?: string): Promise<iValue[]>;
  getFirstSibling(selector?: string): ValuePromise;
  getLastSibling(selector?: string): ValuePromise;
  getPreviousSibling(selector?: string): ValuePromise;
  getPreviousSiblings(selector?: string): Promise<iValue[]>;
  getNextSibling(selector?: string): ValuePromise;
  getNextSiblings(selector?: string): Promise<iValue[]>;
  gesture(type: GestureType, opts: GestureOpts): ValuePromise;
}

/**
 * Responses may be HTML or JSON, so this interface let's us know how to handle either
 */
export interface iResponse {
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
  findXPath(xPath: string): ValuePromise;
  findAllXPath(xPath: string): Promise<iValue[]>;
  header(key?: string): iValue;
  cookie(key?: string): iValue;
  absolutizeUri(uri: string): string;
  eval(js: JsFunction, ...args: any[]): Promise<any>;
  waitForNavigation(
    timeout?: number,
    waitFor?: string | string[]
  ): Promise<void>;
  waitForLoad(timeout?: number): Promise<void>;
  waitForNetworkIdle(timeout?: number): Promise<void>;
  waitForReady(timeout?: number): Promise<void>;
  waitForFunction(
    js: JsFunction,
    opts?: KeyValue,
    ...args: any[]
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
  screenshot(): Promise<Buffer>;
  screenshot(localFilePath: string): Promise<Buffer>;
  screenshot(localFilePath: string, opts: ScreenshotOpts): Promise<Buffer>;
  screenshot(opts: ScreenshotOpts): Promise<Buffer>;
  clear(selector: string): ValuePromise;
  type(selector: string, textToType: string, opts: any): ValuePromise;
  clearThenType(selector: string, textToType: string, opts: any): ValuePromise;
  selectOption(selector: string, value: string | string[]): ValuePromise;
  scrollTo(point: OptionalXY): Promise<iResponse>;
  click(selector: string, opts?: FindOptions): ValuePromise;
  click(selector: string, contains: string, opts?: FindOptions): ValuePromise;
  click(selector: string, matches: RegExp, opts?: FindOptions): ValuePromise;
  serialize(): object;
  movePointer(...pointers: PointerMove[]): Promise<iResponse>;
  gesture(type: GestureType, opts: GestureOpts): Promise<iResponse>;
  rotateScreen(rotation: string | number): Promise<string | number>;
  getScreenProperties(): Promise<ScreenProperties>;
  hideKeyboard(): Promise<void>;
  getSource(): ValuePromise;
}

export interface iAssertionContext {
  result: any;
  request: iHttpRequest;
  response: iResponse;
  scenario: iScenario;
  suite: iSuite;
  executionOptions: FlagpoleExecution;
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
  abort(message?: string): Promise<iScenario>;
  rotateScreen(rotation: string | number): Promise<string | number>;
  getScreenProperties(): Promise<ScreenProperties>;
  hideKeyboard(): Promise<void>;
  movePointer(...pointers: PointerMove[]): Promise<iResponse>;
  gesture(type: GestureType, opts: GestureOpts): Promise<iResponse>;
  getSource(): ValuePromise;
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
  scenario<T extends iScenario>(
    title: string,
    type: ClassConstructor<T>,
    opts?: KeyValue
  ): T;
  scenario<T extends iScenario>(
    title: string,
    type: ScenarioType,
    opts?: KeyValue
  ): T;
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
  set<T>(key: string, value: T): iSuite;
  get<T>(key: string): T;
  template<T extends iScenario>(
    templateOptions: ScenarioInitOptions<T>
  ): (title: string, scenarioOptions: ScenarioInitOptions<T>) => T;
}

export interface iScenario {
  suite: iSuite;
  title: string;
  type: ScenarioConstructor;
  opts: KeyValue;
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
  promise(): Promise<iScenario>;
  waitForFinished(): Promise<iScenario>;
  waitForResponse(): Promise<iScenario>;
  waitFor(thatScenario: iScenario): iScenario;
  repeat(): iScenario;
  repeat(count: number): iScenario[];
  go(): void;
}

export interface iMessageAndCallback {
  isSubScenario: boolean;
  message: string;
  callback: iNextCallback;
  scenario?: iScenario;
}

export interface ScenarioInitOptions<T extends iScenario> {
  type: ClassConstructor<T> | ScenarioType;
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
  opts?: KeyValue;
}

export type ScenarioTemplateInitOptions<T extends iScenario> = Omit<
  ScenarioInitOptions<T>,
  "type"
>;
