import { HttpResponse, ValuePromise } from "..";
import { FindAllOptions, FindOptions } from "./find-options";
import { JsFunction, KeyValue, OptionalXY } from "./generic-types";
import { GestureOpts, GestureType } from "./gesture";
import { iHttpRequest } from "./http";
import { iAssertionContext } from "./iassertioncontext";
import { iValue } from "./ivalue";
import { PointerMove } from "./pointer";
import { ScreenProperties } from "./screen-properties";
import { ScreenshotOpts } from "./screenshot";

export interface iResponse {
  context: iAssertionContext;
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
  headers: iValue;
  cookies: iValue;
  trailers: iValue;
  method: iValue;
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
