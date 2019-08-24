import { Flagpole } from '.';
import { AssertionContext } from './assertioncontext';

export interface iValue {
    $: any,
    name: string,
    toArray(): any[],
    toString(): string,
    toInteger(): number,
    toFloat(): number,
    toType(): string,
    isNullOrUndefined(): boolean,
    isUndefined(): boolean,
    isNull(): boolean,
    isNaN(): boolean,
    isNumber(): boolean,
    isNumeric(): boolean,
    isObject(): boolean,
    isPromise(): boolean,
    isRegularExpression(): boolean,
    isString(): boolean,
    isArray(): boolean,
    isCookie(): boolean,
    isPuppeteerElement(): boolean,
    isCheerioElement(): boolean,
    hasProperty(key: string): Promise<iValue>
}

export abstract class ProtoValue  implements iValue{

    protected _input: any;
    protected _context: AssertionContext;
    protected _name: string | null;
    protected _source: any;
    protected _highlight: string;

    public get $(): any {
        return this._input;
    }

    public get name(): string {
        return this._name || 'it';
    }

    public get highlight(): string {
        return this._highlight;
    }

    constructor(input: any, context: AssertionContext, name?: string, source: any = null, highlight: string = '') {
        this._input = input;
        this._context = context;
        this._name = name || null;
        this._source = source;
        this._highlight = highlight;
    }

    public async getSourceCode(): Promise<string> {
        // Throw these out
        if (Flagpole.isNullOrUndefined(this._source)) {
            return '';
        }
        // Do more processing based on type
        const type: string = Flagpole.toType(this._source);
        if (['puppeteerelement', 'extjscomponent', 'domelement'].includes(type)) {
            return (await this._source.getOuterHtml()).toString();
        }
        // Fallback just toString it
        return String(this._source);
    }

    public toArray(): any[] {
        return this.isArray() ? this._input : [this._input];
    }

    public valueOf(): any {
        return this._input;
    }

    public toString(): string {
        const type: string = Flagpole.toType(this._input);
        if (this._input && this._input.value) {
            return String(this._input.value);
        }
        else if (type == 'object') {
            return String(Object.keys(this._input));
        }
        return String(this._input);
    }

    public toFloat(): number {
        return parseFloat(this.toString());
    }

    public toInteger(): number {
        return parseInt(this.toString());
    }

    public toType(): string {
        return String(Flagpole.toType(this._input));
    }

    public isNullOrUndefined(): boolean {
        return Flagpole.isNullOrUndefined(this._input);
    }

    public isUndefined(): boolean {
        return this.toType() == 'undefined';
    }

    public isNull(): boolean {
        return this._input === null;
    }

    public isPromise(): boolean {
        return this.toType() == 'promise';
    }

    public isArray(): boolean {
        return this.toType() == 'array';
    }

    public isString(): boolean {
        return this.toType() == 'string';
    }

    public isObject(): boolean {
        return this.toType() == 'object';
    }

    public isNumber(): boolean {
        return this.toType() == 'number' && this._input !== NaN;
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
        return this.toType() == 'regexp';
    }

    public isCheerioElement(): boolean {
        return this.toType() == 'cheerio';
    }

    public isPuppeteerElement(): boolean {
        return this.toType() == 'elementhandle';
    }

    public async hasProperty(key: string): Promise<Value> {
        return this._wrapAsValue(
            (
                this._input &&
                this._input.hasOwnProperty &&
                this._input.hasOwnProperty(key)
            ),
            `${this.name} has property ${key}`
        );
    }

    protected _wrapAsValue(data: any, name: string, source?: any, highlight?: string): Value {
        return new Value(data, this._context, name, source, highlight);
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
        return (thisValue && thisValue.hasOwnProperty(key));
    }

    public get length(): Value {
        const thisValue: any = this.$;
        return new Value(
            (thisValue && thisValue.length) ? thisValue.length : 0,
            this._context,
            `Length of ${this._name}`
        );
    }

}