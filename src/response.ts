import { Scenario } from "./scenario";
import { URL } from 'url';
import { Cookie } from 'request';
import { AssertionContext } from './assertioncontext';
import { Value } from './value';
import { HttpResponse } from './httpresponse';
import { iValue } from '.';

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
    isBrowser: boolean,
    init(httpResponse: HttpResponse): void
    getRoot(): any,
    find(path: string): Promise<any>
    findAll(path: string): Promise<Array<any>>
    findHavingText(selector: string, searchForText: string | RegExp): Promise<iValue | null>
    findAllHavingText(selector: string, searchForText: string | RegExp): Promise<iValue[]>
    header(key?: string): Value
    cookie(key?: string): Value
    absolutizeUri(uri: string): string
    evaluate(context: any, callback: Function): Promise<any>
    waitForNavigation(timeout: number, waitFor?: string | string[]): Promise<void>
    waitForLoad(timeout: number): Promise<void>
    waitForNetworkIdle(timeout: number): Promise<void>
    waitForReady(timeout: number): Promise<void>
    waitForHidden(selector: string, timeout: number): Promise<iValue | null>
    waitForVisible(selector: string, timeout: number): Promise<iValue | null>
    waitForExists(selector: string, timeout?: number): Promise<iValue | null>
    screenshot(opts: any): Promise<Buffer | string>
    clearValue(selector: string): Promise<any>
    typeText(selector: string, textToType: string, opts: any): Promise<any>
    selectOption(selector: string, value: string | string[]): Promise<string[]>
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

export abstract class ProtoResponse implements iResponse {

    public readonly scenario: Scenario;

    private _httpResponse: HttpResponse = HttpResponse.createEmpty();

    abstract get type(): ResponseType;
    abstract get typeName(): string;
    abstract find(path: string): Promise<any | null>;
    abstract findAll(path: string): Promise<any[]>;
    abstract evaluate(context: any, callback: Function): Promise<any>;

    /**
     * Is this a browser based test
     */
    public get isBrowser(): boolean {
        return false;
    }

    public get httpResponse(): HttpResponse {
        return this._httpResponse;
    }

    /**
     * HTTP Status Code
     */
    public get statusCode(): Value {
        return this._wrapAsValue(this.httpResponse.statusCode, 'HTTP Status Code');
    }

    /**
     * HTTP Status Message
     */
    public get statusMessage(): Value {
        return this._wrapAsValue(this.httpResponse.statusMessage, 'HTTP Status Message');
    }

    /**
     * Raw Response Body
     */
    public get body(): Value {
        return this._wrapAsValue(this.httpResponse.body, 'Raw Response Body');
    }

    /**
     * Size of the response body
     */
    public get length(): Value {
        return this._wrapAsValue(this.httpResponse.body.length, 'Length of Response Body');
    }

    /**
     * HTTP Headers
     */
    public get headers(): Value {
        return this._wrapAsValue(this.httpResponse.headers, 'HTTP Headers');
    }

    /**
     * HTTP Cookies
     */
    public get cookies(): Value {
        return this._wrapAsValue(this.httpResponse.cookies, 'HTTP Cookies');
    }

    /**
     * JSON parsed response body
     */
    public get jsonBody(): Value {
        try {
            const json = JSON.parse(this.httpResponse.body);
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

    constructor(scenario: Scenario) {
        this.scenario = scenario;
    }

    public init(httpResponse: HttpResponse) {
        this._httpResponse = httpResponse;
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
        return this.httpResponse.body;
    }

    /**
     * Return a single header by key or all headers in an object
     *
     * @param {string} key
     * @returns {Value}
     */
    public header(key: string): Value {
        // Try first as they put it in the test, then try all lowercase
        key = typeof this.httpResponse.headers[key] !== 'undefined' ? key : key.toLowerCase();
        const headerValue: any = this.httpResponse.headers[key];
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
        this.httpResponse.cookies.forEach((c: Cookie) => {
            if (c.key == key) {
                cookie = c;
            }
        });
        return this._wrapAsValue(
            cookie,
            'HTTP Cookies[' + key + ']'
        );
    }

    public async waitForNavigation(timeout: number = 10000, waitFor?: string | string[]): Promise<void> {
        return this.context.pause(1);
    }

    public async waitForLoad(timeout: number = 30000): Promise<void> {
        return this.context.pause(1);
    }

    public async waitForReady(timeout: number = 30000): Promise<void> {
        return this.context.pause(1);
    }

    public async waitForNetworkIdle(timeout: number = 30000): Promise<void> {
        return this.context.pause(1);
    }

    public async waitForHidden(selector: string, timeout: number = 30000): Promise<iValue | null> {
        return this.context.pause(1);
    }

    public async waitForVisible(selector: string, timeout: number = 30000): Promise<iValue | null> {
        return this.context.pause(1);
    }

    public async waitForExists(selector: string, timeout: number = 30000): Promise<iValue | null> {
        return this.context.pause(1);
    }

    public async screenshot(opts: any): Promise<Buffer | string> {
        throw new Error(`This scenario type (${this.typeName}) does not support screenshots.`);
    }

    public async typeText(selector: string, textToType: string, opts: any = {}): Promise<any> {
        throw new Error(`This scenario type (${this.typeName}) does not support clearValue.`);
    }

    public async clearValue(selector: string): Promise<any> {
        throw new Error(`This scenario type (${this.typeName}) does not support clearValue.`);
    }

    public async findHavingText(selector: string, searchForText: string | RegExp): Promise<iValue | null> {
        throw new Error(`This scenario type (${this.typeName}) does not support findHavingText.`);
    }

    public async findAllHavingText(selector: string, searchForText: string | RegExp): Promise<iValue[]> {
        throw new Error(`This scenario type (${this.typeName}) does not support findAllHavingText.`);
    }

    public async selectOption(selector: string, value: string | string[]): Promise<string[]> {
        throw new Error(`This scenario type (${this.typeName}) does not support selectOption.`);
    }
    
    protected _wrapAsValue(data: any, name: string, source?: any): Value {
        return new Value(data, this.context, name, source);
    }

}
