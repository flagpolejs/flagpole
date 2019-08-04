import { AssertionContext } from './assertioncontext';
import { Value } from './value';
import { Flagpole } from '.';

export class Assertion {

    private _context: AssertionContext;
    private _assertValue: Value;
    private _compareValue: any;
    private _message: string | null;

    public static async create(context: AssertionContext, thisValue: any, message?: string): Promise<Assertion> {
        return new Assertion(context, thisValue, message);
    }

    constructor(context: AssertionContext, thisValue: any, message?: string) {
        this._context = context;
        this._assertValue = new Value(thisValue, context);
        this._message = typeof message == 'undefined' ? null : message;
    }

    public exactly(value: any): boolean {
        const thisValue = this._getCompareValue(this._assertValue.$);
        const thatValue = this._getCompareValue(value);
        const bool: boolean = thisValue === thatValue;
        this._assert(bool, `${this._getSubject()} is exactly ${thatValue}`, thatValue);
        return bool;
    }

    public equals(value: any): boolean {
        const thisValue = this._getCompareValue(this._assertValue.$);
        const thatValue = this._getCompareValue(value);
        const bool: boolean = thisValue == thatValue;
        this._assert(bool, `${this._getSubject()} equals ${thatValue}`, thisValue);
        return bool;
    }

    public notEquals(value: any): boolean {
        const thisValue = this._getCompareValue(this._assertValue.$);
        const thatValue = this._getCompareValue(value);
        const bool: boolean = thisValue != thatValue;
        this._assert(bool, `${this._getSubject()} does not equal ${thatValue}`, thisValue);
        return bool;
    }

    public notExactly(value: any): boolean {
        const thisValue = this._getCompareValue(this._assertValue.$);
        const thatValue = this._getCompareValue(value);
        const bool: boolean = thisValue !== thatValue;
        this._assert(bool, `${this._getSubject()} is not exactly ${thatValue}`, thisValue);
        return bool;
    }

    public isSimilarTo(value: any): boolean {
        const thisValue = String(this._getCompareValue(this._assertValue.$)).trim().toLowerCase();
        const thatValue = this._getCompareValue(value);
        const bool: boolean = thisValue == String(thatValue).trim().toLowerCase();
        this._assert(bool, `${this._getSubject()} is similar to ${thatValue}`, thisValue);
        return bool;
    }

    public is(value: any): boolean {
        const thisValue = this._getCompareValue(this._assertValue.$);
        const thisType: string = Flagpole.toType(thisValue);
        const thatValue = this._getCompareValue(value);
        const bool: boolean = (thisType == String(thatValue).toLowerCase());
        this._assert(bool, `${this._getSubject()} is type ${thatValue}`, thisType);
        return bool;
    }

    public isNot(value: any): boolean {
        const thisValue = this._getCompareValue(this._assertValue.$);
        const thisType: string = Flagpole.toType(thisValue);
        const thatValue = this._getCompareValue(value);
        const bool: boolean = (thisType != String(thatValue).toLowerCase());
        this._assert(bool, `${this._getSubject()} is not type ${thatValue}`, thisType);
        return bool;
    }

    public greaterThan(value: any): boolean {
        const thisValue = this._getCompareValue(this._assertValue.$);
        const thatValue = this._getCompareValue(value);
        const bool: boolean = parseFloat(thisValue) > parseFloat(thatValue);
        this._assert(bool, `${this._getSubject()} is greater than ${thatValue}`, thisValue);
        return bool;
    }

    public greaterThanOrEquals(value: any): boolean {
        const thisValue = this._getCompareValue(this._assertValue.$);
        const thatValue = this._getCompareValue(value);
        const bool: boolean = parseFloat(thisValue) >= parseFloat(thatValue);
        this._assert(bool, `${this._getSubject()} is greater than or equal to ${thatValue}`, thisValue);
        return bool;
    }

    public lessThan(value: any): boolean {
        const thisValue = this._getCompareValue(this._assertValue.$);
        const thatValue = this._getCompareValue(value);
        const bool: boolean = parseFloat(thisValue) < parseFloat(thatValue);
        this._assert(bool, `${this._getSubject()} is less than ${thatValue}`, thisValue);
        return bool;
    }

    public lessThanOrEquals(value: any): boolean {
        const thisValue = this._getCompareValue(this._assertValue.$);
        const thatValue = this._getCompareValue(value);
        const bool: boolean = parseFloat(thisValue) <= parseFloat(thatValue);
        this._assert(bool, `${this._getSubject()} is less than or equal to ${thatValue}`, thisValue);
        return bool;
    }

    public between(min: any, max: any): boolean {
        const thisValue = this._getCompareValue(this._assertValue.$);
        const thatMin: number = parseFloat(this._getCompareValue(min));
        const thatMax: number = parseFloat(this._getCompareValue(max));
        const bool: boolean = parseFloat(thisValue) >= thatMin && parseFloat(thisValue) <= thatMax;
        this._assert(bool, `${this._getSubject()} is between ${min} and ${max}`, thisValue);
        return bool;
    }

    public matches(value: any): boolean {
        const thisValue = this._getCompareValue(this._assertValue.$);
        const thatValue = this._getCompareValue(value);
        const pattern = Flagpole.toType(value) == 'regexp' ? thatValue : new RegExp(value);
        const bool: boolean = pattern.test(thisValue);
        this._assert(bool, `${this._getSubject()} matches ${String(pattern)}`, thisValue);
        return bool;
    }

    public contains(value: any): boolean {
        let bool: boolean = false;
        const thisValue = this._getCompareValue(this._assertValue.$);
        const thatValue = this._getCompareValue(value);
        if (this._assertValue.isNullOrUndefined()) {
            bool = thisValue === thatValue;
        }
        else if (this._assertValue.isArray()) {
            bool = thisValue.indexOf(thatValue) >= 0;
        }
        else if (this._assertValue.isObject()) {
            bool = typeof this._assertValue[thatValue] !== 'undefined';
        }
        else {
            bool = (this._assertValue.toString().indexOf(thatValue) >= 0)
        }
        this._assert(bool, `${this._getSubject()} contains ${thatValue}`, thisValue);
        return bool;
    }

    public startsWith(value: any): boolean {
        let bool: boolean = false;
        const thisValue = this._getCompareValue(this._assertValue.$);
        const thatValue = this._getCompareValue(value);
        if (Flagpole.toType(thisValue) == 'array') {
            bool = thisValue[0] == value;
        }
        if (!Flagpole.isNullOrUndefined(thisValue)) {
            bool = String(thisValue).indexOf(thatValue) === 0
        }
        this._assert(bool, `${this._getSubject()} starts with ${thatValue}`, String(thisValue));
        return bool;
    }

    public endsWith(value: any): boolean {
        let bool: boolean = false;
        const thisValue = this._getCompareValue(this._assertValue.$);
        const thatValue = this._getCompareValue(value);
        if (Flagpole.toType(thisValue) == 'array') {
            bool = thisValue[thisValue.length - 1] == thatValue;
        }
        if (!Flagpole.isNullOrUndefined(thisValue)) {
            bool = String(thisValue).substr(0, String(thisValue).length - String(thatValue).length) == thatValue;
        }
        this._assert(bool, `${this._getSubject()} ends with ${thatValue}`, this._assertValue.toString());
        return bool;
    }

    public in(values: any[]) {
        const thisValue = this._getCompareValue(this._assertValue.$);
        let bool: boolean = values.indexOf(thisValue) >= 0;
        this._assert(bool, `${this._getSubject()} is in list: ${values.join(', ')}`);
        return bool;
    }

    public like(value: any) {
        const thisVal: any = String(this._getCompareValue(this._assertValue)).toLowerCase().trim();
        const thatVal: any = String(this._compareValue(value)).toLowerCase().trim();
        const bool: boolean = thisVal == thatVal;
        this._assert(bool, `${this._getSubject()} is like ${thatVal}`, thisVal);
        return bool;
    }

    public isTrue() {
        const thisValue = this._getCompareValue(this._assertValue.$);
        const bool: boolean = thisValue === true;
        this._assert(bool, `${this._getSubject()} is true`, thisValue);
        return bool;
    }

    public isTruthy() {
        const thisValue = this._getCompareValue(this._assertValue.$);
        const bool: boolean = !!thisValue;
        this._assert(bool, `${this._getSubject()} is truthy`, thisValue);
        return bool;
    }

    public isFalse() {
        const thisValue = this._getCompareValue(this._assertValue.$);
        const bool: boolean = thisValue === false;
        this._assert(bool, `${this._getSubject()} is false`, thisValue);
        return bool;
    }

    public isFalsy() {
        const thisValue = this._getCompareValue(this._assertValue.$);
        const bool: boolean = !thisValue;
        this._assert(bool, `${this._getSubject()} is falsy`, thisValue);
        return bool;
    }

    public exists() {
        const thisValue = this._getCompareValue(this._assertValue.$);
        const bool: boolean = !Flagpole.isNullOrUndefined(thisValue);
        this._assert(bool, `${this._getSubject()} exists`, thisValue);
        return bool;
    }

    public resolves(continueOnReject: boolean = false): Promise<any> {
        return new Promise((resolve, reject) => {
            const result = (bool: boolean) => {
                this._assert(bool, `${this._getSubject()} resolved`);
                if (bool) {
                    resolve();
                }
                else {
                    continueOnReject ? resolve() : reject();
                }
            }
            if (this._assertValue.isPromise()) {
                this._assertValue.$
                    .then(() => { result(true) })
                    .catch(() => { result(false) });
            }
            else {
                result(false);
            }
        });
    }

    public rejects(continueOnReject: boolean = false): Promise<any> {
        return new Promise((resolve, reject) => {
            const result = (bool: boolean) => {
                this._assert(bool, `${this._getSubject()} rejected`);
                if (bool) {
                    resolve();
                }
                else {
                    continueOnReject ? resolve() : reject();
                }
            }
            if (this._assertValue.isPromise()) {
                this._assertValue.$
                    .then(() => { result(false) })
                    .catch(() => { result(true) });
            }
            else {
                result(false);
            }
        });
    }

    public message(message: string): Assertion {
        this._message = message;
        return this;
    }

    public typeof(): Assertion {
        this._context.scenario.comment(`Type: ${this._assertValue.toType()}`);
        return this;
    }

    public echo(): Assertion {
        this._context.scenario.comment(`Echo: ${this._assertValue.toString()}`);
        return this;
    }

    public none(callback: Function): boolean {
        let bool: boolean = false;
        const thisValue = this._getCompareValue(this._assertValue.$);
        if (Flagpole.toType(thisValue) == 'array') {
            const arr: Array<any> = thisValue;
            bool = arr.every((value: any, index: number, array: any[]) => {
                return !callback(value, index, array);
            });
        }
        this._assert(bool, `${this._getSubject()} none were true`);
        return bool;
    }

    public every(callback: Function): boolean {
        let bool: boolean = false;
        const thisValue = this._getCompareValue(this._assertValue.$);
        if (Flagpole.toType(thisValue) == 'array') {
            const arr: Array<any> = thisValue;
            bool = arr.every((value: any, index: number, array: any[]) => {
                return callback(value, index, array);
            });
        }
        this._assert(bool, `${this._getSubject()} all were true`);
        return bool;
    }

    public some(callback: Function): boolean {
        let bool: boolean = false;
        const thisValue = this._getCompareValue(this._assertValue.$);
        if (Flagpole.toType(thisValue) == 'array') {
            const arr: Array<any> = thisValue;
            bool = arr.some((value: any, index: number, array: any[]) => {
                return callback(value, index, array);
            });
        }
        this._assert(bool, `${this._getSubject()} some were true`);
        return bool;
    }

    public async resolvesTo(): Promise<any> {
        const message: string | undefined = this._message || undefined;
        const context: AssertionContext = this._context;
        const promise: Promise<any> = this._assertValue.$;
        if (!this._assertValue.isPromise()) {
            throw new Error(`${this._getSubject()} is not a promise.`)
        }
        return new Promise(async function (resolve, reject) {
            promise.then((value: any) => {
                resolve(Assertion.create(context, value, message));
            }).catch((ex) => {
                resolve(Assertion.create(context, ex, message));
            });
        });
    }

    private _assert(statement: boolean, defaultMessage: string, actualValue?: any) {
        this._context.scenario.assert(
            statement,
            this._message || defaultMessage,
            actualValue
        );
    }

    private _getCompareValue(value: any): any {
        if (Flagpole.toType(value) == 'value') {
            return value.$;
        }
        else {
            return value;
        }
    }

    private _getSubject(): string {
        const assertValue = this._assertValue.$;
        let name: string;
        if (assertValue && assertValue.getName) {
            name = assertValue.getName();
        }
        else if (assertValue && assertValue.name) {
            name = assertValue.name;
        }
        else {
            name = String(assertValue);
        }
        // If the name is too long, truncate it
        if (String(name).length > 64) {
            name = name.substr(0, 61) + '...';
        }
        // Return it
        return (Flagpole.isNullOrUndefined(name) || String(name).length == 0) ?
            'It' : String(name);
    }

}