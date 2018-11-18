import { Scenario } from "./scenario";
import { iResponse, SimplifiedResponse } from "./response";
import { Node } from "./node";

/**
 * Responses may be HTML or JSON, so this interface let's us know how to handle either
 */
export interface iResponse {
    select(path: string, findIn?: any): Node
    status(): Node
    and(): Node
    loadTime(): Node
    headers(key?: string): Node
    label(message: string): iResponse
    setLastElement(path: string | null, element: Node): Node
    getLastElement(): Node
    getLastElementPath(): string | null
    getRoot(): any
    getBody(): string
    comment(message: string): iResponse
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
    abstract getRoot(): any

    public getBody(): string {
        return this.response.body;
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
        return this._lastElement || new Node(this, 'Empty Element', []);
    }

    /**
     * Last selected/traversed path
     */
    public getLastElementPath(): string | null {
        return this._lastElementPath;
    }

    /**
     * Return last element
     *
     * @returns {Node}
     */
    public and(): Node {
        return this.getLastElement();
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

}
