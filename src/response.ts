import { Scenario } from "./scenario";
import { iResponse, SimplifiedResponse } from "./response";
import { Node } from "./node";

/**
 * Responses may be HTML or JSON, so this interface let's us know how to handle either
 */
export interface iResponse {
    select(path: string, findIn?: any): Node
    parents(selector?: string): Node
    parent(): Node 
    closest(selector: string): Node
    children(selector?: string): Node
    siblings(selector?: string): Node
    next(selector?: string): Node
    prev(selector?: string): Node
    status(): Node
    and(): Node
    loadTime(): Node
    label(message: string): iResponse
    setLastElement(path: string | null, element: Node): Node
    getLastElement(): Node
    comment(message: string): iResponse
    headers(key?: string): Node
    not(): iResponse
    startIgnoringAssertions(): iResponse
    stopIgnoringAssertions(): iResponse
    assert(statement: boolean, passMessage: string, failMessage: string): iResponse
    readonly scenario: Scenario
}

/**
 * This is named confusing, but it represents the original response we get from the http request
 */
export interface SimplifiedResponse {
    statusCode: number
    body: string
    headers: Array<any>
}


export abstract class GenericResponse implements iResponse {

    public readonly scenario: Scenario;

    protected url: string;
    protected response: SimplifiedResponse;
    protected flipAssertion: boolean = false;
    protected ignoreAssertion: boolean = false;
    protected _lastElement: Node;
    protected _lastElementPath: string | null = null;

    constructor(scenario: Scenario, url: string, response: SimplifiedResponse) {
        this.scenario = scenario;
        this.url = url;
        this.response = response;
        this._lastElement = new Node(this, 'Empty Element', null);
    }

    abstract select(path: string, findIn?: any): Node
    abstract parents(selector?: string): Node
    abstract parent(): Node
    abstract closest(selector: string): Node
    abstract children(selector: string): Node
    abstract siblings(selector: string): Node
    abstract next(selector: string): Node
    abstract prev(selector: string): Node

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
     * Set last element
     * 
     * @param path 
     * @param element 
     */
    public setLastElement(path: string | null, element: Node): Node {
        this._lastElement = element;
        this._lastElementPath = path;
        return element;
    }

    /**
     * Get or set last element
     *
     * @param {Node} property
     * @returns {Node}
     */
    public getLastElement(): Node {
        return this._lastElement || new Node(<iResponse>this, 'Empty Element', []);
    }

    /**
     * Return the real value of the last element
     *
     * @returns any
     */
    public get(): any {
        return this.getLastElement().get();
    }

    /**
     * Spit out the value of the last element
     *
     * @returns {Node}
     */
    public echo(): Node {
        return this.getLastElement().echo();
    }

    /**
     * Spit out the type of the last element
     *
     * @returns {Node}
     */
    public typeof(): Node {
        return this.getLastElement().typeof();
    }

    /**
     * Return last element
     *
     * @returns {Node}
     */
    public and(): Node {
        return this._lastElement || new Node(this, 'Empty Element', []);
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
     * @returns {Node}
     */
    public headers(key?: string): Node {
        if (typeof key !== 'undefined') {
            // Try first as they put it in the test, then try all lowercase
            key = typeof this.response.headers[key] !== 'undefined' ? key : key.toLowerCase();
            let name: string = 'HTTP Headers[' + key + ']';
            let value: Node = new Node(this, name, this.response.headers[key]);
            value.exists();
            return value;
        }
        else {
            return new Node(this, 'HTTP Headers', this.response.headers);
        }
    }

    /**
     * Get the http status
     *
     * @returns {Node}
     */
    public status(): Node {
        return new Node(this, 'HTTP Status', this.response.statusCode);
    }

    /**
     * Load time of request to response
     */
    public loadTime(): Node {
        return new Node(this, 'Load Time', this.scenario.getRequestLoadTime());
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
     * @returns {Node}
     */
    public text(): Node {
        return this.getLastElement().text();
    }

    /**
     *
     * @returns {Node}
     */
    public length(): Node {
        return this.getLastElement().length();
    }

    /**
     *
     * @param {string} string
     * @returns {iResponse}
     */
    public contains(string: string): iResponse {
        return this.getLastElement().contains(string);
    }

    /**
     *
     * @param {RegExp} pattern
     * @returns {iResponse}
     */
    public matches(pattern: RegExp): iResponse {
        return this.getLastElement().matches(pattern);
    }

    /**
     *
     * @param {string} matchText
     * @returns {iResponse}
     */
    public startsWith(matchText: string): iResponse {
        return this.getLastElement().startsWith(matchText);
    }

    /**
     *
     * @param {string} matchText
     * @returns {iResponse}
     */
    public endsWith(matchText: string): iResponse {
        return this.getLastElement().endsWith(matchText);
    }

    /**
     *
     * @returns {Node}
     */
    public trim(): Node {
        return this.getLastElement().text().trim();
    }

    /**
     *
     * @returns {Node}
     */
    public toLowerCase(): Node {
        return this.getLastElement().text().toLowerCase();
    }

    /**
     *
     * @returns {Node}
     */
    public toUpperCase(): Node {
        return this.getLastElement().text().toUpperCase();
    }

    /**
     *
     * @param {string | RegExp} search
     * @param {string} replace
     * @returns {Node}
     */
    public replace(search: string | RegExp, replace: string): Node {
        return this.getLastElement().text().replace(search, replace);
    }

    /**
     *
     * @param {string} type
     * @returns {iResponse}
     */
    public is(type: string): iResponse {
        return this.getLastElement().is(type);
    }

    /**
     *
     * @param {Function} callback
     * @returns {iResponse}
     */
    public each(callback: Function): iResponse {
        return this.getLastElement().each(callback);
    }

    /**
     *
     * @param {Function} callback
     * @returns {iResponse}
     */
    public some(callback: Function): iResponse {
        return this.getLastElement().some(callback);
    }

    /**
     *
     * @param {Function} callback
     * @returns {iResponse}
     */
    public every(callback: Function): iResponse {
        return this.getLastElement().every(callback);
    }

    /**
     *
     * @returns {iResponse}
     */
    public exists(): iResponse {
        return this.getLastElement().exists();
    }

    /**
     *
     * @returns {Node}
     */
    public parseInt(): Node {
        return this.getLastElement().text().parseInt();
    }

    /**
     *
     * @returns {Node}
     */
    public parseFloat(): Node {
        return this.getLastElement().text().parseFloat();
    }

    /**
     *
     * @param {number} 
     * @returns {iResponse}
     */
    public greaterThan(value: number): iResponse {
        return this.getLastElement().greaterThan(value);
    }

    /**
     *
     * @param {number} value
     * @returns {iResponse}
     */
    public greaterThanOrEquals(value: number): iResponse {
        return this.getLastElement().greaterThanOrEquals(value);
    }

    /**
     *
     * @param {number} value
     * @returns {iResponse}
     */
    public lessThan(value: number): iResponse {
        return this.getLastElement().lessThan(value);
    }

    /**
     *
     * @param {number} value
     * @returns {iResponse}
     */
    public lessThanOrEquals(value: number): iResponse {
        return this.getLastElement().lessThanOrEquals(value);
    }

    /**
     *
     * @param value
     * @param {boolean} permissiveMatching
     * @returns {iResponse}
     */
    public equals(value: any, permissiveMatching: boolean): iResponse {
        return this.getLastElement().equals(value, permissiveMatching);
    }

    /**
     *
     * @param value
     * @returns {iResponse}
     */
    public similarTo(value: any): iResponse {
        return this.getLastElement().similarTo(value);
    }

}
