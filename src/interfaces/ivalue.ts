import { Assertion, HttpResponse, ValuePromise } from "..";
import { AssertionIs } from "../assertion/assertion-is";
import { Link } from "../link";
import { ContextProvider } from "./context-provider";
import { FindProvider } from "./find-provider";
import { JsFunction, KeyValue } from "./generic-types";
import { GestureOpts, GestureType } from "./gesture";
import { HttpRequestOptions } from "./http";
import { Bounds } from "./bounds";
import {
  SyncIteratorBoolCallback,
  SyncIteratorCallback,
  SyncMapperCallback,
  SyncReducerCallback,
} from "./iterator-callbacks";
import { PointerClick } from "./pointer";
import { ScreenshotOpts } from "./screenshot";
import { ValueOptions } from "./value-options";

export interface iValue<InputType = any>
  extends FindProvider,
    ContextProvider,
    Required<ValueOptions> {
  $: InputType;
  name: string;
  tagName: string;
  selector: string;
  highlightText: string;
  parent: any;
  sourceCode: string;
  isFlagpoleValue: true;
  length: iValue<number>;
  trim: iValue<string>;
  uppercase: iValue<string>;
  lowercase: iValue<string>;
  keys: iValue<string[]>;
  values: iValue<unknown>;
  first: iValue<unknown>;
  mid: iValue<unknown>;
  last: iValue<unknown>;
  random: iValue<unknown>;
  array: iValue<any[]>;
  string: iValue<string>;
  int: iValue<number>;
  float: iValue<number>;
  bool: iValue<boolean>;
  json: iValue<any>;
  is: AssertionIs;
  assert(message?: string): Assertion;
  exists(): ValuePromise<InputType, this>;
  exists(selector: string): ValuePromise<any, iValue>;
  item(key: string | number): iValue<any>;
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
  split(splitter: string | RegExp, limit?: number): iValue<any[]>;
  join(splitter: string): iValue<string>;
  pluck(property: string): iValue<any[]>;
  nth(index: number): iValue<any>;
  map(mapper: SyncMapperCallback): iValue<any[]>;
  filter(callback: SyncIteratorBoolCallback): iValue<any[]>;
  each(callback: SyncIteratorCallback): this;
  every(callback: SyncIteratorBoolCallback): iValue<boolean>;
  some(callback: SyncIteratorBoolCallback): iValue<boolean>;
  none(callback: SyncIteratorBoolCallback): iValue<boolean>;
  reduce(callback: SyncReducerCallback, initial?: any): iValue<any>;
  sum(key?: string): iValue<number>;
  median(key?: string): iValue<number>;
  count(key?: string): iValue<number>;
  avg(key?: string): iValue<number>;
  min(key?: string): iValue<any>;
  max(key?: string): iValue<any>;
  asc(key?: string): iValue<any>;
  desc(key?: string): iValue<any>;
  col(keys: string[]): iValue<any>;
  col(key: string): iValue<any>;
  groupBy(key: string): iValue<any>;
  unique(): iValue<any>;
  rename(newName: string): this;
  echo(callback: (str: string) => void): this;
  echo(): this;
  // DOM Elements only
  click(opts?: PointerClick): ValuePromise<InputType, this>;
  submit(): ValuePromise<InputType, this>;
  fillForm(
    attribute: string,
    formData: KeyValue
  ): ValuePromise<InputType, this>;
  fillForm(formData: KeyValue): ValuePromise<InputType, this>;
  getInnerText(): ValuePromise<string, iValue>;
  getInnerHtml(): ValuePromise<string, iValue>;
  getOuterHtml(): ValuePromise<string, iValue>;
  setValue(text: string): ValuePromise<InputType, this>;
  getBounds(boxType?: string): Promise<Bounds | null>;
  getUrl(): ValuePromise<string, iValue>;
  getLink(): Promise<Link>;
  getStyleProperty(key: string): ValuePromise<string, iValue>;
  getValue(): ValuePromise<any, iValue>;
  getText(): ValuePromise<string, iValue>;
  getClassName(): ValuePromise<string, iValue>;
  getAttribute(key: string): ValuePromise<any, iValue>;
  getProperty(key: string): ValuePromise<any, iValue>;
  getTag(): ValuePromise<string, iValue>;
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
  focus(): ValuePromise<InputType, this>;
  blur(): ValuePromise<InputType, this>;
  hover(): ValuePromise<InputType, this>;
  tap(opts?: PointerClick): ValuePromise<InputType, this>;
  longpress(opts?: PointerClick): ValuePromise<InputType, this>;
  press(key: string, opts?: any): ValuePromise<InputType, this>;
  clearThenType(textToType: string, opts?: any): ValuePromise<InputType, this>;
  type(textToType: string, opts?: any): ValuePromise<InputType, this>;
  clear(): ValuePromise<InputType, this>;
  eval(js: JsFunction, ...args: any[]): Promise<any>;
  selectOption(value: string | string[]): ValuePromise<InputType, this>;
  pressEnter(): ValuePromise<InputType, this>;
  scrollTo(): ValuePromise<InputType, this>;
  waitForFunction(
    js: JsFunction,
    opts?: KeyValue,
    ...args: any[]
  ): ValuePromise<InputType, this>;
  waitForHidden(timeout?: number): ValuePromise<InputType, this>;
  waitForVisible(timeout?: number): ValuePromise<InputType, this>;
  // Tree traversal
  getChildren(selector?: string): Promise<iValue<any>[]>;
  getFirstChild(selector?: string): ValuePromise<any, iValue>;
  getLastChild(selector?: string): ValuePromise<any, iValue>;
  getChildOrSelf(selector: string): ValuePromise<any, iValue>;
  getDescendants(selector: string): Promise<iValue<any>[]>;
  getDescendantOrSelf(selector: string): ValuePromise<any, iValue>;
  getParent(): ValuePromise<any, iValue>;
  getAncestor(selector: string): ValuePromise<any, iValue>;
  getAncestors(selector: string): Promise<iValue<any>[]>;
  getAncestorOrSelf(selector: string): ValuePromise<any, iValue>;
  getSiblings(selector?: string): Promise<iValue<any>[]>;
  getFirstSibling(selector?: string): ValuePromise<any, iValue>;
  getLastSibling(selector?: string): ValuePromise<any, iValue>;
  getPreviousSibling(selector?: string): ValuePromise<any, iValue>;
  getPreviousSiblings(selector?: string): Promise<iValue<any>[]>;
  getNextSibling(selector?: string): ValuePromise<any, iValue>;
  getNextSiblings(selector?: string): Promise<iValue<any>[]>;
  gesture(type: GestureType, opts: GestureOpts): ValuePromise<InputType, this>;
}
