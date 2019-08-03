import { AssertionContext } from './assertioncontext';
import { Value } from './value';

export class Assertion {

    private _context: AssertionContext;
    private _assertValue: Value;
    private _message: string | null;

    constructor(context: AssertionContext, thisValue: any, message?: string) {
        this._context = context;
        this._assertValue = new Value(thisValue, context);
        this._message = typeof message == 'undefined' ? null : message;
    }

    public equals(value: any): boolean {
        const thisValue = this._assertValue.get();
        const bool: boolean = thisValue == value;
        this._assert(bool, `${thisValue} equals ${value}`, value);
        return bool;
    }

    public is(type: string): boolean {
        const myType: string = this._assertValue.toType();
        const bool: boolean = (myType == type.toLocaleLowerCase());
        this._assert(bool, `Is type ${type}`, myType);
        return bool;
    }

    public greaterThan(value: number): boolean {
        const thisVal: number = this._assertValue.parseFloat().get();
        const bool: boolean = thisVal > value;
        this._assert(bool, `${thisVal} is greater than ${value}`, thisVal);
        return bool;
    }

    public greaterThanOrEquals(value: any): boolean {
        const thisVal: number = this._assertValue.parseFloat().get();
        const bool: boolean = thisVal >= value;
        this._assert(bool, `${thisVal} is greater than or equal to ${value}`, thisVal);
        return bool;
    }

    public lessThan(value: any): boolean {
        const thisVal: number = this._assertValue.parseFloat().get();
        const bool: boolean = thisVal < value;
        this._assert(bool, `${thisVal} is less than ${value}`, thisVal);
        return bool;
    }

    public lessThanOrEquals(value: any): boolean {
        const thisVal: number = this._assertValue.parseFloat().get();
        const bool: boolean = thisVal <= value;
        this._assert(bool, `${thisVal} is less than or equal to ${value}`, thisVal);
        return bool;
    }

    public between(min: number, max: number): boolean {
        const thisVal: number = this._assertValue.parseFloat().get();
        const bool: boolean = thisVal >= min && thisVal <= max;
        this._assert(bool, `${thisVal} is between ${min} and ${max}`, thisVal);
        return bool;
    }

    public matches(pattern: RegExp): boolean {
        const thisVal: string = this._assertValue.toString();
        const bool: boolean = pattern.test(thisVal);
        this._assert(bool, `Matches ${String(pattern)}`, thisVal);
        return bool;
    }

    public contains(value: any): boolean {
        let bool: boolean = false;
        const thisValue: any = this._assertValue.get();
        if (this._assertValue.isNullOrUndefined()) {
            bool = thisValue === value;
        }
        if (this._assertValue.isArray()) {
            bool = thisValue.indexOf(value) >= 0;
        }
        else if (this._assertValue.isObject()) {
            bool = this._assertValue.hasProperty(value);
        }
        else {
            bool = (this._assertValue.toString().indexOf(value) >= 0)
        }
        this._assert(bool, `Contains ${value}`, thisValue);
        return bool;
    }

    public startsWith(value: any): boolean {
        let bool: boolean = false;
        if (this._assertValue.isArray()) {
            bool = this._assertValue.get()[0] == value;
        }
        if (!this._assertValue.isNullOrUndefined()) {
            bool = this._assertValue.toString().indexOf(value) === 0
        }
        this._assert(bool, `Starts with ${value}`, this._assertValue.toString());
        return bool;
    }

    public endsWith(value: any): boolean {
        let bool: boolean = false;
        if (this._assertValue.isArray()) {
            bool = this._assertValue.get()[0] == value;
        }
        if (!this._assertValue.isNullOrUndefined()) {
            const thisVal: string = this._assertValue.toString();
            const thatVal: string = String(value);
            bool = thisVal.indexOf(value) === thisVal.length - thatVal.length
        }
        this._assert(bool, `Starts with ${value}`, this._assertValue.toString());
        return bool;
    }

    public in(values: any[]) {
        const thisVal: any = this._assertValue.get();
        let bool: boolean = values.indexOf(thisVal) >= 0;
        this._assert(bool, `Is in list:  ${values.join(', ')}`);
        return bool;
    }

    public like(value: any) {
        const thisVal: any = this._assertValue.toString().toLowerCase().trim();
        const thatVal: any = String(value).toLowerCase().trim();
        const bool: boolean = thisVal == thatVal;
        this._assert(bool, `${thisVal} is like ${thatVal}`);
        return bool;
    }

    public isTrue() {
        const thisVal: any = this._assertValue.get();
        const bool: boolean = thisVal === true;
        this._assert(bool, 'Is true');
        return bool;
    }

    public isTruthy() {
        const thisVal: any = this._assertValue.get();
        const bool: boolean = !!thisVal;
        this._assert(bool, 'Is truthy');
        return bool;
    }

    public isFalse() {
        const thisVal: any = this._assertValue.get();
        const bool: boolean = thisVal === false;
        this._assert(bool, 'Is false');
        return bool;
    }

    public isFalsy() {
        const thisVal: any = this._assertValue.get();
        const bool: boolean = !thisVal;
        this._assert(bool, 'Is falsy');
        return bool;
    }

    public resolves(continueOnReject: boolean = false): Promise<any> {
        return new Promise((resolve, reject) => {
            const result = (bool: boolean) => {
                this._assert(bool, 'Resolved');
                if (bool) {
                    resolve();
                }
                else {
                    continueOnReject ? resolve() : reject();
                }
            }
            if (this._assertValue.isPromise()) {
                this._assertValue.get()
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
                this._assert(bool, 'Rejected');
                if (bool) {
                    resolve();
                }
                else {
                    continueOnReject ? resolve() : reject();
                }
            }
            if (this._assertValue.isPromise()) {
                this._assertValue.get()
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
        if (this._assertValue.isArray()) {
            const arr: Array<any> = this._assertValue.get();
            bool = arr.every((value: any, index: number, array: any[]) => {
                return !callback(value, index, array);
            });
        }
        this._assert(bool, 'None');
        return bool;
    }

    public every(callback: Function): boolean {
        let bool: boolean = false;
        if (this._assertValue.isArray()) {
            const arr: Array<any> = this._assertValue.get();
            bool = arr.every((value: any, index: number, array: any[]) => {
                return callback(value, index, array);
            });
        }
        this._assert(bool, 'Every');
        return bool;
    }

    public some(callback: Function): boolean {
        let bool: boolean = false;
        if (this._assertValue.isArray()) {
            const arr: Array<any> = this._assertValue.get();
            bool = arr.some((value: any, index: number, array: any[]) => {
                return callback(value, index, array);
            });
        }
        this._assert(bool, 'Some');
        return bool;
    }

    private _assert(statement: boolean, defaultMessage: string, actualValue?: any) {
        this._context.scenario.assert(
            statement,
            this._message || defaultMessage,
            actualValue
        );
    }

}