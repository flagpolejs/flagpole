import { Scenario } from "./scenario";
import { Suite } from "./suite";
import { Node } from "./node";
import { URL } from 'url';
import { Cookie } from 'request';
import { IncomingMessage } from 'http';
import * as puppeteer from "puppeteer-core";
import { Browser } from './browser';
import { Page } from 'puppeteer-core';

export interface iAssertionContext {
    response: iResponse,
    scenario: Scenario,
    suite: Suite,
    browser: null | boolean | Browser,
    page: null | boolean | Page
}


/**
 * Responses may be HTML or JSON, so this interface let's us know how to handle either
 */
export interface iResponse {
    typeName: string,
    getType(): ResponseType
    select(path: string, findIn?: any): Node
    asyncSelect(path: string, findIn?: any): Promise<Node>
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
    video,
    audio,
    resource,
    browser
}

export class NormalizedResponse {

    public body: string = '';
    public statusCode: number = 0;
    public statusMessage: string = '';
    public headers: { [key: string]: string } = {};
    public cookies: Cookie[] = []

    private constructor() { }

    static fromRequest(response: IncomingMessage, body: string, cookies: Cookie[]): NormalizedResponse {
        const r = new NormalizedResponse();
        r.statusCode = response.statusCode || 0;
        r.statusMessage = response.statusMessage || '';
        r.headers = <{ [key: string]: string }>response.headers;
        r.body = body;
        r.cookies = cookies;
        return r;
    }

    static fromPuppeteer(response: puppeteer.Response, body: string, cookies: Cookie[]): NormalizedResponse {
        const r = new NormalizedResponse();
        r.statusCode = response.status();
        r.statusMessage = response.statusText();
        r.headers = response.headers();
        r.body = body;
        r.cookies = cookies;
        //r.url = response.url();
        return r;
    }

    static fromProbeImage(response: any, cookies: Cookie[]): NormalizedResponse {
        const r = new NormalizedResponse();
        r.headers = {
            'content-type': response.mime
        };
        r.body = JSON.stringify(response);
        return r;
    }

    static fromLocalFile(relativePath: string): Promise<NormalizedResponse> {
        const r = new NormalizedResponse();
        let fs = require('fs');
        let path: string = __dirname + '/' + relativePath;
        return new Promise((resolve, reject) => {
            fs.readFile(path, function (err, data) {
                if (err) {
                    return reject(err);
                }
                r.body = data.toString();
                //r.url = path;
                resolve(r);
            });
        });
    }

}

export abstract class GenericResponse implements iResponse {

    public readonly scenario: Scenario;

    private _response: NormalizedResponse;
    private _lastElement: Node;
    private _lastElementPath: string | null = null;

    abstract getType(): ResponseType;
    abstract get typeName(): string;
    abstract select(path: string, findIn?: any): Node;

    constructor(scenario: Scenario, response: NormalizedResponse) {
        this.scenario = scenario;
        this._response = response;
        this._lastElement = new Node(this, 'Empty Element', null);
    }

    public async asyncSelect(path: string, findIn?: any): Promise<Node> {
        return this.select(path, findIn);
    }

    public absolutizeUri(uri: string): string {
        let baseUrl: URL = new URL(this.scenario.suite.buildUrl(this.scenario.getUrl() || ''));
        return (new URL(uri, baseUrl.href)).href;
    }

    public getUrl(): string {
        return this.scenario.getUrl() || '';
    }

    public body(): Node {
        return new Node(this, 'Response Body', this._response.body);
    }

    public getBody(): string {
        return this._response.body;
    }

    public getRoot(): any {
        return this._response.body;
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
            key = typeof this._response.headers[key] !== 'undefined' ? key : key.toLowerCase();
            let name: string = 'HTTP Headers[' + key + ']';
            let value: Node = new Node(this, name, this._response.headers[key]);
            value.exists();
            return value;
        }
        else {
            return new Node(this, 'HTTP Headers', this._response.headers);
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
            this._response.cookies.forEach((c: Cookie) => {
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
            return new Node(this, 'HTTP Cookies', this._response.cookies);
        }
    }

    /**
     * Get the http status
     *
     * @returns {Node}
     */
    public status(): Node {
        return new Node(this, 'HTTP Status', this._response.statusCode);
    }

    /**
     * Length of the response body
     */
    public length(): Node {
        return new Node(this, 'Length of Response Body', this._response.body.length);
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
