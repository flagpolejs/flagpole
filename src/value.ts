import { Flagpole } from '.';
import { AssertionContext } from './assertioncontext';

export abstract class ProtoValue {

    protected _input: any;
    protected _context: AssertionContext;

    constructor(input: any, context: AssertionContext) {
        this._input = input;
        this._context = context;
    }

    public get(): any {
        return this._input;
    }

    public toString(): string {
        return String(this._input);
    }

    public toType(): string {
        return Flagpole.toType(this._input);
    }

    public isNullOrUndefined(): boolean {
        return Flagpole.isNullOrUndefined(this._input);
    }

    public isCheerioElement(): boolean {
        return this.toType() == 'cheerio';
    }

    public isPuppeteerElement(): boolean {
        return this.toType() == 'elementhandle';
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

    protected isCookie(): boolean {
        return this._input && this._input.cookieString;
    }

    public hasProperty(key: string): boolean {
        return this._input &&
            this._input.hasOwnProperty &&
            this._input.hasOwnProperty(key);
    }

}

export class Value extends ProtoValue {

    public trim(): Value {
        this._input = String(this._input).trim();
        return this;
    }

    public length(): Value {
        this._input = this._input && this._input.length ?
            this._input.length : 0;
        return this;
    }

    public parseInt(): Value {
        this._input = parseInt(String(this._input));
        return this;
    }

    public parseFloat(): Value {
        this._input = parseFloat(String(this._input));
        return this;
    }

}