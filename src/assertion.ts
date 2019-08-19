import { AssertionContext } from './assertioncontext';
import { Value } from './value';
import { Flagpole } from '.';
import { AssertionResult } from './assertionresult';

export class Assertion {

    /**
     * Creates a new assertion with the same value and settings, just no result
     */
    public get and(): Assertion {
        const assertion: Assertion = new Assertion(
            this._context,
            this._input,
            this._message ? `&& ${this._message}` : null
        );
        this._not && assertion.not;
        this._optional && assertion.optional;
        return assertion;
    }

    /**
     * Creates a new assertion with the type of this one
     */
    public get type(): Assertion {
        const type: Value = new Value(
            Flagpole.toType(this._getCompareValue(this._input)),
            this._context,
            `Type of ${this._getSubject()}`
        );
        const assertion: Assertion = new Assertion(this._context, type, this._message);
        this._not && assertion.not;
        this._optional && assertion.optional;
        return assertion;
    }

    /**
     * Creates a new assertion with the lengh of this one
     */
    public get length(): Assertion {
        const length: number = (() => {
            const thisValue: any = this._getCompareValue(this._input);
            return thisValue && thisValue.length ?
                thisValue.length : 0;
        })();
        const assertion: Assertion = new Assertion(
            this._context,
            new Value(length, this._context, `Length of ${this._getSubject()}`),
            this._message
        );
        this._not && assertion.not;
        this._optional && assertion.optional;
        return assertion;
    }

    /**
     * Flips the expected assertion evaluation
     */
    public get not(): Assertion {
        this._not = true;
        return this;
    }

    /**
     * Marks this assertion optional if it fails
     */
    public get optional(): Assertion {
        this._optional = true;
        return this;
    }

    /**
     * Unsure of this one... but purpose is to create a new assertion based on the resolved value if input is a promise
     */
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
    private _message: string | null;
    private _not: boolean = false;
    private _optional: boolean = false;
    private _result: AssertionResult | null = null;

    public static async create(context: AssertionContext, thisValue: any, message?: string): Promise<Assertion> {
        return new Assertion(context, thisValue, message);
    }

    constructor(context: AssertionContext, thisValue: any, message?: string | null) {
        this._context = context;
        this._input = thisValue;;
        this._message = typeof message == 'undefined' ? null : message;
    }

    public exactly(value: any): Assertion {
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
        return this;
    }

    public equals(value: any): Assertion {
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
        return this;
    }

    public like(value: any): Assertion {
        const thisVal: any = String(this._getCompareValue(this._input)).toLowerCase().trim();
        const thatVal: any = String(this._getCompareValue(value)).toLowerCase().trim();
        const bool: boolean = this._eval(thisVal == thatVal);
        this._assert(
            bool,
            this._not ?
                `${this._getSubject()} is not like ${thatVal}` :
                `${this._getSubject()} is like ${thatVal}`,
            thisVal
        );
        return this;
    }

    public greaterThan(value: any): Assertion {
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
        return this;
    }

    public greaterThanOrEquals(value: any): Assertion {
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
        return this;
    }

    public lessThan(value: any): Assertion {
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
        return this;
    }

    public lessThanOrEquals(value: any): Assertion {
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
        return this;
    }

    public between(min: any, max: any): Assertion {
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
        return this;
    }

    public matches(value: any): Assertion {
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
        return this;
    }

    public contains(value: any): Assertion {
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
        return this;
    }

    public startsWith(value: any): Assertion {
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
        return this;
    }

    public endsWith(value: any): Assertion {
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
        return this;
    }

    public in(values: any[]): Assertion {
        const thisValue = this._getCompareValue(this._input);
        let bool: boolean = this._eval(values.indexOf(thisValue) >= 0);
        this._assert(
            bool,
            this._not ?
                `${this._getSubject()} is not in list: ${values.join(', ')}` :
                `${this._getSubject()} is in list: ${values.join(', ')}`,
            thisValue
        );
        return this;
    }

    public includes(value: any): Assertion {
        const thisValue = this._getCompareValue(this._input);
        const thatValue = String(this._getCompareValue(value));
        let bool: boolean = this._eval(
            thisValue && thisValue.indexOf &&
            thisValue.indexOf(thatValue) >= 0
        );
        this._assert(
            bool,
            this._not ?
                `${this._getSubject()} does not include ${thatValue}` :
                `${this._getSubject()} includes ${thatValue}`,
            thisValue
        );
        return this;
    }

    public exists(): Assertion {
        const thisValue = this._getCompareValue(this._input);
        const bool: boolean = this._eval(!Flagpole.isNullOrUndefined(thisValue));
        this._assert(
            bool, 
            this._not ?
                `${this._getSubject()} does not exist` :
                `${this._getSubject()} exists`,
            thisValue
        );
        return this;
    }

    public resolves(continueOnReject: boolean = false): Promise<Assertion> {
        const assertion: Assertion = this;
        return new Promise((resolve, reject) => {
            const result = (bool: boolean) => {
                this._assert(
                    this._eval(bool),
                    this._not ?
                        `${this._getSubject()} was not resolve` :
                        `${this._getSubject()} was resolved`,
                    bool
                );
                if (bool) {
                    resolve(assertion);
                }
                else {
                    continueOnReject ? resolve(assertion) : reject();
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
        const assertion: Assertion = this;
        return new Promise((resolve, reject) => {
            const result = (bool: boolean) => {
                this._assert(
                    this._eval(bool),
                    this._not ?
                        `${this._getSubject()} was not rejected` :
                        `${this._getSubject()} was rejected`,
                    bool
                );
                if (bool) {
                    resolve(assertion);
                }
                else {
                    continueOnReject ? resolve(assertion) : reject();
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

    public none(callback: Function): Assertion {
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
                `${this._getSubject()} none were true`,
            thisValue
        );
        return this;
    }

    public every(callback: Function): Assertion {
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
                `${this._getSubject()} all were true`,
            thisValue
        );
        return this;
    }

    public some(callback: Function): Assertion {
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
                `${this._getSubject()} some were true`,
            thisValue
        );
        return this;
    }

    public schema(schema: any): Assertion {
        const root: any = this._getCompareValue(this._input);
        let bool: boolean = true;
        let err: string | null = null;

        function matchesType(key: string, docItem: any, schemaItem: any): boolean {
            const schemaItemType = Flagpole.toType(schemaItem);
            const docItemType = Flagpole.toType(docItem);
            // If schema item is a string, then it's defining type
            if (schemaItemType == 'string') {
                if (docItemType != schemaItem) {
                    err = `typeOf ${key} was ${docItemType}, which did not match ${schemaItem}`;
                    return false;
                }
            }
            // If the type is an array, then it's an array of allowed types
            else if (schemaItemType == 'array') {
                const allowedTypes: string[] = schemaItem;
                if (allowedTypes.indexOf(docItemType) < 0) {
                    err = `typeOf ${key} was ${docItemType}, which did not match ${allowedTypes.join(' | ')}`;
                    return false;
                }
            }
            return true;
        }

        function isValid(document: any, schema: any): boolean {
            return Object.keys(schema).every((key) => {
                const schemaItem = schema[key];
                const docItem = document[key];
                const schemaItemType: string = Flagpole.toType(schemaItem);
                const docItemType: string = Flagpole.toType(docItem);
                // If document does not contain this item
                if (docItemType == 'undefined' && schemaItem) {
                    // If this as optional, skip it
                    if (schemaItem.optional) {
                        return true;
                    }
                    // Otherwise, its non-existance is a violation
                    err = `${key} was undefined`;
                    return false;
                }
                // If it's either a string or array, we're testing the type
                if (schemaItemType == 'string' || schemaItemType == 'array') {
                    if (!matchesType(key, docItem, schemaItem)) {
                        return false;
                    }
                }
                // If schema item is an object, then we do more complex parsing
                else if (schemaItemType == 'object') {
                    // type
                    if (schemaItem.type) {
                        if (!matchesType(key, docItem, schemaItem.type)) {
                            return false;
                        }
                    }
                    // enum
                    if (Flagpole.toType(schemaItem.enum) == 'array') {
                        // Value must be in this array
                        if ((schemaItem.enum as any[]).indexOf(docItem) < 0) {
                            err = `${key}'s value ${docItem} is not in enum ${schemaItem.enum.join(', ')}`
                            return false;
                        }
                    }
                    // matches
                    if (schemaItem.matches) {
                        // Value must match this regex
                        if (!(new RegExp(schemaItem.matches).test(String(docItem)))) {
                            err = `${key}'s value ${docItem} did not match ${String(schemaItem.matches)}`
                            return false;
                        }
                    }
                    // test
                    if (Flagpole.toType(schemaItem.test) == 'function') {
                        // Function must return true
                        let opts = {
                            key: key, parent: document, root: root
                        }
                        if (!schemaItem.test(docItem, opts)) {
                            err = `${key} did not pass the test`
                            return false;
                        }
                    }
                    // items
                    if (Flagpole.toType(schemaItem.items) == 'object') {
                        // If this item is an array, loop through each subItem and make sure it matches
                        if (docItemType == 'array') {
                            return (docItem as Array<any>).every((subItem) => {
                                // If it's a string, just validate the type of each item
                                if (typeof schemaItem.items == 'string') {
                                    return Flagpole.toType(subItem) == schemaItem.items;
                                }
                                // Otherwise, validate that array item against the "every" sub-schema
                                return isValid(subItem, schemaItem.items);
                            });
                        }
                        // If this item is an object, loop through each property and make sure it matches
                        else if (docItemType == 'object') {
                            return Object.keys(docItem).every((key) => {
                                // If it's a string, just validate the type of each item
                                if (typeof schemaItem.items == 'string') {
                                    return Flagpole.toType(docItem[key]) == schemaItem.items;
                                }
                                return isValid(docItem[key], schemaItem.items);
                            })
                        }
                        else {
                            err = `${key} was not an array nor an object, so can't loop through its items.`;
                            return false;
                        }
                    }
                }
                // Fallback to true, probably invalid schema item
                return true;
            });
        }

        if (Flagpole.toType(root) == 'object') {
            bool = isValid(root, schema); 
        }

        return this._assert(
            this._eval(bool),
            this._not ?
                `${this._getSubject()} does not match schema` :
                `${this._getSubject()} matches schema`,
            err
        );
    }

    private _assert(statement: boolean, defaultMessage: string, actualValue: any): Assertion {
        // Result is immutable, so only let them assert once
        if (this._result !== null) {
            throw new Error('Assertion result is immutable.');
        }
        // Assertion passes
        if (!!statement) {
            const message: string = this._message || defaultMessage;
            this._result = AssertionResult.pass(message);
        }
        // Assertion fails
        else {
            const message: string = (this._message || defaultMessage);
            const details: string = `Actual value: ${String(actualValue)}`;
            this._result = this._optional ?
                AssertionResult.failOptional(message, details) :
                AssertionResult.fail(message, details);
        }
        // Log this result
        this._context.scenario.logResult(this._result);
        return this;
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
        const type: string = Flagpole.toType(this._input);
        let name: string;
        if (this._input && this._input.name) {
            name = this._input.name;
        }
        else if (type == 'array') {
            name = 'Array';
        }
        else if (type == 'object') {
            name = 'Object';
        }
        else if (type == 'domelement') {
            name = 'DOM Element';
        }
        else if (type == 'cssrule') {
            name = 'CSS Rule';
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