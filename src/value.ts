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
import {
  ClassConstructor,
  JsFunction,
  KeyValue,
} from "./interfaces/generic-types";
import { Bounds } from "./interfaces/bounds";
import { HttpRequestOptions } from "./interfaces/http";
import { GestureOpts, GestureType } from "./interfaces/gesture";
import { ValueOptions } from "./interfaces/value-options";
import { AssertionContext, Scenario } from ".";
import { AssertionIs } from "./assertion/assertion-is";
import { ValueFactory } from "./helpers/value-factory";
import { JsonData } from "./json/jpath";
import { ScenarioConstructor } from "./interfaces/constructor-types";

export class Value<InputType = any> {
  protected valueFactory = new ValueFactory(this.context);

  constructor(
    public readonly $: InputType,
    public readonly context: AssertionContext,
    protected opts: ValueOptions
  ) {}

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

  public selectOption(value: string | string[]): ValuePromise<InputType, this> {
    throw "This Value does not support select.";
  }

  public pressEnter(): ValuePromise<InputType, this> {
    throw "This Value does not support pressEnter.";
  }

  public get length(): Value<number> {
    return this.valueFactory.create(
      Number(this.$ && this.$["length"] ? this.$["length"] : 0),
      `Length of ${this.name}`
    );
  }

  public get trim(): Value<string> {
    return this.valueFactory.create(
      typeof this.$ === "string" ? this.$.trim() : "",
      `Trim of ${this.name}`
    );
  }

  public get uppercase(): Value<string> {
    return this.valueFactory.create(
      typeof this.$ === "string" ? this.$.toUpperCase() : "",
      `Uppercase of ${this.name}`
    );
  }

  public get lowercase(): Value<string> {
    return this.valueFactory.create(
      typeof this.$ === "string" ? this.$.toLowerCase() : "",
      `Lowercase of ${this.name}`
    );
  }

  public get first(): Value {
    return this.valueFactory.create(firstIn(this.$), `First in ${this.name}`);
  }

  public get mid(): Value {
    return this.valueFactory.create(middleIn(this.$), `Middle in ${this.name}`);
  }

  public get last(): Value {
    return this.valueFactory.create(lastIn(this.$), `Last in ${this.name}`);
  }

  public get random(): Value {
    return this.valueFactory.create(randomIn(this.$), `Random in ${this.name}`);
  }

  public get string(): Value<string> {
    return this.valueFactory.create(this.toString(), this.name);
  }

  public get array(): Value<any[]> {
    return this.valueFactory.create(this.toArray(), this.name);
  }

  public get float(): Value<number> {
    return this.valueFactory.create(this.toFloat(), this.name);
  }

  public get int(): Value<number> {
    return this.valueFactory.create(this.toInteger(), this.name);
  }

  public get bool(): Value<boolean> {
    return this.valueFactory.create(this.toBoolean(), this.name);
  }

  public get json(): Value<JsonData> {
    return this.valueFactory.create(this.toJSON(), this.name);
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

  public toArray(): any[] {
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

  public getProperty(key: string): ValuePromise<any, Value> {
    return this.valueFactory.createPromise(this.$[key], {
      name: `${this.name} property of ${key}`,
    });
  }

  public click(opts?: PointerClick): ValuePromise<InputType, this> {
    this.context.logFailure(`Element could not be clicked on: ${this.name}`);
    return ValuePromise.wrap(this);
  }

  public submit(): ValuePromise<InputType, this> {
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

  public getUrl(): ValuePromise<string | null, Value<string | null>> {
    return ValuePromise.execute(async () => {
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
        return null;
      })();
      return this.valueFactory.create(url, { name: `URL from ${this.name}` });
    });
  }

  public fillForm(
    attributeName: string,
    formData: KeyValue
  ): ValuePromise<InputType, this>;
  public fillForm(formData: KeyValue): ValuePromise<InputType, this>;
  public fillForm(
    a: string | KeyValue,
    b?: KeyValue
  ): ValuePromise<InputType, this> {
    return ValuePromise.wrap(this);
  }

  exists(): ValuePromise<InputType, this>;
  exists(selector: string): ValuePromise<any, Value>;
  public exists(selector?: string): ValuePromise<any, Value> {
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

  public find(selector: string): ValuePromise<any, Value> {
    return ValuePromise.wrap(this.item(selector));
  }

  public async findAll(selector: string): Promise<Value[]> {
    return [await this.find(selector)];
  }

  public getClassName(): ValuePromise<string, Value> {
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

  public getTag(): ValuePromise<string, Value<string>> {
    return this.valueFactory.createPromise(this.tagName, {
      name: `Tag Name of ${this.name}`,
    });
  }

  public async hasTag(tag?: string | RegExp): Promise<boolean> {
    const myTag = (await this.getTag()).$;
    if (tag === undefined) {
      return !!myTag;
    }
    return tag instanceof RegExp ? (tag as RegExp).test(myTag) : myTag == tag;
  }

  public getInnerText(): ValuePromise<string, Value<string>> {
    return this.valueFactory.createPromise(this.toString(), {
      name: `Inner Text of ${this.name}`,
    });
  }

  public getInnerHtml(): ValuePromise<string, Value<string>> {
    throw "Inner HTML not supported for this type of value";
  }

  public getOuterHtml(): ValuePromise<string, Value<string>> {
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

  public getAttribute(key: string): ValuePromise<any, Value<any>> {
    return this.getProperty(key);
  }

  public getStyleProperty(
    key: string
  ): ValuePromise<string | null, Value<string | null>> {
    throw "Style Property not supported for this type of value";
  }

  public getValue(): ValuePromise<any, Value<any>> {
    throw "Get Value is not supported for this type of value";
  }

  public scrollTo(): ValuePromise<InputType, this> {
    throw "Scroll To is not supported for this type of value";
  }

  public async hasText(text?: string): Promise<boolean> {
    const myText = (await this.getText()).$;
    return text ? text == myText : !!myText;
  }

  public getText(): ValuePromise<string, Value<string>> {
    return this.valueFactory.createPromise(this.toString(), {
      name: this.name,
      parent: this.parent,
      highlightText: this.highlightText,
    });
  }

  public get values(): Value<any> {
    let values: any[] = [];
    try {
      values = Object.values(this.$);
    } catch {}
    return this.valueFactory.create(values, {
      name: `Values of ${this.name}`,
      highlightText: this.highlightText,
    });
  }

  public get keys(): Value<string[]> {
    let keys: string[] = [];
    try {
      keys = Object.keys(this.$);
    } catch {}
    return this.valueFactory.create(keys, {
      name: `Keys of ${this.name}`,
      highlightText: this.highlightText,
    });
  }

  public async screenshot(): Promise<Buffer> {
    throw new Error(
      `This value type (${this.toType()}) or scenario type does not support screenshots.`
    );
  }

  public async eval(js: string): Promise<any> {
    throw `This element does not support eval().`;
  }

  public focus(): ValuePromise<InputType, this> {
    throw `This element does not support focus().`;
  }

  public hover(): ValuePromise<InputType, this> {
    throw `This element does not support hover().`;
  }

  public blur(): ValuePromise<InputType, this> {
    throw `This element does not support blur().`;
  }

  public tap(opts: PointerClick): ValuePromise<InputType, this> {
    throw `This element does not support tap().`;
  }

  public longpress(opts: PointerClick): ValuePromise<InputType, this> {
    throw `This element does not support longpress().`;
  }

  public press(key: string, opts?: any): ValuePromise<InputType, this> {
    throw `This element does not support press().`;
  }

  public clearThenType(
    textToType: string,
    opts?: any
  ): ValuePromise<InputType, this> {
    throw `This element does not support clearThenType().`;
  }

  public type(textToType: string, opts?: any): ValuePromise<InputType, this> {
    throw `This element does not support type().`;
  }

  public clear(): ValuePromise<InputType, this> {
    throw `This element does not support clear().`;
  }

  public getAncestor(selector: string): ValuePromise<InputType, Value<any>> {
    throw `getAncestor() is not supported by ${this.name}`;
  }

  public async getChildren(selector?: string): Promise<Value<any>[]> {
    throw `getChildren() is not supported by ${this.name}`;
  }

  public async getAncestors(selector: string): Promise<Value<any>[]> {
    throw `getAncestors() is not supported by ${this.name}`;
  }

  public getAncestorOrSelf(selector: string): ValuePromise<any, Value<any>> {
    throw `getAncestorOrSelf() is not supported by ${this.name}`;
  }

  public getFirstChild(selector?: string): ValuePromise<any, Value<any>> {
    throw `getFirstChild() is not supported by ${this.name}`;
  }

  public getLastChild(selector?: string): ValuePromise<any, Value<any>> {
    throw `getLastChild() is not supported by ${this.name}`;
  }

  public getFirstSibling(selector?: string): ValuePromise<any, Value<any>> {
    throw `getFirstSibling() is not supported by ${this.name}`;
  }

  public getLastSibling(selector?: string): ValuePromise<any, Value<any>> {
    throw `getLastSibling() is not supported by ${this.name}`;
  }

  public getChildOrSelf(selector?: string): ValuePromise<any, Value<any>> {
    throw `getChildOrSelf() is not supported by ${this.name}`;
  }

  public getDescendantOrSelf(selector?: string): ValuePromise<any, Value<any>> {
    throw `getDescendantOrSelf() is not supported by ${this.name}`;
  }

  public async getDescendants(selector?: string): Promise<Value<any>[]> {
    throw `getDescendants() is not supported by ${this.name}`;
  }

  public getParent(): ValuePromise<any, Value<any>> {
    throw `getParent() is not supported by ${this.name}`;
  }

  public async getSiblings(selector?: string): Promise<Value<any>[]> {
    throw `getSiblings() is not supported by ${this.name}`;
  }

  public getPreviousSibling(selector?: string): ValuePromise<any, Value<any>> {
    throw `getPreviousSibling() is not supported by ${this.name}`;
  }

  public async getPreviousSiblings(selector?: string): Promise<Value<any>[]> {
    throw `getPreviousSiblings() is not supported by ${this.name}`;
  }

  public getNextSibling(selector?: string): ValuePromise<any, Value<any>> {
    throw `getNextSibling() is not supported by ${this.name}`;
  }

  public async getNextSiblings(selector?: string): Promise<Value<any>[]> {
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

  public waitForFunction(js: JsFunction): ValuePromise<any, this> {
    throw `waitForFunction() is not supported by this type of scenario`;
  }

  public waitForHidden(): ValuePromise<any, this> {
    throw `waitForHidden() is not supported by this type of scenario`;
  }

  public waitForVisible(): ValuePromise<any, this> {
    throw `waitForVisible() is not supported by this type of scenario`;
  }

  public setValue(text: string): ValuePromise<any, this> {
    throw `setValue() is not supported by ${this.name}`;
  }

  public assert(message?: string) {
    return typeof message == "string"
      ? this.context.assert(message, this)
      : this.context.assert(this);
  }

  public split(by: string | RegExp, limit?: number): Value<any[]> {
    return this.valueFactory.create(this.toString().split(by, limit), {
      name: this.name,
    });
  }

  public join(by: string): Value<string> {
    return this.valueFactory.create(this.toArray().join(by), this.name);
  }

  public pluck(property: string): Value<any[]> {
    const arr = this.toArray().map((item) => item[property]);
    return this.valueFactory.create(arr, {
      name: `Values of ${property} in ${this.name}`,
    });
  }

  public nth(index: number): Value<any> {
    const value = nthIn(this.$, index);
    const nth = toOrdinal(index + 1);
    return this.valueFactory.create(value, `${nth} value in ${this.name}`);
  }

  public map(callback: SyncMapperCallback): Value<any[]> {
    return this.valueFactory.create(
      this.isArray() ? this.toArray().map(callback) : callback(this.$),
      this.name
    );
  }

  public filter(
    func: (value: any, i?: number, arr?: any[]) => boolean
  ): Value<any[]> {
    return this.valueFactory.create(this.toArray().filter(func), this.name);
  }

  public each(callback: SyncIteratorCallback): this {
    this.toArray().forEach(callback);
    return this;
  }

  public min(key?: string): Value<any> {
    return this.valueFactory.create(
      this.toArray().reduce((min, row) => {
        const val = key ? row[key] : row;
        return min === null || val < min ? val : min;
      }, null),
      this.name
    );
  }

  public max(key?: string): Value<any> {
    return this.valueFactory.create(
      this.toArray().reduce((max, row) => {
        const val = key ? row[key] : row;
        return max === null || val > max ? val : max;
      }, null),
      this.name
    );
  }

  public sum(key?: string): Value<number> {
    return this.valueFactory.create(
      Number(
        this.toArray().reduce(
          (sum, row) => (sum += Number(key ? row[key] : row)),
          0
        )
      ),
      this.name
    );
  }

  public count(key?: string): Value<number> {
    return this.valueFactory.create(
      Number(
        this.toArray().reduce((count, row) => {
          if (key) {
            return count + !!row[key] ? 1 : 0;
          }
          return count + 1;
        }, 0)
      ),
      this.name
    );
  }

  public unique(): Value<any[]> {
    return this.valueFactory.create([...new Set(this.toArray())], this.name);
  }

  public groupBy(key: string): Value<{
    [key: string]: any[];
  }> {
    return this.valueFactory.create(
      this.toArray().reduce((grouper, row) => {
        const val = String(row[key]);
        if (!grouper[val]) {
          grouper[val] = [];
        }
        grouper[val].push(row);
        return grouper;
      }, {}),
      this.name
    );
  }

  public asc(key?: string): Value<any[]> {
    const collator = new Intl.Collator("en", {
      numeric: true,
      sensitivity: "base",
    });
    const arr = this.toArray().sort((a, b) =>
      key ? collator.compare(a[key], b[key]) : collator.compare(a, b)
    );
    return this.valueFactory.create(arr, this.name);
  }

  public desc(key?: string): Value<any[]> {
    const collator = new Intl.Collator("en", {
      numeric: true,
      sensitivity: "base",
    });
    const arr = this.toArray().sort(
      (a, b) =>
        (key ? collator.compare(a[key], b[key]) : collator.compare(a, b)) * -1
    );
    return this.valueFactory.create(arr, this.name);
  }

  public median(key?: string): Value<number> {
    const arr = this.toArray().sort((a, b) =>
      key ? parseFloat(a[key]) - parseFloat(b[key]) : a - b
    );
    const med = Number(arr[Math.floor(arr.length / 2)]);
    return this.valueFactory.create(med, this.name);
  }

  public avg(key?: string): Value<number> {
    const arr = this.toArray();
    return this.valueFactory.create(
      arr.reduce((sum, row) => (sum += Number(key ? row[key] : row)), 0) /
        arr.length,
      this.name
    );
  }

  public reduce(callback: SyncReducerCallback, initial?: any): Value<any> {
    return this.valueFactory.create(
      this.toArray().reduce(callback, initial),
      this.name
    );
  }

  public every(callback: SyncIteratorBoolCallback): Value<boolean> {
    return this.valueFactory.create(this.toArray().every(callback), this.name);
  }

  public some(callback: SyncIteratorBoolCallback): Value<boolean> {
    return this.valueFactory.create(this.toArray().some(callback), this.name);
  }

  public none(callback: SyncIteratorBoolCallback): Value<boolean> {
    return this.valueFactory.create(!this.toArray().some(callback), this.name);
  }

  public item(key: string | number) {
    const name = `${key} in ${this.name}`;
    if (this.$[key]) {
      return this.valueFactory.create(this.$[key], { name });
    }
    return this.valueFactory.create(null, { name });
  }

  public echo(callback?: (str: string) => void): this {
    this.context.comment(
      callback ? callback(this.toString()) : this.toString()
    );
    return this;
  }

  public col(key: string | string[]): Value<any[]> {
    // Array of strings
    if (Array.isArray(key)) {
      const name = `${key.join(", ")} in ${this.name}`;
      return this.valueFactory.create(
        this.toArray().map((row) => {
          const out: any[] = [];
          key.forEach((k) => {
            out.push(row[k]);
          });
          return out;
        }),
        {
          name,
        }
      );
    }
    // String
    const name = `${key} in ${this.name}`;
    return this.valueFactory.create(
      this.toArray().map((row) => row[key]),
      {
        name,
      }
    );
  }

  public gesture(
    type: GestureType,
    opts: GestureOpts
  ): ValuePromise<InputType, this> {
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
