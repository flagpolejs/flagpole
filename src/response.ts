import { Scenario } from "./scenario";
import { URL } from 'url';
import { Cookie } from 'request';
import { IncomingMessage } from 'http';
import * as puppeteer from "puppeteer-core";
import { AssertionContext } from './assertioncontext';
import { Value, iValue } from './value';
import { DOMElement } from './domelement';
import { CSSRule } from './cssrule';

/**
 * Responses may be HTML or JSON, so this interface let's us know how to handle either
 */
export interface iResponse {
    type: ResponseType,
    typeName: string,
    statusCode: Value,
    statusMessage: Value,
    body: Value,
    jsonBody: Value,
    url: Value,
    finalUrl: Value,
    length: Value,
    loadTime: Value,
    context: AssertionContext,
    headers: Value,
    cookies: Value,
    getRoot(): any,
    find(path: string): Promise<any>
    findAll(path: string): Promise<Array<any>>
    header(key?: string): Value
    cookie(key?: string): Value
    absolutizeUri(uri: string): string
    evaluate(context: any, callback: Function): Promise<any>
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
    browser,
    extjs
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

    abstract get type(): ResponseType;
    abstract get typeName(): string;
    abstract find(path: string): Promise<any | null>;
    abstract findAll(path: string): Promise<any[]>;
    abstract evaluate(context: any, callback: Function): Promise<any>;

    /**
     * HTTP Status Code
     */
    public get statusCode(): Value {
        return this._wrapAsValue(this._response.statusCode, 'HTTP Status Code');
    }

    /**
     * HTTP Status Message
     */
    public get statusMessage(): Value {
        return this._wrapAsValue(this._response.statusMessage, 'HTTP Status Message');
    }

    /**
     * Raw Response Body
     */
    public get body(): Value {
        return this._wrapAsValue(this._response.body, 'Raw Response Body');
    }

    /**
     * Size of the response body
     */
    public get length(): Value {
        return this._wrapAsValue(this._response.body.length, 'Length of Response Body');
    }

    /**
     * HTTP Headers
     */
    public get headers(): Value {
        return this._wrapAsValue(this._response.headers, 'HTTP Headers');
    }

    /**
     * HTTP Cookies
     */
    public get cookies(): Value {
        return this._wrapAsValue(this._response.cookies, 'HTTP Cookies');
    }

    /**
     * JSON parsed response body
     */
    public get jsonBody(): Value {
        try {
            const json = JSON.parse(this._response.body);
            return this._wrapAsValue(json, 'JSON Response');
        } catch (ex) {
            return this._wrapAsValue(null, 'JSON Response');
        }
    }

    /**
     * URL of the request
     */
    public get url(): Value {
        return this._wrapAsValue(this.scenario.url, 'Request URL');
    }

    /**
     * URL of the response, after all redirects
     */
    public get finalUrl(): Value {
        return this._wrapAsValue(this.scenario.finalUrl, 'Response URL (after redirects)');
    }

    /**
     * Time from request start to response complete
     */
    public get loadTime(): Value {
        return this._wrapAsValue(this.scenario.requestDuration, 'Request to Response Load Time');
    }

    public get context(): AssertionContext {
        return new AssertionContext(this.scenario, this);
    }

    constructor(scenario: Scenario, response: NormalizedResponse) {
        this.scenario = scenario;
        this._response = response;
    }

    /**
     * Take a relative URL and make it absolute, based on the requested URL
     * 
     * @param uri 
     */
    public absolutizeUri(uri: string): string {
        let baseUrl: URL = new URL(this.scenario.suite.buildUrl(this.scenario.url || ''));
        return (new URL(uri, baseUrl.href)).href;
    }

    public getRoot(): any {
        return this._response.body;
    }

    /**
     * Return a single header by key or all headers in an object
     *
     * @param {string} key
     * @returns {Value}
     */
    public header(key: string): Value {
        // Try first as they put it in the test, then try all lowercase
        key = typeof this._response.headers[key] !== 'undefined' ? key : key.toLowerCase();
        const headerValue: any = this._response.headers[key];
        return this._wrapAsValue(
            typeof headerValue == 'undefined' ? null : headerValue,
            'HTTP Headers[' + key + ']'
        );
    }

    /**
     * Return a single cookie by key or all cookies in an object
     * 
     * @param key 
     */
    public cookie(key: string): Value {
        let cookie: Cookie | null = null;
        this._response.cookies.forEach((c: Cookie) => {
            if (c.key == key) {
                cookie = c;
            }
        });
        return this._wrapAsValue(
            cookie,
            'HTTP Cookies[' + key + ']'
        );
    }

    protected _wrapAsValue(data: any, name: string): Value {
        return new Value(data, this.context, name);
    }

}
