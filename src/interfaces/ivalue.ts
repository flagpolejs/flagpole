import { HttpResponse, ValuePromise } from "..";
import { Link } from "../link";
import { ContextProvider } from "./context-provider";
import { FindProvider } from "./find-provider";
import { JsFunction, KeyValue } from "./generic-types";
import { GestureOpts, GestureType } from "./gesture";
import { HttpRequestOptions } from "./http";
import { iAssertion } from "./iassertion";
import { iAssertionIs } from "./iassertion-is";
import { iAssertionContext } from "./iassertioncontext";
import { iBounds } from "./ibounds";
import {
  SyncIteratorBoolCallback,
  SyncIteratorCallback,
  SyncMapperCallback,
  SyncReducerCallback,
} from "./iterator-callbacks";
import { PointerClick } from "./pointer";
import { ScreenshotOpts } from "./screenshot";

export interface ValueOptions {
  // Human-readable name
  name?: string;
  // Actual selector, which could actually be used to select
  selector?: string;
  // Similar to the selector but intended to be human-readable
  path?: string;
  // The parent document or section of the document where it was selected from
  parent?: iValue<any>;
  // The source for this element
  sourceCode?: string;
  // If this was an element with a tag, the tag name
  tagName?: string;
  // The text to highlight if there is an error to show where it happened
  highlightText?: string;
}

export interface iValue<T = any>
  extends FindProvider,
    ContextProvider,
    Required<ValueOptions> {
  $: T;
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
  is: iAssertionIs;
  assert(message?: string): iAssertion;
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
  each(callback: SyncIteratorCallback): iValue<T>;
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
  click(opts?: PointerClick): ValuePromise;
  submit(): ValuePromise;
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
  getChildren(selector?: string): Promise<iValue<any>[]>;
  getFirstChild(selector?: string): ValuePromise;
  getLastChild(selector?: string): ValuePromise;
  getChildOrSelf(selector: string): ValuePromise;
  getDescendants(selector: string): Promise<iValue<any>[]>;
  getDescendantOrSelf(selector: string): ValuePromise;
  getParent(): ValuePromise;
  getAncestor(selector: string): ValuePromise;
  getAncestors(selector: string): Promise<iValue<any>[]>;
  getAncestorOrSelf(selector: string): ValuePromise;
  getSiblings(selector?: string): Promise<iValue<any>[]>;
  getFirstSibling(selector?: string): ValuePromise;
  getLastSibling(selector?: string): ValuePromise;
  getPreviousSibling(selector?: string): ValuePromise;
  getPreviousSiblings(selector?: string): Promise<iValue<any>[]>;
  getNextSibling(selector?: string): ValuePromise;
  getNextSiblings(selector?: string): Promise<iValue<any>[]>;
  gesture(type: GestureType, opts: GestureOpts): ValuePromise;
}
