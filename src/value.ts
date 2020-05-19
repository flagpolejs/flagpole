import {
  iAssertionContext,
  iValue,
  iScenario,
  KeyValue,
  iBounds,
} from "./interfaces";
import { toType, isNullOrUndefined } from "./util";
import {
  AssertionActionCompleted,
  AssertionActionFailed,
} from "./logging/assertionresult";

export class Value implements iValue {
  protected _input: any;
  protected _context: iAssertionContext;
  protected _name: string | null;
  protected _parent: any;
  protected _highlight: string;
  protected _sourceCode: string | null = null;
  protected _path: string | undefined;
  protected _tagName: string | undefined;

  public get $(): any {
    return this._input;
  }

  public get tagName(): string {
    return this._tagName || "";
  }

  public get outerHTML(): string {
    return this._sourceCode || "";
  }

  public get length(): iValue {
    const thisValue: any = this.$;
    return new Value(
      thisValue && thisValue.length ? thisValue.length : 0,
      this._context,
      `Length of ${this._name}`
    );
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

  public toFloat(): number {
    return parseFloat(this.toString());
  }

  public toInteger(): number {
    return parseInt(this.toString());
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

  public async hasProperty(key: string): Promise<iValue> {
    return this._wrapAsValue(
      this._input &&
        this._input.hasOwnProperty &&
        this._input.hasOwnProperty(key),
      `${this.name} has property ${key}`
    );
  }

  public as(aliasName: string): iValue {
    this._context.scenario.set(aliasName, this);
    return this;
  }

  public async getProperty(key: string): Promise<any> {
    if (!this.isNullOrUndefined() && this.hasProperty(key)) {
      return this._input[key];
    }
    return undefined;
  }

  public click(): Promise<void>;
  public click(scenario: iScenario): Promise<iScenario>;
  public click(message: string): Promise<iScenario>;
  public click(callback: Function): Promise<iScenario>;
  public click(message: string, callback: Function): Promise<iScenario>;
  public async click(a?: any, b?: any): Promise<void | iScenario> {
    this._context.logFailure(`Element could not be clicked on: ${this.name}`);
  }

  public submit(): Promise<void>;
  public submit(scenario: iScenario): Promise<iScenario>;
  public submit(message: string): Promise<iScenario>;
  public submit(callback: Function): Promise<iScenario>;
  public async submit(a?: any, b?: any): Promise<void | iScenario> {}

  public load(): iScenario;
  public load(message: string): iScenario;
  public load(scenario: iScenario): iScenario;
  public load(callback: Function): iScenario;
  public load(a?: any, b?: any): iScenario | void {}

  public async fillForm(
    attributeName: string,
    formData: KeyValue
  ): Promise<iValue>;
  public async fillForm(formData: KeyValue): Promise<iValue>;
  public async fillForm(a: string | KeyValue, b?: KeyValue): Promise<iValue> {
    return this;
  }

  public async exists(): Promise<iValue>;
  public async exists(selector: string): Promise<iValue>;
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

  public async find(selector: string): Promise<iValue> {
    return this._wrapAsValue(null, selector);
  }

  public async findAll(selector: string): Promise<iValue[]> {
    return [];
  }

  public async getClassName(): Promise<iValue> {
    return this._wrapAsValue(null, `${this.name} Class`);
  }

  public async hasClassName(className: string): Promise<iValue> {
    return this._wrapAsValue(false, `${this.name} has class ${className}`);
  }

  public async getTagName(): Promise<iValue> {
    return this._wrapAsValue(this.tagName, `Tag Name of ${this.name}`);
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

  public hasAttribute(key: string): Promise<iValue> {
    return this.hasProperty(key);
  }

  public getAttribute(key: string): Promise<iValue> {
    return this.getProperty(key);
  }

  public hasData(key: string): Promise<iValue> {
    return this.hasProperty(key);
  }

  public getData(key: string): Promise<iValue> {
    return this.getProperty(key);
  }

  public async getStyleProperty(key: string): Promise<iValue> {
    return this._wrapAsValue(null, `Style of ${key}`);
  }

  public async download(): Promise<any> {
    throw new Error("Download is not supported on this value type.");
  }

  public async getValue(): Promise<iValue> {
    return this;
  }

  public async getText(): Promise<iValue> {
    return this._wrapAsValue(
      this.toString(),
      this.name,
      this.parent,
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

  public async focus() {
    throw `This element does not support focus().`;
  }

  public async hover() {
    throw `This element does not support hover().`;
  }

  public async tap() {
    throw `This element does not support tap().`;
  }

  public async press(key: string, opts?: any) {
    throw `This element does not support press().`;
  }

  public async clearThenType(textToType: string, opts?: any) {
    throw `This element does not support clearThenType().`;
  }

  public async type(textToType: string, opts?: any) {
    throw `This element does not support type().`;
  }

  public async clear() {
    throw `This element does not support clear().`;
  }

  public async getClosest(selector?: string): Promise<iValue> {
    return this;
  }

  public async getChildren(selector?: string): Promise<iValue[]> {
    return [];
  }

  public async getParent(): Promise<iValue> {
    return this;
  }

  public async getSiblings(selector?: string): Promise<iValue[]> {
    return [];
  }

  public async getPreviousSibling(selector?: string) {
    return this._wrapAsValue(
      null,
      `Previous Sibling ${selector} of ${this.name}`,
      this
    );
  }

  public async getPreviousSiblings(selector?: string): Promise<iValue[]> {
    return [];
  }

  public async getNextSibling(selector?: string): Promise<iValue> {
    return this._wrapAsValue(
      null,
      `Next Sibling ${selector} of ${this.name}`,
      this
    );
  }

  public async getNextSiblings(selector?: string): Promise<iValue[]> {
    return [];
  }

  public async getBounds(boxType: string): Promise<iBounds | null> {
    return null;
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
