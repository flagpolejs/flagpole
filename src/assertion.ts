import { AssertionContext } from './assertioncontext';
import { Value } from './value';
import { Flagpole } from '.';

export class Assertion {

    public get not(): Assertion {
        this._not = true;
        return this;
    }

    public get resolvesTo(): Promise<any> {
        if (Flagpole.toType(this._input) != 'promise') {
            throw new Error(`${this._getSubject()} is not a promise.`)
        }
        const message: string | undefined = this._message || undefined;
        const context: AssertionContext = this._context;
        const promise: Promise<any> = this._input;
        return new Promise(async function (resolve, reject) {
            promise.then((value: any) => {
                resolve(Assertion.create(context, value, message));
            }).catch((ex) => {
                resolve(Assertion.create(context, ex, message));
            });
        });
    }

    private _context: AssertionContext;
    private _input: any;
    private _compareValue: any;
    private _message: string | null;
    private _not: boolean = false;

    public static async create(context: AssertionContext, thisValue: any, message?: string): Promise<Assertion> {
        return new Assertion(context, thisValue, message);
    }

    constructor(context: AssertionContext, thisValue: any, message?: string) {
        this._context = context;
        this._input = thisValue;;
        this._message = typeof message == 'undefined' ? null : message;
    }

    public exactly(value: any): boolean {
        const thisValue = this._getCompareValue(this._input);
        const thatValue = this._getCompareValue(value);
        const bool: boolean = this._eval(thisValue === thatValue);
        this._assert(
            bool,
            this._not ?
                `${this._getSubject()} is not exactly ${thatValue}` :
                `${this._getSubject()} is exactly ${thatValue}`,
            thatValue
        );
        return bool;
    }

    public equals(value: any): boolean {
        const thisValue = this._getCompareValue(this._input);
        const thatValue = this._getCompareValue(value);
        const bool: boolean = this._eval(thisValue == thatValue);
        this._assert(
            bool,
            this._not ?
                `${this._getSubject()} does not equal ${thatValue}` :
                `${this._getSubject()} equals ${thatValue}`,
            thisValue
        );
        return bool;
    }

    public isSimilarTo(value: any): boolean {
        const thisValue = String(this._getCompareValue(this._input)).trim().toLowerCase();
        const thatValue = this._getCompareValue(value);
        const strThatValue: string = String(thatValue).trim().toLowerCase();
        const bool: boolean = this._eval(thisValue == strThatValue);
        this._assert(
            bool,
            this._not ?
                `${this._getSubject()} is not similar to ${thatValue}` :
                `${this._getSubject()} is similar to ${thatValue}`,
            thisValue
        );
        return bool;
    }

    public is(value: any): boolean {
        const thisValue = this._getCompareValue(this._input);
        const thisType: string = Flagpole.toType(thisValue);
        const thatValue = String(this._getCompareValue(value)).toLowerCase();
        const bool: boolean = this._eval(thisType == thatValue);
        this._assert(
            bool,
            this._not ? 
                `${this._getSubject()} is not type ${thatValue}` :
                `${this._getSubject()} is type ${thatValue}`,
            thisType
        );
        return bool;
    }

    public greaterThan(value: any): boolean {
        const thisValue = this._getCompareValue(this._input);
        const thatValue = this._getCompareValue(value);
        const bool: boolean = this._eval(parseFloat(thisValue) > parseFloat(thatValue));
        this._assert(
            bool,
            this._not ?
                `${this._getSubject()} is not greater than ${thatValue}` :
                `${this._getSubject()} is greater than ${thatValue}`,
            thisValue
        );
        return bool;
    }

    public greaterThanOrEquals(value: any): boolean {
        const thisValue = this._getCompareValue(this._input);
        const thatValue = this._getCompareValue(value);
        const bool: boolean = this._eval(parseFloat(thisValue) >= parseFloat(thatValue));
        this._assert(
            bool,
            this._not ?
                `${this._getSubject()} is not greater than or equal to ${thatValue}` :
                `${this._getSubject()} is greater than or equal to ${thatValue}`,
            thisValue
        );
        return bool;
    }

    public lessThan(value: any): boolean {
        const thisValue = this._getCompareValue(this._input);
        const thatValue = this._getCompareValue(value);
        const bool: boolean = this._eval(parseFloat(thisValue) < parseFloat(thatValue));
        this._assert(
            bool,
            this._not ?
                `${this._getSubject()} is not less than ${thatValue}` :
                `${this._getSubject()} is less than ${thatValue}`,
            thisValue
        );
        return bool;
    }

    public lessThanOrEquals(value: any): boolean {
        const thisValue = this._getCompareValue(this._input);
        const thatValue = this._getCompareValue(value);
        const bool: boolean = this._eval(parseFloat(thisValue) <= parseFloat(thatValue));
        this._assert(
            bool,
            this._not ?
                `${this._getSubject()} is not less than or equal to ${thatValue}` :
                `${this._getSubject()} is less than or equal to ${thatValue}`,
            thisValue
        );
        return bool;
    }

    public between(min: any, max: any): boolean {
        const thisValue = this._getCompareValue(this._input);
        const thatMin: number = parseFloat(this._getCompareValue(min));
        const thatMax: number = parseFloat(this._getCompareValue(max));
        const bool: boolean = this._eval(
            parseFloat(thisValue) >= thatMin &&
            parseFloat(thisValue) <= thatMax
        );
        this._assert(
            bool,
            this._not ?
                `${this._getSubject()} is not between ${min} and ${max}` :
                `${this._getSubject()} is between ${min} and ${max}`,
            thisValue
        );
        return bool;
    }

    public matches(value: any): boolean {
        const thisValue = this._getCompareValue(this._input);
        const thatValue = this._getCompareValue(value);
        const pattern = Flagpole.toType(value) == 'regexp' ? thatValue : new RegExp(value);
        const bool: boolean = this._eval(pattern.test(thisValue));
        this._assert(
            bool,
            this._not ?
                `${this._getSubject()} does not match ${String(pattern)}` :
                `${this._getSubject()} matches ${String(pattern)}`,
            thisValue
        );
        return bool;
    }

    public contains(value: any): boolean {
        let bool: boolean = false;
        const thisValue = this._getCompareValue(this._input);
        const thatValue = this._getCompareValue(value);
        if (Flagpole.isNullOrUndefined(this._input)) {
            bool = this._eval(thisValue === thatValue);
        }
        else if (Flagpole.toType(this._input) == 'array') {
            bool = this._eval(thisValue.indexOf(thatValue) >= 0);
        }
        else if (Flagpole.toType(this._input) == 'object') {
            bool = this._eval(typeof this._input[thatValue] !== 'undefined');
        }
        else {
            bool = this._eval(String(this._input).indexOf(thatValue) >= 0);
        }
        this._assert(
            bool,
            this._not ?
                `${this._getSubject()} does not contain ${thatValue}` :
                `${this._getSubject()} contains ${thatValue}`,
            thisValue);
        return bool;
    }

    public startsWith(value: any): boolean {
        let bool: boolean = false;
        const thisValue = this._getCompareValue(this._input);
        const thatValue = this._getCompareValue(value);
        if (Flagpole.toType(thisValue) == 'array') {
            bool = this._eval(thisValue[0] == value);
        }
        if (!Flagpole.isNullOrUndefined(thisValue)) {
            bool = this._eval(String(thisValue).indexOf(thatValue) === 0);
        }
        this._assert(
            bool,
            this._not ?
                `${this._getSubject()} does not start with ${thatValue}` :
                `${this._getSubject()} starts with ${thatValue}`,
            String(thisValue)
        );
        return bool;
    }

    public endsWith(value: any): boolean {
        let bool: boolean = false;
        const thisValue = this._getCompareValue(this._input);
        const thatValue = this._getCompareValue(value);
        if (Flagpole.toType(thisValue) == 'array') {
            bool = this._eval(thisValue[thisValue.length - 1] == thatValue);
        }
        if (!Flagpole.isNullOrUndefined(thisValue)) {
            bool = this._eval(
                String(thisValue).substr(0, String(thisValue).length - String(thatValue).length) == thatValue
            );
        }
        this._assert(
            bool,
            this._not ?
                `${this._getSubject()} does not end with ${thatValue}` :
                `${this._getSubject()} ends with ${thatValue}`,
            String(this._input)
        );
        return bool;
    }

    public in(values: any[]) {
        const thisValue = this._getCompareValue(this._input);
        let bool: boolean = this._eval(values.indexOf(thisValue) >= 0);
        this._assert(
            bool,
            this._not ?
                `${this._getSubject()} is not in list: ${values.join(', ')}` :
                `${this._getSubject()} is in list: ${values.join(', ')}`,
            thisValue
        );
        return bool;
    }

    public like(value: any) {
        const thisVal: any = String(this._getCompareValue(this._input)).toLowerCase().trim();
        const thatVal: any = String(this._compareValue(value)).toLowerCase().trim();
        const bool: boolean = this._eval(thisVal == thatVal);
        this._assert(
            bool,
            this._not ?
                `${this._getSubject()} is not like ${thatVal}` :
                `${this._getSubject()} is like ${thatVal}`,
            thisVal
        );
        return bool;
    }

    public isTrue() {
        const thisValue = this._getCompareValue(this._input);
        const bool: boolean = this._eval(thisValue === true);
        this._assert(
            bool,
            this._not ?
                `${this._getSubject()} is not true` :
                `${this._getSubject()} is true`,
            thisValue
        );
        return bool;
    }

    public isTruthy() {
        const thisValue = this._getCompareValue(this._input);
        const bool: boolean = this._eval(!!thisValue);
        this._assert(
            bool,
            this._not ?
                `${this._getSubject()} is not truthy` :
                `${this._getSubject()} is truthy`,
            thisValue
        );
        return bool;
    }

    public isFalse() {
        const thisValue = this._getCompareValue(this._input);
        const bool: boolean = this._eval(thisValue === false);
        this._assert(
            bool, 
            this._not ?
                `${this._getSubject()} is not false` :
                `${this._getSubject()} is false`,
            thisValue
        );
        return bool;
    }

    public isFalsey = this.isFalsy;
    public isFalsy() {
        const thisValue = this._getCompareValue(this._input);
        const bool: boolean = this._eval(!thisValue);
        this._assert(
            bool,
            this._not ?
                `${this._getSubject()} is not falsy` :
                `${this._getSubject()} is falsy`,
            thisValue
        );
        return bool;
    }

    public exists() {
        const thisValue = this._getCompareValue(this._input);
        const bool: boolean = this._eval(!Flagpole.isNullOrUndefined(thisValue));
        this._assert(
            bool, 
            this._not ?
                `${this._getSubject()} does not exist` :
                `${this._getSubject()} exists`,
            thisValue
        );
        return bool;
    }

    public resolves(continueOnReject: boolean = false): Promise<any> {
        return new Promise((resolve, reject) => {
            const result = (bool: boolean) => {
                this._assert(
                    this._eval(bool),
                    this._not ?
                        `${this._getSubject()} was not resolve` :
                        `${this._getSubject()} was resolved`
                );
                if (bool) {
                    resolve();
                }
                else {
                    continueOnReject ? resolve() : reject();
                }
            }
            if (Flagpole.toType(this._input) == 'promise') {
                this._input
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
                this._assert(
                    this._eval(bool),
                    this._not ?
                        `${this._getSubject()} was not rejected` :
                        `${this._getSubject()} was rejected`
                );
                if (bool) {
                    resolve();
                }
                else {
                    continueOnReject ? resolve() : reject();
                }
            }
            if (Flagpole.toType(this._input) == 'promise') {
                this._input
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

    public none(callback: Function): boolean {
        let bool: boolean = false;
        const thisValue = this._getCompareValue(this._input);
        if (Flagpole.toType(thisValue) == 'array') {
            const arr: Array<any> = thisValue;
            bool = arr.every((value: any, index: number, array: any[]) => {
                return !callback(value, index, array);
            });
        }
        this._assert(
            this._eval(bool),
            this._not ?
                `${this._getSubject()} some were true` :
                `${this._getSubject()} none were true`
        );
        return bool;
    }

    public every(callback: Function): boolean {
        let bool: boolean = false;
        const thisValue = this._getCompareValue(this._input);
        if (Flagpole.toType(thisValue) == 'array') {
            const arr: Array<any> = thisValue;
            bool = arr.every((value: any, index: number, array: any[]) => {
                return callback(value, index, array);
            });
        }
        this._assert(
            this._eval(bool),
            this._not ?
                `${this._getSubject()} not all were true` :
                `${this._getSubject()} all were true`
        );
        return bool;
    }

    public some(callback: Function): boolean {
        let bool: boolean = false;
        const thisValue = this._getCompareValue(this._input);
        if (Flagpole.toType(thisValue) == 'array') {
            const arr: Array<any> = thisValue;
            bool = arr.some((value: any, index: number, array: any[]) => {
                return callback(value, index, array);
            });
        }
        this._assert(
            this._eval(bool),
            this._not ?
                `${this._getSubject()} none were true` :
                `${this._getSubject()} some were true`
        );
        return bool;
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
        let name: string;
        if (this._input && this._input.getName) {
            name = this._input.getName();
        }
        else if (this._input && this._input.name) {
            name = this._input.name;
        }
        else {
            name = String(this._input);
        }
        // If the name is too long, truncate it
        if (String(name).length > 64) {
            name = name.substr(0, 61) + '...';
        }
        // Return it
        return (Flagpole.isNullOrUndefined(name) || String(name).length == 0) ?
            'It' : String(name);
    }

    private _eval(bool: boolean): boolean {
        this._not && (bool = !bool);
        return bool;
    }

}