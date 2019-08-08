import { Flagpole } from '.';
import { AssertionContext } from './assertioncontext';

export abstract class ProtoValue {

    protected _input: any;
    protected _context: AssertionContext;
    protected _name: string | null;

    public get $(): any {
        return this._input;
    }

    public get name(): string {
        return this._name || 'it';
    }

    constructor(input: any, context: AssertionContext, name?: string) {
        this._input = input;
        this._context = context;
        this._name = name || null;
    }

    public toArray(): any[] {
        return this.isArray() ? this._input : [this._input];
    }

    public toString(): string {
        return String(this._input);
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

    public isFlagpoleNodeElement(): boolean {
        return this.toType() == 'node';
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
        return this._input &&
            this._input.hasOwnProperty &&
            this._input.hasOwnProperty(key);
    }

}

export class Value extends ProtoValue {

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