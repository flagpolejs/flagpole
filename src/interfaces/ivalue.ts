import { HttpResponse, ValuePromise } from "..";
import { Link } from "../link";
import { FindAllOptions, FindOptions } from "./find-options";
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

export interface iValue {
  $: any;
  context: iAssertionContext;
  name: string;
  tagName: string;
  outerHTML: string;
  path: string;
  highlight: string;
  parent: any;
  sourceCode: string;
  isFlagpoleValue: true;
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
