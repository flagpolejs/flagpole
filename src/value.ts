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

    public get(): any {
        return this._input;
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

    public async hasProperty(key: string): Promise<boolean> {
        return this._input &&
            this._input.hasOwnProperty &&
            this._input.hasOwnProperty(key);
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

    public isCookie(): boolean {
        return this._input && this._input.cookieString;
    }

    public isFlagpoleNodeElement(): boolean {
        return this.toType() == 'node';
    }

    protected _isCheerioElement(): boolean {
        return this.toType() == 'cheerio';
    }

    protected _isPuppeteerElement(): boolean {
        return this.toType() == 'elementhandle';
    }

}

export class Value extends ProtoValue {

    public async getProperty(key: string): Promise<any> {
        if (!this.isNullOrUndefined() && this.hasProperty(key)) {
            const thisValue: any = this.get();
            return this._input[key];
        }
        return undefined;
    }

    public async hasProperty(key: string): Promise<boolean> {
        const thisValue: any = this.get();
        return (thisValue && thisValue.hasOwnProperty(key));
    }

    public forEach(callback: Function) {
        const thisValue: any = this.get();
        if (thisValue && thisValue.forEach) {
            return thisValue.forEach(callback);
        }
        throw new Error(`${this.name} does not have a forEach method.`);
    }

    public get length(): Value {
        const thisValue: any = this.get();
        return new Value(
            (thisValue && thisValue.length) ? thisValue.length : 0,
            this._context,
            `Length of ${this._name}`
        );
    }

}