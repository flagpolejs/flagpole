import { Scenario } from "./scenario";
import { iResponse, SimplifiedResponse } from "./response";
import { Node } from "./node";
import { URL } from 'url';
import { Cookie } from 'request';

/**
 * Responses may be HTML or JSON, so this interface let's us know how to handle either
 */
export interface iResponse {
    getType(): ResponseType
    select(path: string, findIn?: any): Node
    status(): Node
    and(): Node
    loadTime(): Node
    headers(key?: string): Node
    cookies(key?: string): Node
    label(message: string): iResponse
    setLastElement(path: string | null, element: Node): Node
    getLastElement(): Node
    getLastElementPath(): string | null
    getRoot(): any
    getBody(): string
    getUrl(): string
    comment(message: string): iResponse
    not(): iResponse
    optional(): iResponse
    ignore(assertions?: boolean | Function): iResponse
    assert(statement: boolean, message: string, actualValue?: string): iResponse
    absolutizeUri(uri: string): string
    readonly scenario: Scenario
}

export enum ResponseType {
    html,
    json,
    image,
    stylesheet,
    script,
    resource
}

/**
 * This is named confusing, but it represents the original response we get from the http request
 */
export interface SimplifiedResponse {
    statusCode: number
    body: string
    headers: { [key: string]: string },
    cookies: Cookie[]
}

export abstract class GenericResponse implements iResponse {

    public readonly scenario: Scenario;

    private _url: string;
    private _statusCode: number;
    private _body: string;
    private _headers: {};
    private _cookies: Cookie[] = [];

    private _lastElement: Node;
    private _lastElementPath: string | null = null;

    abstract getType(): ResponseType;
    abstract select(path: string, findIn?: any): Node;

    constructor(scenario: Scenario, url: string, simplifiedResponse: SimplifiedResponse) {
        this.scenario = scenario;
        this._url = url;
        this._statusCode = simplifiedResponse.statusCode;
        this._body = simplifiedResponse.body;
        this._headers = simplifiedResponse.headers;
        this._cookies = simplifiedResponse.cookies;
        this._lastElement = new Node(this, 'Empty Element', null);
    }

    public absolutizeUri(uri: string): string {
        let baseUrl: URL = new URL(this.scenario.suite.buildUrl(this.scenario.getUrl() || ''));
        return (new URL(uri, baseUrl.href)).href;
    }

    public getUrl(): string {
        return this._url;
    }

    public body(): Node {
        return new Node(this, 'Response Body', this._body);
    }

    public getBody(): string {
        return this._body;
    }

    public getRoot(): any {
        return this._body;
    }

    public assert(statement: boolean, message: string, actualValue?: string): iResponse {
        this.scenario.assert(statement, message, actualValue);
        return this;
    }

    public not(): iResponse {
        this.scenario.not();
        return this;
    }

    public optional(): iResponse {
        this.scenario.optional();
        return this;
    }

    public ignore(assertions: boolean | Function = true): iResponse {
        this.scenario.ignore(assertions);
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
            key = typeof this._headers[key] !== 'undefined' ? key : key.toLowerCase();
            let name: string = 'HTTP Headers[' + key + ']';
            let value: Node = new Node(this, name, this._headers[key]);
            value.exists();
            return value;
        }
        else {
            return new Node(this, 'HTTP Headers', this._headers);
        }
    }

    /**
     * Return a single cookie by key or all cookies in an object
     * 
     * @param key 
     */
    public cookies(key?: string): Node {
        if (typeof key !== 'undefined') {
            let cookie: Cookie | null = null;
            this._cookies.forEach((c: Cookie) => {
                if (c.key == key) {
                    cookie = c;
                }
            });
            let name: string = 'HTTP Cookies[' + key + ']';
            let value: Node = new Node(this, name, cookie);
            value.exists();
            return value;
        }
        else {
            return new Node(this, 'HTTP Cookies', this._cookies);
        }
    }

    /**
     * Get the http status
     *
     * @returns {Node}
     */
    public status(): Node {
        return new Node(this, 'HTTP Status', this._statusCode);
    }

    /**
     * Length of the response body
     */
    public length(): Node {
        return new Node(this, 'Length of Response Body', this._body.length);
    }

    /**
     * Load time of request to response
     */
    public loadTime(): Node {
        return new Node(this, 'Load Time', this.scenario.getRequestLoadTime());
    }

    /**
     * Get URL of the current page
     */
    public url(): Node {
        return new Node(this, 'URL', this.getUrl());
    }

    /**
     * Get the path of the current page
     */
    public path(): Node {
        return new Node(this, 'Path', new URL(this.getUrl()).pathname);
    }

}
