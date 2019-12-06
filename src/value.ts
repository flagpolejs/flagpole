import { iAssertionContext, iValue } from "./interfaces";
import { toType, isNullOrUndefined } from "./util";

export abstract class ProtoValue implements iValue {
  protected _input: any;
  protected _context: iAssertionContext;
  protected _name: string | null;
  protected _parent: any;
  protected _highlight: string;
  protected _sourceCode: string | null = null;

  public get $(): any {
    return this._input;
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

  public async hasProperty(key: string): Promise<Value> {
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

  protected _wrapAsValue(
    data: any,
    name: string,
    parent?: any,
    highlight?: string
  ): Value {
    const val: Value = new Value(data, this._context, name, parent, highlight);
    // If no source code of its own, inherit it from parent
    if (!val.sourceCode && parent && parent.sourceCode) {
      val._sourceCode = parent.sourceCode;
    }
    return val;
  }
}

export class Value extends ProtoValue implements iValue {
  public async getProperty(key: string): Promise<any> {
    if (!this.isNullOrUndefined() && this.hasProperty(key)) {
      const thisValue: any = this.$;
      return this._input[key];
    }
    return undefined;
  }

  public async hasProperty(key: string): Promise<Value> {
    const thisValue: any = this.$;
    return thisValue && thisValue.hasOwnProperty(key);
  }

  public get length(): Value {
    const thisValue: any = this.$;
    return new Value(
      thisValue && thisValue.length ? thisValue.length : 0,
      this._context,
      `Length of ${this._name}`
    );
  }
}
