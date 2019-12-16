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
}

export interface iDOMElement {
  $: any;
  path: string;
  name: string;
  tagName: string;
  outerHTML: string;
  isNull(): boolean;
  click(
    a?: string | Function | iScenario,
    b?: Function | iScenario
  ): Promise<iScenario | void>;
  submit(
    a?: string | Function | iScenario,
    b?: Function | iScenario
  ): Promise<iScenario | void>;
  fillForm(formData: any): Promise<void>;
  exists(selector: string): Promise<iValue | iDOMElement | null>;
  find(selector: string): Promise<iValue | iDOMElement | null>;
  findAll(selector: string): Promise<(iValue | iDOMElement)[]>;
  toString(): string;
  getClassName(): Promise<iValue>;
  hasClassName(className: string): Promise<iValue>;
  getTagName(): Promise<iValue>;
  getInnerText(): Promise<iValue>;
  getInnerHtml(): Promise<iValue>;
  getOuterHtml(): Promise<iValue>;
  hasAttribute(key: string): Promise<iValue>;
  getAttribute(key: string): Promise<iValue>;
  hasProperty(key: string): Promise<iValue>;
  getProperty(key: string): Promise<iValue>;
  hasData(key: string): Promise<iValue>;
  getData(key: string): Promise<iValue>;
  getValue(): Promise<iValue>;
  getText(): Promise<iValue>;
  load(message: string, callback: Function): iScenario;
  as(aliasName: string): iValue;
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
  find(path: string): Promise<iValue | iDOMElement>;
  findAll(path: string): Promise<Array<iValue | iDOMElement>>;
  findHavingText(
    selector: string,
    searchForText: string | RegExp
  ): Promise<iDOMElement | iValue>;
  findAllHavingText(
    selector: string,
    searchForText: string | RegExp
  ): Promise<iDOMElement[] | iValue[]>;
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
  waitForHidden(
    selector: string,
    timeout: number
  ): Promise<iValue | iDOMElement>;
  waitForVisible(
    selector: string,
    timeout: number
  ): Promise<iValue | iDOMElement>;
  waitForExists(
    selector: string,
    timeout?: number
  ): Promise<iValue | iDOMElement>;
  screenshot(opts: any): Promise<Buffer | string>;
  clear(selector: string): Promise<any>;
  type(selector: string, textToType: string, opts: any): Promise<any>;
  selectOption(selector: string, value: string | string[]): Promise<string[]>;
  readonly scenario: iScenario;
}

export interface iAssertion {
  and: iAssertion;
  type: iAssertion;
  length: iAssertion;
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
}

export interface iAssertionContext {
  result: any;
  response: iResponse;
  scenario: iScenario;
  suite: iSuite;
  browserControl: BrowserControl | null;
  page: Page | null;
  incompleteAssertions: iAssertion[];
  assertionsResolved: Promise<(iAssertionResult | null)[]>;
  subScenariosResolved: Promise<any[]>;
  comment(message: string): iAssertionContext;
  assert(a: any, b?: any): iAssertion;
  pause(milliseconds: number): Promise<void>;
  exists(selector: string): Promise<iValue | iDOMElement>;
  set(aliasName: string, value: any): iAssertionContext;
  get(aliasName: string): any;
  find(selector: string): Promise<iValue | iDOMElement>;
  findAll(selector: string): Promise<(iValue | iDOMElement)[]>;
  findHavingText(
    selector: string,
    searchForText: string | RegExp
  ): Promise<iDOMElement | iValue>;
  findAllHavingText(
    selector: string,
    searchForText: string | RegExp
  ): Promise<iDOMElement[]>;
  clearThenType(selector: string, textToType: string, opts?: any): Promise<any>;
  clear(selector: string): Promise<void>;
  click(selector: string): Promise<any>;
  submit(selector: string): Promise<any>;
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
  waitForHidden(
    selector: string,
    timeout?: number
  ): Promise<iValue | iDOMElement>;
  waitForVisible(
    selector: string,
    timeout?: number
  ): Promise<iValue | iDOMElement>;
  waitForExists(
    selector: string,
    timeout?: number
  ): Promise<iValue | iDOMElement>;
  openInBrowser(): Promise<string>;
  screenshot(opts: any): Promise<Buffer | string>;
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
  subscribe(callback: Function);
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
  redirectCount: number;
  redirectChain: string[];
  requestOptions: any;
  set(aliasName: string, value: any): iScenario;
  get(aliasName: string): any;
  getLog(): Promise<iLogItem[]>;
  subscribe(callback: Function);
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
  next(a: any, b?: any): iScenario;
  nextPrepend(a: any, b?: any): iScenario;
  skip(message?: string): Promise<iScenario>;
  cancel(): Promise<iScenario>;
  getBrowserControl(): BrowserControl;
  execute(): Promise<iScenario>;
  error(callback: Function): iScenario;
  success(callback: Function): iScenario;
  failure(callback: Function): iScenario;
  before(callback: Function): iScenario;
  after(callback: Function): iScenario;
  finally(callback: Function): iScenario;
  mock(localPath: string): iScenario;
  setResponseType(type: ResponseType, opts?: any): iScenario;
}

export interface iMessageAndCallback {
  message: string;
  callback: Function;
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
