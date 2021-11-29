import {
  iAssertionContext,
  iValue,
  iScenario,
  KeyValue,
  iBounds,
  iNextCallback,
  iAssertionIs,
  HttpRequestOptions,
} from "./interfaces";
import {
  toType,
  isNullOrUndefined,
  runAsync,
  firstIn,
  lastIn,
  randomIn,
  middleIn,
  toOrdinal,
  nthIn,
} from "./util";
import {
  AssertionActionCompleted,
  AssertionActionFailed,
} from "./logging/assertionresult";
import { Link } from "./link";
import * as fs from "fs";
import {
  EvaluateFn,
  PageFnOptions,
  SerializableOrJSHandle,
} from "puppeteer-core";
import { ValuePromise } from "./value-promise";
import { ScenarioType } from "./scenario-types";
import { HttpResponse } from "./httpresponse";
import { HttpRequest } from "./httprequest";
import { jpathSearch } from "./json/jpath";
import {
  SyncIteratorBoolCallback,
  SyncIteratorCallback,
  SyncMapperCallback,
  SyncReducerCallback,
} from "./interfaces/iterator-callbacks";

export class Value implements iValue {
  protected _input: any;
  protected _context: iAssertionContext;
  protected _name: string | null;
  protected _parent: any;
  protected _highlight: string;
  protected _sourceCode: string | null = null;
  protected _path: string | undefined;
  protected _tagName: string | undefined;

  public get context(): iAssertionContext {
    return this._context;
  }

  public get $(): any {
    return this._input;
  }

  public get tagName(): string {
    return this._tagName?.toLowerCase() || "";
  }

  public get outerHTML(): string {
    return this._sourceCode || "";
  }

  public get is(): iAssertionIs {
    return this.assert().is;
  }

  public selectOption(value: string | string[]): Promise<void> {
    throw "This Value does not support select.";
  }

  public async pressEnter(): Promise<iValue> {
    throw "This Value does not support pressEnter.";
  }

  public get length(): iValue {
    return new Value(
      this.$ && this.$.length ? this.$.length : 0,
      this._context,
      `Length of ${this._name}`
    );
  }

  public get trim(): iValue {
    const thisValue: any = this.$;
    return new Value(
      typeof thisValue === "string" ? thisValue.trim() : thisValue,
      this._context,
      `Trim of ${this._name}`
    );
  }

  public get uppercase(): iValue {
    const thisValue: any = this.$;
    return new Value(
      typeof thisValue === "string" ? thisValue.toUpperCase() : thisValue,
      this._context,
      `Uppercase of ${this._name}`
    );
  }

  public get lowercase(): iValue {
    const thisValue: any = this.$;
    return new Value(
      typeof thisValue === "string" ? thisValue.toLowerCase() : thisValue,
      this._context,
      `Lowercase of ${this._name}`
    );
  }

  public get first(): iValue {
    const thisValue: any = this.$;
    return new Value(
      firstIn(thisValue),
      this._context,
      `First in ${this._name}`
    );
  }

  public get mid(): iValue {
    const thisValue: any = this.$;
    return new Value(
      middleIn(thisValue),
      this._context,
      `Middle in ${this._name}`
    );
  }

  public get last(): iValue {
    const thisValue: any = this.$;
    return new Value(lastIn(thisValue), this._context, `Last in ${this._name}`);
  }

  public get random(): iValue {
    const thisValue: any = this.$;
    return new Value(
      randomIn(thisValue),
      this._context,
      `Random in ${this._name}`
    );
  }

  public get string(): iValue {
    return new Value(this.toString(), this._context, this.name);
  }

  public get array(): iValue {
    return new Value(this.toArray(), this._context, this.name);
  }

  public get float(): iValue {
    return new Value(this.toFloat(), this._context, this.name);
  }

  public get int(): iValue {
    return new Value(this.toInteger(), this._context, this.name);
  }

  public get bool(): iValue {
    return new Value(this.toBoolean(), this._context, this.name);
  }

  public get json(): iValue {
    return new Value(this.toJSON(), this._context, this.name);
  }

  public get path(): string {
    return this._path || "";
  }

  public get name(): string {
    return this._name || "it";
  }

  public get highlight(): string {
    return this._highlight;
  }

  public get parent(): any {
    return this._parent;
  }

  public get sourceCode(): string {
    return this._sourceCode === null ? "" : this._sourceCode;
  }

  public get isFlagpoleValue(): true {
    return true;
  }

  constructor(
    input: any,
    context: iAssertionContext,
    name?: string,
    parent: any = null,
    highlight: string = ""
  ) {
    this._input = input;
    this._context = context;
    this._name = name || null;
    this._parent = parent;
    this._highlight = highlight;
  }

  public rename(newName: string): iValue {
    const oldName = this.name;
    this._name = newName;
    //this._completedAction("RENAME", `${oldName} to ${newName}`);
    return this;
  }

  public toArray(): any[] {
    return this.isArray() ? this._input : [this._input];
  }

  public valueOf(): any {
    return this._input;
  }

  public toString(): string {
    const type: string = toType(this._input);
    // Handle a Value in a Value
    if (type == "value" && this._input && this._input.$) {
      return String(this._input.$);
    }
    // If there's a value property, use that
    else if (this._input && this._input.value) {
      return String(this._input.value);
    }
    // If this is an object, list the keys
    else if (type == "object") {
      return String(Object.keys(this._input));
    }
    // Default
    return String(this._input);
  }

  public toBoolean(): boolean {
    return !!this.$;
  }

  public toFloat(): number {
    return parseFloat(this.toString());
  }

  public toInteger(): number {
    return parseInt(this.toString());
  }

  public toJSON(): any {
    try {
      return JSON.parse(this.toString());
    } catch (ex) {
      return null;
    }
  }

  public toURL(baseUrl?: string | URL): URL {
    return new URL(this.toString(), baseUrl);
  }

  public toType(): string {
    return String(toType(this._input));
  }

  public isNullOrUndefined(): boolean {
    return isNullOrUndefined(this._input);
  }

  public isUndefined(): boolean {
    return this.toType() == "undefined";
  }

  public isNull(): boolean {
    return this._input === null;
  }

  public isPromise(): boolean {
    return this.toType() == "promise";
  }

  public isArray(): boolean {
    return this.toType() == "array";
  }

  public isString(): boolean {
    return this.toType() == "string";
  }

  public isObject(): boolean {
    return this.toType() == "object";
  }

  public isNumber(): boolean {
    return this.toType() == "number" && this._input !== NaN;
  }

  public isNumeric(): boolean {
    return !isNaN(this._input);
  }

  public isNaN(): boolean {
    return this._input === NaN;
  }

  public isCookie(): boolean {
    return this._input && this._input.cookieString;
  }

  public isRegularExpression(): boolean {
    return this.toType() == "regexp";
  }

  public isCheerioElement(): boolean {
    return this.toType() == "cheerio";
  }

  public isPuppeteerElement(): boolean {
    return this.toType() == "elementhandle";
  }

  public async hasProperty(key: string, value: any): Promise<boolean> {
    const thisValue = await this.getProperty(key);
    if (value === undefined) {
      return !thisValue.isNullOrUndefined();
    }
    if (value instanceof RegExp) {
      return (value as RegExp).test(thisValue.toString());
    }
    return value == thisValue.$;
  }

  public async hasValue(value: any): Promise<boolean> {
    const thisValue = await this.getValue();
    if (value === undefined) {
      return !thisValue.isNullOrUndefined();
    }
    if (value instanceof RegExp) {
      return (value as RegExp).test(thisValue.toString());
    }
    return value == thisValue.$;
  }

  /*
  public as(aliasName: string): iValue {
    this._context.scenario.set(aliasName, this);
    return this;
  }
  */

  public async getProperty(key: string): Promise<iValue> {
    return this._wrapAsValue(
      this._input[key],
      `${this.name} property of ${key}`
    );
  }

  public async click(): Promise<iValue> {
    this._context.logFailure(`Element could not be clicked on: ${this.name}`);
    return this;
  }

  public async submit(): Promise<iValue> {
    this._context.logFailure(`Element could not be submitted on: ${this.name}`);
    return this;
  }

  public open(message: string): iScenario;
  public open(message: string, type: ScenarioType): iScenario;
  public open(
    message: string,
    type: ScenarioType,
    callback: iNextCallback
  ): iScenario;
  public open(message: string, callback: iNextCallback): iScenario;
  public open(callback: iNextCallback): iScenario;
  public open(scenario: iScenario): iScenario;
  public open(
    a?: string | iScenario | iNextCallback,
    b?: ScenarioType | iNextCallback,
    c?: iNextCallback
  ): iScenario {
    const message = typeof a == "string" ? a : `Open ${this.name}`;
    const responseType =
      typeof b == "string" ? b : this.context.response.responseType;
    const callback: iNextCallback = (() => {
      return typeof c == "function"
        ? c
        : typeof b == "function"
        ? b
        : typeof a == "function"
        ? a
        : () => {};
    })();
    const scenario: iScenario = (() => {
      return toType(a) == "scenario"
        ? (a as iScenario)
        : this.context.suite.scenario(message, responseType);
    })();
    scenario.next(callback);
    runAsync(async () => {
      const link = await this.getLink();
      if (link.isNavigation()) {
        scenario.open(link.getUri());
      }
    });
    this._completedAction("OPEN");
    return scenario;
  }

  public async isVisible(): Promise<boolean> {
    return true;
  }

  public async isHidden(): Promise<boolean> {
    return false;
  }

  public isTag(...tagNames: string[]): boolean {
    if (!this.tagName) {
      return false;
    }
    return tagNames.length ? tagNames.includes(this.tagName) : true;
  }

  public async getLink(): Promise<Link> {
    const src = await this.getUrl();
    return new Link(src.isString() ? src.toString() : "", this._context);
  }

  public async getUrl(): Promise<iValue> {
    const url = await (async () => {
      if (this.isString()) {
        return this.toString();
      }
      if (
        this.isTag(
          "img",
          "script",
          "video",
          "audio",
          "object",
          "iframe",
          "source"
        )
      ) {
        return (await this.getAttribute("src")).$;
      } else if (this.isTag("a", "link")) {
        return (await this.getAttribute("href")).$;
      } else if (this.isTag("form")) {
        return (
          (await this.getAttribute("action")).$ || this._context.scenario.url
        );
      }
      return null;
    })();
    return this._wrapAsValue(url, `URL from ${this.name}`, this);
  }

  public async fillForm(
    attributeName: string,
    formData: KeyValue
  ): Promise<iValue>;
  public async fillForm(formData: KeyValue): Promise<iValue>;
  public async fillForm(a: string | KeyValue, b?: KeyValue): Promise<iValue> {
    return this;
  }

  public async exists(selector?: string): Promise<iValue> {
    if (selector === undefined) {
      this.isNullOrUndefined()
        ? this._failedAction("EXISTS", `${this.name}`)
        : this._completedAction("EXISTS", `${this.name}`);
      return this;
    } else {
      const el: iValue = await this.find(selector);
      el.isNull()
        ? this._failedAction("EXISTS", `${selector}`)
        : this._completedAction("EXISTS", `${selector}`);
      return el;
    }
  }

  public find(selector: string): ValuePromise {
    return ValuePromise.create(this.item(selector));
  }

  public async findAll(selector: string): Promise<iValue[]> {
    return [await this.find(selector)];
  }

  public async getClassName(): Promise<iValue> {
    return this._wrapAsValue(null, `${this.name} Class`);
  }

  public async hasClassName(name?: string | RegExp): Promise<boolean> {
    const myClass = (await this.getClassName()).toString();
    const classes = myClass.split(" ");
    return (() => {
      if (name === undefined) {
        return !!myClass;
      }
      return classes.some((cls) => {
        return typeof name == "string"
          ? name == cls
          : (name as RegExp).test(cls);
      });
    })();
  }

  public async getTag(): Promise<iValue> {
    return this._wrapAsValue(this.tagName, `Tag Name of ${this.name}`);
  }

  public async hasTag(tag?: string | RegExp): Promise<boolean> {
    const myTag = (await this.getTag()).$;
    if (tag === undefined) {
      return !!myTag;
    }
    return tag instanceof RegExp ? (tag as RegExp).test(myTag) : myTag == tag;
  }

  public async getInnerText(): Promise<iValue> {
    return this._wrapAsValue(this.toString(), `Inner Text of ${this.name}`);
  }

  public async getInnerHtml(): Promise<iValue> {
    return this._wrapAsValue(null, `Inner HTML of ${this.name}`);
  }

  public async getOuterHtml(): Promise<iValue> {
    return this._wrapAsValue(null, `Outer HTML of ${this.name}`);
  }

  public async hasAttribute(
    key: string,
    value?: string | RegExp
  ): Promise<boolean> {
    const thisValue = await this.getAttribute(key);
    if (thisValue.isNullOrUndefined()) {
      return false;
    }
    const strThisValue = thisValue.toString();
    return value === undefined
      ? !!thisValue
      : typeof value == "string"
      ? value == strThisValue
      : (value as RegExp).test(strThisValue);
  }

  public getAttribute(key: string): Promise<iValue> {
    return this.getProperty(key);
  }

  public async getStyleProperty(key: string): Promise<iValue> {
    return this._wrapAsValue(null, `Style of ${key}`);
  }

  public async getValue(): Promise<iValue> {
    return this;
  }

  public async scrollTo(): Promise<void> {}

  public async hasText(text?: string): Promise<boolean> {
    const myText = (await this.getText()).$;
    return text ? text == myText : !!myText;
  }

  public async getText(): Promise<iValue> {
    return this._wrapAsValue(
      this.toString(),
      this.name,
      this.parent,
      this.highlight
    );
  }

  public get values(): iValue {
    let values: any[] = [];
    try {
      values = Object.values(this.$);
    } catch {}
    return this._wrapAsValue(
      values,
      `Values of ${this.name}`,
      this,
      this.highlight
    );
  }

  public get keys(): iValue {
    let keys: string[] = [];
    try {
      keys = Object.keys(this.$);
    } catch {}
    return this._wrapAsValue(
      keys,
      `Keys of ${this.name}`,
      this,
      this.highlight
    );
  }

  public async screenshot(): Promise<Buffer> {
    throw new Error(
      `This value type (${this.toType()}) or scenario type (${
        this._context.scenario.responseType
      }) does not support screenshots.`
    );
  }

  public async eval(js: string): Promise<any> {
    throw `This element does not support eval().`;
  }

  public async focus(): Promise<iValue> {
    throw `This element does not support focus().`;
  }

  public async hover(): Promise<iValue> {
    throw `This element does not support hover().`;
  }

  public async blur(): Promise<iValue> {
    throw `This element does not support blur().`;
  }

  public async tap(): Promise<iValue> {
    throw `This element does not support tap().`;
  }

  public async press(key: string, opts?: any): Promise<iValue> {
    throw `This element does not support press().`;
  }

  public async clearThenType(textToType: string, opts?: any): Promise<iValue> {
    throw `This element does not support clearThenType().`;
  }

  public async type(textToType: string, opts?: any): Promise<iValue> {
    throw `This element does not support type().`;
  }

  public async clear(): Promise<iValue> {
    throw `This element does not support clear().`;
  }

  public async getAncestor(selector: string): Promise<iValue> {
    throw `getAncestor() is not supported by ${this.name}`;
  }

  public async getChildren(selector?: string): Promise<iValue[]> {
    throw `getChildren() is not supported by ${this.name}`;
  }

  public async getAncestors(selector: string): Promise<iValue[]> {
    throw `getAncestors() is not supported by ${this.name}`;
  }

  public async getAncestorOrSelf(selector: string): Promise<iValue> {
    throw `getAncestorOrSelf() is not supported by ${this.name}`;
  }

  public async getFirstChild(selector?: string): Promise<iValue> {
    throw `getFirstChild() is not supported by ${this.name}`;
  }

  public async getLastChild(selector?: string): Promise<iValue> {
    throw `getLastChild() is not supported by ${this.name}`;
  }

  public async getFirstSibling(selector?: string): Promise<iValue> {
    throw `getFirstSibling() is not supported by ${this.name}`;
  }

  public async getLastSibling(selector?: string): Promise<iValue> {
    throw `getLastSibling() is not supported by ${this.name}`;
  }

  public async getChildOrSelf(selector?: string): Promise<iValue> {
    throw `getChildOrSelf() is not supported by ${this.name}`;
  }

  public async getDescendantOrSelf(selector?: string): Promise<iValue> {
    throw `getDescendantOrSelf() is not supported by ${this.name}`;
  }

  public async getDescendants(selector?: string): Promise<iValue[]> {
    throw `getDescendants() is not supported by ${this.name}`;
  }

  public async getParent(): Promise<iValue> {
    throw `getParent() is not supported by ${this.name}`;
  }

  public async getSiblings(selector?: string): Promise<iValue[]> {
    throw `getSiblings() is not supported by ${this.name}`;
  }

  public async getPreviousSibling(selector?: string): Promise<iValue> {
    throw `getPreviousSibling() is not supported by ${this.name}`;
  }

  public async getPreviousSiblings(selector?: string): Promise<iValue[]> {
    throw `getPreviousSiblings() is not supported by ${this.name}`;
  }

  public async getNextSibling(selector?: string): Promise<iValue> {
    throw `getNextSibling() is not supported by ${this.name}`;
  }

  public async getNextSiblings(selector?: string): Promise<iValue[]> {
    throw `getNextSiblings() is not supported by ${this.name}`;
  }

  public async getBounds(boxType?: string): Promise<iBounds | null> {
    return null;
  }

  /**
   * Download the file that is linked by this element... return the
   * contents and/or save it to a file
   *
   * @param opts
   */
  public download(): Promise<HttpResponse | null>;
  public download(localFilePath: string): Promise<HttpResponse | null>;
  public download(
    localFilePath: string,
    opts: HttpRequestOptions
  ): Promise<HttpResponse | null>;
  public download(opts: HttpRequestOptions): Promise<HttpResponse | null>;
  public async download(
    a?: string | HttpRequestOptions,
    b?: HttpRequestOptions
  ): Promise<any> {
    const link = await this.getLink();
    if (!link.isNavigation()) {
      return null;
    }
    const localFilePath: string | null = typeof a == "string" ? a : null;
    const opts = (() => {
      if (typeof a == "object" && a !== null) {
        return a;
      }
      if (typeof b == "object" && b !== null) {
        return b;
      }
      return { encoding: null };
    })();
    const request = new HttpRequest({
      ...{
        uri: link.getUri(),
        method: "get",
      },
      ...opts,
    });
    const resp = await request.fetch();
    if (localFilePath) {
      fs.writeFileSync(localFilePath, resp.body);
    }
    return resp;
  }

  public async waitForFunction(
    js: EvaluateFn<any>,
    opts?: PageFnOptions | number,
    ...args: SerializableOrJSHandle[]
  ): Promise<iValue> {
    return this;
  }

  public async waitForHidden(): Promise<iValue> {
    return this;
  }

  public async waitForVisible(): Promise<iValue> {
    return this;
  }

  public async setValue(text: string) {
    throw `setValue() is not supported by ${this.name}`;
  }

  public assert(message?: string) {
    return typeof message == "string"
      ? this.context.assert(message, this)
      : this.context.assert(this);
  }

  public split(by: string | RegExp, limit?: number): iValue {
    return new Value(
      this.toString().split(by, limit),
      this._context,
      this.name
    );
  }

  public join(by: string): iValue {
    return new Value(this.toArray().join(by), this._context, this.name);
  }

  public pluck(property: string): iValue {
    const arr = this.toArray().map((item) => item[property]);
    return new Value(
      arr,
      this._context,
      `Values of ${property} in ${this.name}`
    );
  }

  public nth(index: number): iValue {
    const value = nthIn(this.$, index);
    const nth = toOrdinal(index + 1);
    return new Value(value, this._context, `${nth} value in ${this.name}`);
  }

  public map(callback: SyncMapperCallback): iValue {
    return new Value(
      this.isArray() ? this.toArray().map(callback) : callback(this._input),
      this._context,
      this.name
    );
  }

  public filter(
    func: (value: any, i?: number, arr?: any[]) => boolean
  ): iValue {
    return new Value(this.toArray().filter(func), this._context, this.name);
  }

  public each(callback: SyncIteratorCallback): iValue {
    this.toArray().forEach(callback);
    return this;
  }

  public min(key?: string): iValue {
    return new Value(
      this.toArray().reduce((min, row) => {
        const val = key ? row[key] : row;
        return min === null || val < min ? val : min;
      }, null),
      this._context,
      this.name
    );
  }

  public max(key?: string): iValue {
    return new Value(
      this.toArray().reduce((max, row) => {
        const val = key ? row[key] : row;
        return max === null || val > max ? val : max;
      }, null),
      this._context,
      this.name
    );
  }

  public sum(key?: string): iValue {
    return new Value(
      this.toArray().reduce(
        (sum, row) => (sum += Number(key ? row[key] : row)),
        0
      ),
      this._context,
      this.name
    );
  }

  public count(key?: string): iValue {
    return new Value(
      this.toArray().reduce((count, row) => {
        if (key) {
          return count + !!row[key] ? 1 : 0;
        }
        return count + 1;
      }, 0),
      this._context,
      this.name
    );
  }

  public unique(): iValue {
    return new Value([...new Set(this.toArray())], this._context, this.name);
  }

  public groupBy(key: string): iValue {
    return new Value(
      this.toArray().reduce((grouper, row) => {
        const val = row[key];
        if (!grouper[val]) {
          grouper[val] = [];
        }
        grouper[val].push(row);
        return grouper;
      }, {}),
      this._context,
      this.name
    );
  }

  public asc(key?: string): iValue {
    const collator = new Intl.Collator("en", {
      numeric: true,
      sensitivity: "base",
    });
    const arr = this.toArray().sort((a, b) =>
      key ? collator.compare(a[key], b[key]) : collator.compare(a, b)
    );
    return new Value(arr, this._context, this.name);
  }

  public desc(key?: string): iValue {
    const collator = new Intl.Collator("en", {
      numeric: true,
      sensitivity: "base",
    });
    const arr = this.toArray().sort(
      (a, b) =>
        (key ? collator.compare(a[key], b[key]) : collator.compare(a, b)) * -1
    );
    return new Value(arr, this._context, this.name);
  }

  public median(key?: string): iValue {
    const arr = this.toArray().sort((a, b) =>
      key ? parseFloat(a[key]) - parseFloat(b[key]) : a - b
    );
    const med = arr[Math.floor(arr.length / 2)];
    return new Value(key ? med[key] : med, this._context, this.name);
  }

  public avg(key?: string): iValue {
    const arr = this.toArray();
    return new Value(
      arr.reduce((sum, row) => (sum += Number(key ? row[key] : row)), 0) /
        arr.length,
      this._context,
      this.name
    );
  }

  public reduce(callback: SyncReducerCallback, initial?: any): iValue {
    return new Value(
      this.toArray().reduce(callback, initial),
      this._context,
      this.name
    );
  }

  public every(callback: SyncIteratorBoolCallback): iValue {
    return new Value(this.toArray().every(callback), this._context, this.name);
  }

  public some(callback: SyncIteratorBoolCallback): iValue {
    return new Value(this.toArray().some(callback), this._context, this.name);
  }

  public none(callback: SyncIteratorBoolCallback): iValue {
    return new Value(!this.toArray().some(callback), this._context, this.name);
  }

  public item(key: string | number): iValue {
    const name = `${key} in ${this.name}`;
    if (typeof key === "string") {
      return new Value(jpathSearch(this._input, key), this._context, name);
    }
    if (this._input.hasOwnProperty(key)) {
      return new Value(this._input[key], this._context, name);
    }
    return new Value(null, this._context, name);
  }

  public echo(callback?: (str: string) => void): iValue {
    this._context.comment(
      callback ? callback(this.toString()) : this.toString()
    );
    return this;
  }

  public col(key: string | string[]): iValue {
    // Array of strings
    if (Array.isArray(key)) {
      const name = `${key.join(", ")} in ${this.name}`;
      return new Value(
        this.toArray().map((row) => {
          const out: any[] = [];
          key.forEach((k) => {
            out.push(row[k]);
          });
          return out;
        }),
        this._context,
        name
      );
    }
    // String
    const name = `${key} in ${this.name}`;
    return new Value(
      this.toArray().map((row) => row[key]),
      this._context,
      name
    );
  }

  public longPress(ms?: number): Promise<string | void> {
    throw "longPress not implemented for this type of element";
  }

  protected async _completedAction(verb: string, noun?: string) {
    this._context.scenario.result(
      new AssertionActionCompleted(verb, noun || this.name)
    );
  }

  protected async _failedAction(verb: string, noun?: string) {
    this._context.scenario.result(
      new AssertionActionFailed(verb, noun || this.name)
    );
  }

  protected _wrapAsValue(
    data: any,
    name: string,
    parent?: any,
    highlight?: string
  ): iValue {
    const val: Value = new Value(data, this._context, name, parent, highlight);
    // If no source code of its own, inherit it from parent
    if (!val.sourceCode && parent && parent.sourceCode) {
      val._sourceCode = parent.sourceCode;
    }
    return val;
  }
}
