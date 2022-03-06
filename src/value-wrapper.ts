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
} from "./logging/assertion-result";
import { Link } from "./link";
import * as fs from "fs";
import { ValuePromise } from "./value-promise";
import { HttpResponse } from "./http/http-response";
import { HttpRequest } from "./http/http-request";
import {
  SyncIteratorBoolCallback,
  SyncIteratorCallback,
  SyncMapperCallback,
  SyncReducerCallback,
} from "./interfaces/iterator-callbacks";
import { PointerClick } from "./interfaces/pointer";
import { JsFunction, KeyValue } from "./interfaces/generic-types";
import { Bounds } from "./interfaces/bounds";
import { HttpRequestOptions } from "./interfaces/http";
import { GestureOpts, GestureType } from "./interfaces/gesture";
import { ValueOptions } from "./interfaces/value-options";
import { AssertionContext, Scenario, Value } from ".";
import { AssertionIs } from "./assertion/assertion-is";
import { JsonData } from "./json/jpath";
import {
  ScenarioConstructor,
  WrapperConstructor,
} from "./interfaces/constructor-types";
import { NumericValue } from "./values/numeric-value";
import { StringValue } from "./values/string-value";
import { UnknownValue } from "./values/unknown-value";
import { ArrayValue } from "./values/array-value";
import { BooleanValue } from "./values/boolean-value";
import { JsonValue } from "./values/json-value";
import { GenericValue } from "./values/generic-value";

export abstract class ValueWrapper<InputType> {
  protected opts: ValueOptions;

  constructor(
    public readonly $: InputType,
    public readonly context: AssertionContext,
    opts: ValueOptions | string
  ) {
    if (typeof opts == "string") opts = { name: opts };
    this.opts = opts;
  }

  public create<T, W extends ValueWrapper<T>>(
    input: T,
    opts: ValueOptions | string,
    wrapper: WrapperConstructor<W>
  ): W {
    return new wrapper(input, this.context, opts);
  }

  public createPromise<T, W extends ValueWrapper<T>>(
    input: T,
    opts: ValueOptions | string,
    wrapper: WrapperConstructor<W>
  ): ValuePromise<W> {
    return ValuePromise.wrap(this.create(input, opts, wrapper));
  }

  public get selector(): string {
    return this.opts.selector || "";
  }

  public get path(): string {
    return this.opts.path || this.opts.selector || "";
  }

  public get name(): string {
    return this.opts.name || this.opts.path || this.opts.selector || "it";
  }

  public get sourceCode(): string {
    return this.opts.sourceCode || "";
  }

  public get highlightText(): string {
    return this.opts.highlightText || "";
  }

  public get parent(): any {
    return this.opts.parent || null;
  }

  public get tagName(): string {
    return this.opts.tagName ? this.opts.tagName.toLowerCase() : "";
  }

  public get is(): AssertionIs {
    return this.assert().is;
  }

  public selectOption(value: string | string[]): ValuePromise<this> {
    throw "This Value does not support select.";
  }

  public pressEnter(): ValuePromise<this> {
    throw "This Value does not support pressEnter.";
  }

  public get length() {
    return this.create(
      Number(this.$ && this.$["length"] ? this.$["length"] : 0),
      `Length of ${this.name}`,
      NumericValue
    );
  }

  public get trim() {
    return this.create(
      typeof this.$ === "string" ? this.$.trim() : "",
      `Trim of ${this.name}`,
      StringValue
    );
  }

  public get uppercase() {
    return this.create(
      typeof this.$ === "string" ? this.$.toUpperCase() : "",
      `Uppercase of ${this.name}`,
      StringValue
    );
  }

  public get lowercase() {
    return this.create(
      typeof this.$ === "string" ? this.$.toLowerCase() : "",
      `Lowercase of ${this.name}`,
      StringValue
    );
  }

  public get first() {
    return this.create(firstIn(this.$), `First in ${this.name}`, UnknownValue);
  }

  public get mid() {
    return this.create(
      middleIn(this.$),
      `Middle in ${this.name}`,
      UnknownValue
    );
  }

  public get last() {
    return this.create(lastIn(this.$), `Last in ${this.name}`, UnknownValue);
  }

  public get random() {
    return this.create(
      randomIn(this.$),
      `Random in ${this.name}`,
      UnknownValue
    );
  }

  public get string() {
    return this.create(this.toString(), this.name, StringValue);
  }

  public get array(): ArrayValue<InputType> {
    return this.create(
      this.toArray(),
      this.name,
      ArrayValue
    ) as ArrayValue<InputType>;
  }

  public get float() {
    return this.create(this.toFloat(), this.name, NumericValue);
  }

  public get int() {
    return this.create(this.toInteger(), this.name, NumericValue);
  }

  public get bool() {
    return this.create(this.toBoolean(), this.name, BooleanValue);
  }

  public get json() {
    return this.create(this.toJSON(), this.name, JsonValue);
  }

  public get isFlagpoleValue(): true {
    return true;
  }

  public rename(newName: string): this {
    const oldName = this.name;
    this.opts.name = newName;
    //this._completedAction("RENAME", `${oldName} to ${newName}`);
    return this;
  }

  public toArray(): InputType[] {
    return Array.isArray(this.$) ? this.$ : [this.$];
  }

  public valueOf(): InputType {
    return this.$;
  }

  public toString(): string {
    const value = this.$;
    const type: string = toType(value);
    // Handle a Value in a Value
    if (type == "value" && value && value["$"]) {
      return String(value["$"]);
    }
    // If there's a value property, use that
    else if (value && value["value"]) {
      return String(value["value"]);
    }
    // If this is an object, list the keys
    else if (type == "object") {
      return String(Object.keys(value));
    }
    // Default
    return String(value);
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

  public toJSON(): JsonData {
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
    return String(toType(this.$));
  }

  public isNullOrUndefined(): boolean {
    return isNullOrUndefined(this.$);
  }

  public isUndefined(): boolean {
    return this.toType() == "undefined";
  }

  public isNull(): boolean {
    return this.$ === null;
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
    return this.toType() == "number" && (this.$ as any) !== NaN;
  }

  public isNumeric(): boolean {
    return !isNaN(this.$ as any);
  }

  public isNaN(): boolean {
    return (this.$ as any) === NaN;
  }

  public isCookie(): boolean {
    return this.$ && this.$["cookieString"];
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

  public getProperty(key: string): ValuePromise<UnknownValue> {
    return this.createPromise(
      this.$[key],
      {
        name: `${this.name} property of ${key}`,
      },
      UnknownValue
    );
  }

  public click(opts?: PointerClick): ValuePromise<this> {
    this.context.logFailure(`Element could not be clicked on: ${this.name}`);
    return ValuePromise.wrap(this);
  }

  public submit(): ValuePromise<this> {
    this.context.logFailure(`Element could not be submitted on: ${this.name}`);
    return ValuePromise.wrap(this);
  }

  public open<T extends Scenario>(
    title: string,
    type: ScenarioConstructor<T>
  ): T {
    const scenario = this.context.suite.scenario(title, type);
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
    return new Link(
      src.isString() ? src.toString() : "",
      this.context.scenario.buildUrl()
    );
  }

  public getUrl(): ValuePromise<StringValue> {
    return ValuePromise.execute<StringValue>(async () => {
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
            (await this.getAttribute("action")).$ || this.context.scenario.url
          );
        }
        return "";
      })();
      return this.create(
        String(url),
        { name: `URL from ${this.name}` },
        StringValue
      );
    });
  }

  public fillForm(
    attributeName: string,
    formData: KeyValue
  ): ValuePromise<this>;
  public fillForm(formData: KeyValue): ValuePromise<this>;
  public fillForm(a: string | KeyValue, b?: KeyValue): ValuePromise<this> {
    return ValuePromise.wrap(this);
  }

  public exists(): ValuePromise<this>;
  public exists(selector: string): ValuePromise<UnknownValue>;
  public exists(selector?: string) {
    // Without a selector, we're making an assertion that this item exists and then returning itself
    if (selector === undefined) {
      this.isNullOrUndefined()
        ? this._failedAction("EXISTS", `${this.name}`)
        : this._completedAction("EXISTS", `${this.name}`);
      return ValuePromise.wrap(this);
    }
    // With a secelector we're doing a find, seeing if that sub-item exists and returning that sub-item
    return ValuePromise.execute(async () => {
      const el = await this.find(selector);
      el.isNull()
        ? this._failedAction("EXISTS", `${selector}`)
        : this._completedAction("EXISTS", `${selector}`);
      return el;
    });
  }

  public find(selector: string): ValuePromise<UnknownValue> {
    return ValuePromise.wrap(this.item(selector));
  }

  public async findAll(selector: string): Promise<Value[]> {
    return [await this.find(selector)];
  }

  public getClassName(): ValuePromise<StringValue> {
    throw "Class Name is not supported for this type of value";
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

  public getTag(): ValuePromise<StringValue> {
    return this.createPromise(
      this.tagName,
      {
        name: `Tag Name of ${this.name}`,
      },
      StringValue
    );
  }

  public async hasTag(tag?: string | RegExp): Promise<boolean> {
    const myTag = (await this.getTag()).$;
    if (tag === undefined) {
      return !!myTag;
    }
    return tag instanceof RegExp ? (tag as RegExp).test(myTag) : myTag == tag;
  }

  public getInnerText(): ValuePromise<StringValue> {
    return this.createPromise(
      this.toString(),
      {
        name: `Inner Text of ${this.name}`,
      },
      StringValue
    );
  }

  public getInnerHtml(): ValuePromise<StringValue> {
    throw "Inner HTML not supported for this type of value";
  }

  public getOuterHtml(): ValuePromise<StringValue> {
    throw "Outer HTML not supported for this type of value";
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

  public getAttribute(key: string): ValuePromise<UnknownValue> {
    return this.getProperty(key);
  }

  public getStyleProperty(key: string): ValuePromise<StringValue> {
    throw "Style Property not supported for this type of value";
  }

  public getValue(): ValuePromise<UnknownValue> {
    throw "Get Value is not supported for this type of value";
  }

  public scrollTo(): ValuePromise<this> {
    throw "Scroll To is not supported for this type of value";
  }

  public async hasText(text?: string): Promise<boolean> {
    const myText = (await this.getText()).$;
    return text ? text == myText : !!myText;
  }

  public getText(): ValuePromise<StringValue> {
    return this.createPromise(
      this.toString(),
      {
        name: this.name,
        parent: this.parent,
        highlightText: this.highlightText,
      },
      StringValue
    );
  }

  public get values(): ArrayValue<unknown> {
    let values: any[] = [];
    try {
      values = Object.values(this.$);
    } catch {}
    return this.create(
      values,
      {
        name: `Values of ${this.name}`,
        highlightText: this.highlightText,
      },
      ArrayValue
    );
  }

  public get keys(): ArrayValue<string> {
    let keys: string[] = [];
    try {
      keys = Object.keys(this.$);
    } catch {}
    return this.create(
      keys,
      {
        name: `Keys of ${this.name}`,
        highlightText: this.highlightText,
      },
      ArrayValue
    ) as ArrayValue<string>;
  }

  public async screenshot(): Promise<Buffer> {
    throw new Error(
      `This value type (${this.toType()}) or scenario type does not support screenshots.`
    );
  }

  public async eval(js: string): Promise<any> {
    throw `This element does not support eval().`;
  }

  public focus(): ValuePromise<this> {
    throw `This element does not support focus().`;
  }

  public hover(): ValuePromise<this> {
    throw `This element does not support hover().`;
  }

  public blur(): ValuePromise<this> {
    throw `This element does not support blur().`;
  }

  public tap(opts: PointerClick): ValuePromise<this> {
    throw `This element does not support tap().`;
  }

  public longpress(opts: PointerClick): ValuePromise<this> {
    throw `This element does not support longpress().`;
  }

  public press(key: string, opts?: any): ValuePromise<this> {
    throw `This element does not support press().`;
  }

  public clearThenType(textToType: string, opts?: any): ValuePromise<this> {
    throw `This element does not support clearThenType().`;
  }

  public type(textToType: string, opts?: any): ValuePromise<this> {
    throw `This element does not support type().`;
  }

  public clear(): ValuePromise<this> {
    throw `This element does not support clear().`;
  }

  public getAncestor(selector: string): ValuePromise<UnknownValue> {
    throw `getAncestor() is not supported by ${this.name}`;
  }

  public async getChildren(selector?: string): Promise<UnknownValue[]> {
    throw `getChildren() is not supported by ${this.name}`;
  }

  public async getAncestors(selector: string): Promise<UnknownValue[]> {
    throw `getAncestors() is not supported by ${this.name}`;
  }

  public getAncestorOrSelf(selector: string): ValuePromise<UnknownValue> {
    throw `getAncestorOrSelf() is not supported by ${this.name}`;
  }

  public getFirstChild(selector?: string): ValuePromise<UnknownValue> {
    throw `getFirstChild() is not supported by ${this.name}`;
  }

  public getLastChild(selector?: string): ValuePromise<UnknownValue> {
    throw `getLastChild() is not supported by ${this.name}`;
  }

  public getFirstSibling(selector?: string): ValuePromise<UnknownValue> {
    throw `getFirstSibling() is not supported by ${this.name}`;
  }

  public getLastSibling(selector?: string): ValuePromise<UnknownValue> {
    throw `getLastSibling() is not supported by ${this.name}`;
  }

  public getChildOrSelf(selector?: string): ValuePromise<UnknownValue> {
    throw `getChildOrSelf() is not supported by ${this.name}`;
  }

  public getDescendantOrSelf(selector?: string): ValuePromise<UnknownValue> {
    throw `getDescendantOrSelf() is not supported by ${this.name}`;
  }

  public async getDescendants(selector?: string): Promise<UnknownValue[]> {
    throw `getDescendants() is not supported by ${this.name}`;
  }

  public getParent(): ValuePromise<UnknownValue> {
    throw `getParent() is not supported by ${this.name}`;
  }

  public async getSiblings(selector?: string): Promise<ValueWrapper<any>[]> {
    throw `getSiblings() is not supported by ${this.name}`;
  }

  public getPreviousSibling(selector?: string): ValuePromise<UnknownValue> {
    throw `getPreviousSibling() is not supported by ${this.name}`;
  }

  public async getPreviousSiblings(selector?: string): Promise<UnknownValue[]> {
    throw `getPreviousSiblings() is not supported by ${this.name}`;
  }

  public getNextSibling(selector?: string): ValuePromise<UnknownValue> {
    throw `getNextSibling() is not supported by ${this.name}`;
  }

  public async getNextSiblings(selector?: string): Promise<UnknownValue[]> {
    throw `getNextSiblings() is not supported by ${this.name}`;
  }

  public async getBounds(boxType?: string): Promise<Bounds | null> {
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
      return { encoding: "utf8" };
    })();
    const request = new HttpRequest({
      ...{
        uri: link.getUri(),
        method: "get",
      },
      ...opts,
    });
    const resp = await request.fetch(this.context.scenario.adapter);
    const header = Array.isArray(resp.headers["content-type"])
      ? resp.headers["content-type"][0]
      : resp.headers["content-type"];
    const file: string | Buffer = header.startsWith("image")
      ? Buffer.from(resp.body, "base64")
      : resp.body;
    if (localFilePath) {
      fs.writeFileSync(localFilePath, file);
    }

    return resp;
  }

  public waitForFunction(js: JsFunction): ValuePromise<this> {
    throw `waitForFunction() is not supported by this type of scenario`;
  }

  public waitForHidden(): ValuePromise<this> {
    throw `waitForHidden() is not supported by this type of scenario`;
  }

  public waitForVisible(): ValuePromise<this> {
    throw `waitForVisible() is not supported by this type of scenario`;
  }

  public setValue(text: string): ValuePromise<this> {
    throw `setValue() is not supported by ${this.name}`;
  }

  public assert(message?: string) {
    return typeof message == "string"
      ? this.context.assert(message, this)
      : this.context.assert(this);
  }

  public split(by: string | RegExp, limit?: number) {
    return this.create(
      this.toString().split(by, limit),
      this.opts,
      StringValue
    );
  }

  public join(by: string) {
    return this.create(this.toArray().join(by), this.name, StringValue);
  }

  public pluck(property: string) {
    const arr = this.toArray().map((item) => item[property]);
    return this.create(
      arr,
      {
        name: `Values of ${property} in ${this.name}`,
      },
      ArrayValue
    );
  }

  public nth(index: number) {
    const value = nthIn(this.$, index);
    const nth = toOrdinal(index + 1);
    return this.create(value, `${nth} value in ${this.name}`, UnknownValue);
  }

  public map(callback: SyncMapperCallback) {
    return this.create(
      this.isArray() ? this.toArray().map(callback) : callback(this.$),
      this.name,
      ArrayValue
    );
  }

  public filter(func: (value: any, i?: number, arr?: any[]) => boolean) {
    return this.create(this.toArray().filter(func), this.name, ArrayValue);
  }

  public each(callback: SyncIteratorCallback): this {
    this.toArray().forEach(callback);
    return this;
  }

  public min(key?: string) {
    return this.create(
      this.toArray().reduce((min, row) => {
        const val = key ? row[key] : row;
        return min === null || val < min ? val : min;
      }, null),
      this.name,
      UnknownValue
    );
  }

  public max(key?: string) {
    return this.create(
      this.toArray().reduce((max, row) => {
        const val = key ? row[key] : row;
        return max === null || val > max ? val : max;
      }, null),
      this.name,
      UnknownValue
    );
  }

  public sum(key?: string) {
    return this.create(
      Number(
        this.toArray().reduce(
          (sum, row) => (sum += Number(key ? row[key] : row)),
          0
        )
      ),
      this.name,
      NumericValue
    );
  }

  public count(key?: string) {
    return this.create(
      Number(
        this.toArray().reduce((count, row) => {
          if (key) {
            return count + (row[key] ? 1 : 0);
          }
          return count + 1;
        }, 0)
      ),
      this.name,
      NumericValue
    );
  }

  public unique(): ArrayValue<InputType> {
    const uniqueArray = [...new Set(this.toArray())];
    return this.create(
      uniqueArray,
      this.name,
      ArrayValue
    ) as ArrayValue<InputType>;
  }

  public groupBy(key: string): GenericValue<{
    [key: string]: any[];
  }> {
    const grouped = this.toArray().reduce((grouper, row) => {
      const val = String(row[key]);
      if (!grouper[val]) {
        grouper[val] = [];
      }
      grouper[val].push(row);
      return grouper;
    }, {});
    return this.create(grouped, this.name, GenericValue);
  }

  public asc(key?: string): ArrayValue<InputType> {
    const collator = new Intl.Collator("en", {
      numeric: true,
      sensitivity: "base",
    });
    const arr = this.toArray().sort((a, b) =>
      key
        ? collator.compare(a[key], b[key])
        : collator.compare(String(a), String(b))
    );
    return this.create(arr, this.name, GenericValue);
  }

  public desc(key?: string): ArrayValue<InputType> {
    const collator = new Intl.Collator("en", {
      numeric: true,
      sensitivity: "base",
    });
    const arr = this.toArray().sort(
      (a, b) =>
        (key
          ? collator.compare(a[key], b[key])
          : collator.compare(String(a), String(b))) * -1
    );
    return this.create(arr, this.name, GenericValue);
  }

  private getFloatsAB(a: any, b: any, key?: string) {
    a = key ? a[key] : a;
    b = key ? b[key] : b;
    const floatA = typeof a == "number" ? a : parseFloat(String(a));
    const floatB = typeof b == "number" ? b : parseFloat(String(b));
    return [a, b];
  }

  public median(key?: string) {
    const arr = this.toArray().sort((a, b) => {
      const [floatA, floatB] = this.getFloatsAB(a, b, key);
      return floatA - floatB;
    });
    const med = Number(arr[Math.floor(arr.length / 2)]);
    return this.create(med, this.name, NumericValue);
  }

  public avg(key?: string) {
    const arr = this.toArray();
    return this.create(
      arr.reduce((sum, row) => (sum += Number(key ? row[key] : row)), 0) /
        arr.length,
      this.name,
      NumericValue
    );
  }

  public reduce(callback: SyncReducerCallback, initial?: any) {
    return this.create(
      this.toArray().reduce(callback, initial),
      this.name,
      GenericValue
    );
  }

  public every(callback: SyncIteratorBoolCallback) {
    return this.create(this.toArray().every(callback), this.name, BooleanValue);
  }

  public some(callback: SyncIteratorBoolCallback) {
    return this.create(this.toArray().some(callback), this.name, BooleanValue);
  }

  public none(callback: SyncIteratorBoolCallback) {
    return this.create(!this.toArray().some(callback), this.name, BooleanValue);
  }

  public item(key: string | number) {
    const name = `${key} in ${this.name}`;
    if (this.$[key]) {
      return this.create(this.$[key], { name }, GenericValue);
    }
    return this.create(null, { name }, GenericValue);
  }

  public echo(callback?: (str: string) => void): this {
    this.context.comment(
      callback ? callback(this.toString()) : this.toString()
    );
    return this;
  }

  public col(key: string | string[]) {
    // Array of strings
    if (Array.isArray(key)) {
      const name = `${key.join(", ")} in ${this.name}`;
      return this.create(
        this.toArray().map((row) => {
          const out: any[] = [];
          key.forEach((k) => {
            out.push(row[k]);
          });
          return out;
        }),
        {
          name,
        },
        ArrayValue
      );
    }
    // String
    const name = `${key} in ${this.name}`;
    return this.create(
      this.toArray().map((row) => row[key]),
      {
        name,
      },
      ArrayValue
    );
  }

  public gesture(type: GestureType, opts: GestureOpts): ValuePromise<this> {
    throw `gesture not implemented for ${this.name}`;
  }

  protected async _completedAction(verb: string, noun?: string) {
    this.context.scenario.result(
      new AssertionActionCompleted(verb, noun || this.name)
    );
  }

  protected async _failedAction(verb: string, noun?: string) {
    this.context.scenario.result(
      new AssertionActionFailed(verb, noun || this.name)
    );
  }
}
