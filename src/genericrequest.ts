import { iResponse, SimplifiedResponse } from "./index";
import { Scenario } from "./scenario";
import { Element, Value, iProperty } from "./property";

export abstract class GenericRequest  implements iResponse, iProperty {

    public readonly scenario: Scenario;

    protected url: string;
    protected response: SimplifiedResponse;
    protected flipAssertion: boolean = false;
    protected ignoreAssertion: boolean = false;
    private _lastElement: Element;

    constructor(scenario: Scenario, url: string, response: SimplifiedResponse) {
        this.scenario = scenario;
        this.url = url;
        this.response = response;
        this._lastElement = new Element(this, 'Empty Element', []);
    }

    /**
     * Assert something is true, with respect to the flipped not()
     * Also respect ignore assertions flag
     *
     * @param {boolean} statement
     * @param passMessage
     * @param failMessage
     * @returns {iResponse}
     */
    public assert(statement: boolean, passMessage, failMessage): iResponse {
        if (!this.ignoreAssertion) {
            (this.flipAssertion ? !statement : !!statement) ?
                this.scenario.pass(this.flipAssertion ? 'NOT: ' + passMessage : passMessage) :
                this.scenario.fail(this.flipAssertion ? 'NOT: ' + failMessage : failMessage);
            return this.reset();
        }
        return this;
    }

    /**
     * Clear out any previous settings
     *
     * @returns {iResponse}
     */
    protected reset(): iResponse {
        this.flipAssertion = false;
        return this;
    }

    /**
     * Just skip any assertions until further notice
     *
     * @returns {iResponse}
     */
    public startIgnoringAssertions(): iResponse {
        this.ignoreAssertion = true;
        return this;
    }

    /**
     * Okay pay attention to assertions again
     *
     * @returns {iResponse}
     */
    public stopIgnoringAssertions(): iResponse {
        this.ignoreAssertion = false;
        return this;
    }

    /**
     * Flip the next assertion
     *
     * @returns {iResponse}
     */
    public not(): iResponse {
        this.flipAssertion = true;
        return this;
    }

    /**
     * Get or set last element
     *
     * @param {Element} property
     * @returns {Element}
     */
    public lastElement(property?: Element): Element {
        if (typeof property == 'undefined') {
            return this._lastElement || new Element(this, 'Empty Element', []);
        }
        else {
            this._lastElement = property;
            return property;
        }
    }

    /**
     * Return the real value of the last element
     *
     * @returns any
     */
    public get(): any {
        return this.lastElement().get();
    }

    /**
     * Spit out the value of the last element
     *
     * @returns {iProperty}
     */
    public echo(): iProperty {
        return this.lastElement().echo();
    }

    /**
     * Spit out the type of the last element
     *
     * @returns {iProperty}
     */
    public typeof(): iProperty {
        return this.lastElement().typeof();
    }

    /**
     * Return last element
     *
     * @returns {Element}
     */
    public and(): Element {
        return this._lastElement || new Element(this, 'Empty Element', []);
    }

    /**
     * Add a console comment
     *
     * @param {string} message
     * @returns {iResponse}
     */
    public comment(message: string): iResponse {
        this.scenario.comment(message);
        return this;
    }

    /**
     * Return a single header by key or all headers in an object
     *
     * @param {string} key
     * @returns {Value}
     */
    public headers(key?: string): Value  {
        if (typeof key !== 'undefined') {
            // Try first as they put it in the test, then try all lowercase
            key = typeof this.response.headers[key] !== 'undefined' ? key : key.toLowerCase();
            let name: string = 'HTTP Headers[' + key + ']';
            let value: Value = new Value(this, name, this.response.headers[key]);
            value.exists();
            return value;
        }
        else {
            return new Value(this, 'HTTP Headers', this.response.headers);
        }
    }

    /**
     * Get the http status
     *
     * @returns {Value}
     */
    public status(): Value {
        return new Value(this, 'HTTP Status', this.response.statusCode);
    }

    /**
     * Set human readable label to override normal assertion message for next test
     *
     * @param {string} message
     * @returns {iResponse}
     */
    public label(message: string): iResponse {
        this.scenario.label(message);
        return this;
    }

    /**
     *
     * @returns {Value}
     */
    public text(): Value {
        return this.lastElement().text();
    }

    /**
     *
     * @returns {Value}
     */
    public length(): Value {
        return this.lastElement().length();
    }

    /**
     *
     * @param {string} string
     * @returns {iResponse}
     */
    public contains(string: string): iResponse {
        return this.lastElement().contains(string);
    }

    /**
     *
     * @param {RegExp} pattern
     * @returns {iResponse}
     */
    public matches(pattern: RegExp): iResponse {
        return this.lastElement().matches(pattern);
    }

    /**
     *
     * @param {string} matchText
     * @returns {iResponse}
     */
    public startsWith(matchText: string): iResponse {
        return this.lastElement().startsWith(matchText);
    }

    /**
     *
     * @param {string} matchText
     * @returns {iResponse}
     */
    public endsWith(matchText: string): iResponse {
        return this.lastElement().endsWith(matchText);
    }

    /**
     *
     * @returns {Value}
     */
    public trim(): Value {
        return this.lastElement().trim();
    }

    /**
     *
     * @returns {Value}
     */
    public toLowerCase(): Value {
        return this.lastElement().toLowerCase();
    }

    /**
     *
     * @returns {Value}
     */
    public toUpperCase(): Value {
        return this.lastElement().toUpperCase();
    }

    /**
     *
     * @param {string | RegExp} search
     * @param {string} replace
     * @returns {Value}
     */
    public replace(search: string|RegExp, replace: string): Value {
        return this.lastElement().replace(search, replace);
    }

    /**
     *
     * @param {string} type
     * @returns {iResponse}
     */
    public is(type: string): iResponse {
        return this.lastElement().is(type);
    }

    /**
     *
     * @param {Function} callback
     * @returns {iResponse}
     */
    public each(callback: Function): iResponse {
        return this.lastElement().each(callback);
    }

    /**
     *
     * @param {Function} callback
     * @returns {iResponse}
     */
    public some(callback: Function): iResponse {
        return this.lastElement().some(callback);
    }

    /**
     *
     * @param {Function} callback
     * @returns {iResponse}
     */
    public every(callback: Function): iResponse {
        return this.lastElement().every(callback);
    }

    /**
     *
     * @returns {iResponse}
     */
    public exists(): iResponse {
        return this.lastElement().exists();
    }

    /**
     *
     * @returns {Value}
     */
    public parseInt(): Value {
        return this.lastElement().parseInt();
    }

    /**
     *
     * @returns {Value}
     */
    public parseFloat(): Value {
        return this.lastElement().parseFloat();
    }

    /**
     *
     * @param {number} value
     * @returns {iResponse}
     */
    public greaterThan(value: number): iResponse {
        return this.lastElement().greaterThan(value);
    }

    /**
     *
     * @param {number} value
     * @returns {iResponse}
     */
    public greaterThanOrEquals(value: number): iResponse {
        return this.lastElement().greaterThanOrEquals(value);
    }

    /**
     *
     * @param {number} value
     * @returns {iResponse}
     */
    public lessThan(value: number): iResponse {
        return this.lastElement().lessThan(value);
    }

    /**
     *
     * @param {number} value
     * @returns {iResponse}
     */
    public lessThanOrEquals(value: number): iResponse {
        return this.lastElement().lessThanOrEquals(value);
    }

    /**
     *
     * @param value
     * @param {boolean} permissiveMatching
     * @returns {iResponse}
     */
    public equals(value: any, permissiveMatching: boolean): iResponse {
        return this.lastElement().equals(value, permissiveMatching);
    }

    /**
     *
     * @param value
     * @returns {iResponse}
     */
    public similarTo(value: any): iResponse {
        return this.lastElement().similarTo(value);
    }

    /**
     *
     * @param {string} path
     * @param findIn
     * @returns {Element}
     */
    abstract select(path: string, findIn?: any): Element

}
