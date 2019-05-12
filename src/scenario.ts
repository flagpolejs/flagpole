import { Flagpole } from "./index";
import { Suite } from "./suite";
import { iLogLine, SubheadingLine, CommentLine, PassLine, FailLine, ConsoleColor } from "./consoleline";
import { JsonResponse } from "./jsonresponse";
import { HtmlResponse } from "./htmlresponse";
import { ResponseType, SimplifiedResponse, iResponse } from "./response";
import { ImageResponse } from "./imageresponse";
import { ResourceResponse } from "./resourceresponse";
import { ScriptResponse } from "./scriptresponse";
import { CssResponse } from "./cssresponse";
import { Mock } from "./mock";
import * as puppeteer from "puppeteer-core";
import { Browser, BrowserOptions } from "./browser";
import * as Promise from "bluebird";
import * as r from "request";
import { BrowserResponse } from './browserresponse';

const request = require('request');

/**
 * A scenario contains tests that run against one request
 */
export class Scenario {

    public readonly suite: Suite;

    protected title: string;
    protected log: Array<iLogLine> = [];
    protected failures: Array<string> = [];
    protected passes: Array<string> = [];
    protected onDone: Function;
    protected initialized: number | null = null;
    protected start: number | null = null;
    protected end: number | null = null;
    protected requestStart: number | null = null;
    protected requestLoaded: number | null = null;
    protected responseType: ResponseType = ResponseType.html;
    protected url: string | null = null;
    protected waitToExecute: boolean = false;
    protected nextLabel: string | null = null;
    protected flipAssertion: boolean = false;
    protected optionalAssertion: boolean = false;
    protected ignoreAssertion: boolean = false;
    protected cookieJar: r.CookieJar;
    protected options: any = {};

    protected _browser: Browser | null = null;
    protected _thens: Function[] = [];
    protected _isMock: boolean = false;

    protected defaultBrowserOptions: BrowserOptions = {
        headless: true,
        recordConsole: true,
        outputConsole: false,
    };
    protected defaultRequestOptions: any = {
        method: 'GET',
        headers: {}
    };

    constructor(suite: Suite, title: string, onDone: Function) {
        this.initialized = Date.now();
        this.suite = suite;
        this.title = title;
        this.cookieJar = new request.jar();
        this.options = this.defaultRequestOptions;
        this.onDone = onDone;
        this.subheading(title);
    }

    /**
     * Did any assertions in this scenario fail?
     *
     * @returns {boolean}
     */
    public failed(): boolean {
        return (this.failures.length > 0);
    }

    /**
     * Did all assertions in this scenario pass? This also requires that the scenario has completed
     *
     * @returns {boolean}
     */
    public passed(): boolean {
        return !!(this.end && this.failures.length == 0);
    }

    /**
     * Set body to submit
     * 
     * @param jsonObject 
     * @returns {Scenario}
     */
    public jsonBody(jsonObject: any): Scenario {
        this.header('Content-Type', 'application/json');
        return this.body(JSON.stringify(jsonObject));
    }

    /**
     * 
     * @param str 
     */
    public body(str: string): Scenario {
        this.options.body = str;
        return this;
    }

    /**
     * Make sure the web page has valid SSL certificate
     * 
     * @param verify 
     */
    public verifySslCert(verify: boolean): Scenario {
        this.options.strictSSL = verify;
        this.options.rejectUnauthorized = verify;
        return this;
    }

    /**
     * 
     * @param proxyUri 
     */
    public proxy(proxyUri: string): Scenario {
        this.options.proxy = proxyUri;
        return this;
    }

    /**
     * Set the timeout for how long the request should wait for a response
     *
     * @param {number} timeout
     * @returns {Scenario}
     */
    public timeout(timeout: number): Scenario {
        this.options.timeout = timeout;
        return this;
    }

    /**
     * Do not run this scenario until execute() is called
     *
     * @param {boolean} bool
     * @returns {Scenario}
     */
    public wait(bool: boolean = true): Scenario {
        this.waitToExecute = bool;
        return this;
    }

    /**
     * Set the form options that will be submitted with the request
     *
     * @param form
     * @returns {Scenario}
     */
    public form(form: {}): Scenario {
        this.options.form = form;
        return this;
    }

    /**
     * 
     * @param n 
     */
    public maxRedirects(n: number): Scenario {
        this.options.maxRedirects = n;
        return this;
    }

    /**
     * 
     * @param onRedirect 
     */
    public followRedirect(onRedirect: boolean | Function): Scenario {
        this.options.followRedirect = onRedirect;
        return this;
    }

    /**
     * Set the basic authentication headers to be sent with this request
     *
     * @param authorization
     * @returns {Scenario}
     */
    public auth(authorization: { username: string, password: string }): Scenario {
        this.options.auth = authorization;
        return this;
    }

    /**
     * Set a cookie
     * 
     * @param key 
     * @param value 
     * @param opts 
     */
    public cookie(key: string, value: string, opts?: any): Scenario {
        let cookie: r.Cookie | undefined = r.cookie(key + '=' + value);
        if (cookie !== undefined) {
            this.cookieJar.setCookie(cookie, this.buildUrl(), opts);
        }
        else {
            throw new Error('error setting cookie');
        }
        return this;
    }

    /**
     * Set the full list of headers to submit with this request
     *
     * @param headers
     * @returns {Scenario}
     */
    public headers(headers: {}): Scenario {
        this.options.headers = Object.assign(this.options.headers, headers);
        return this;
    }

    /**
     * Set a single header key-value without overriding others
     *
     * @param {string} key
     * @param value
     * @returns {Scenario}
     */
    public header(key: string, value: any): Scenario {
        this.options.headers = this.options.headers || {};
        this.options.headers[key] = value;
        return this;
    }

    /**
     * Set the HTTP method of this request
     *
     * @param {string} method
     * @returns {Scenario}
     */
    public method(method: string): Scenario {
        this.options.method = method.toUpperCase();
        return this;
    }

    /**
     * Has this scenario completed?
     *
     * @returns {boolean}
     */
    public isDone(): boolean {
        return (this.end !== null);
    }

    /**
     * Add a subheading log message to buffer
     */
    public subheading(message: string): Scenario {
        this.log.push(new SubheadingLine(message));
        return this;
    }

    /**
     * Add a neutral line to the output
     */
    public comment(message: string): Scenario {
        this.log.push(
            new CommentLine(message)
        );
        return this;
    }
    
    /**
     * Alias for comment
     */
    public echo = this.comment;

    /**
     * Assert something is true, with respect to the flipped not()
     * Also respect ignore assertions flag
     */
    public assert(statement: boolean, message: string, actualValue?: string): Scenario {
        if (!this.ignoreAssertion) {
            let passed: boolean = this.flipAssertion ? !statement : !!statement;
            if (this.flipAssertion) {
                message = 'NOT: ' + message;
            }
            if (this.optionalAssertion) {
                message += ' - Optional';
            }
            if (passed) {
                this.pass(message);
            }
            else {
                if (actualValue) {
                    message += ' (' + actualValue + ')';
                }
                this.fail(message, this.optionalAssertion);
            }
            return this.reset();
        }
        return this;
    }

    /**
     * Push in a new passing assertion
     */
    public pass(message: string): Scenario {
        if (this.nextLabel) {
            message = this.nextLabel;
            this.nextLabel = null;
        }
        this.log.push(new PassLine(message));
        this.passes.push(message);
        return this;
    }

    /**
     * Push in a new failing assertion
     */
    public fail(message: string, isOptional: boolean = false): Scenario {
        if (this.nextLabel) {
            message = this.nextLabel;
            this.nextLabel = null;
        }
        let line: FailLine = new FailLine(message);
        if (isOptional) {
            line.color = ConsoleColor.FgMagenta;
            line.textSuffix = '(Optional)';
        }
        this.log.push(line);
        if (!isOptional) {
            this.failures.push(message);
        }
        return this;
    }

    /**
     * Clear out any previous settings
     */
    protected reset(): Scenario {
        this.flipAssertion = false;
        this.optionalAssertion = false;
        return this;
    }

    /**
     * Flip the next assertion
     */
    public not(): Scenario {
        this.flipAssertion = true;
        return this;
    }

    /**
    * Consider the next set of tests optional, until the next selector
    */
    public optional(): Scenario {
        this.optionalAssertion = true;
        return this;
    }

    /**
     * Ignore assertions until further notice
     */
    public ignore(assertions: boolean | Function = true): Scenario {
        if (typeof assertions == 'boolean') {
            this.ignoreAssertion = assertions;
        }
        else if (typeof assertions == 'function') {
            this.ignore(true);
            assertions();
            this.ignore(false);
        }
        return this;
    }

    /**
     * Execute now if we are able to do so
     */
    protected executeWhenReady() {
        if (!this.waitToExecute && this.canExecute()) {
            this.execute();
        }
    }

    /**
     * Set the URL that this scenario will hit
     *
     * @param {string} url
     * @returns {Scenario}
     */
    public open(url: string): Scenario {
        // You can only load the url once per scenario
        if (!this.hasExecuted()) {
            this.url = url;
            this._isMock = false;
            this.executeWhenReady();
        }
        return this;
    }

    /**
     * Set the callback for the assertions to run after the request has a response
     */
    public then(callback: Function): Scenario {
        // If it hasn't already been executed
        if (!this.hasExecuted()) {
            this._thens.push(callback);
            // Execute at the next opportunity.
            setTimeout(() => {
                this.executeWhenReady();
            }, 0);
        }
        return this;
    }

    /**
     * Alias for then()
     */
    public assertions = this.then;

    /**
     * Skip this scenario completely and mark it done
     *
     * @returns {Scenario}
     */
    public skip(message?: string): Scenario {
        if (!this.hasExecuted()) {
            message = "Skipped" + (message ? ': ' + message : '');
            this.start = Date.now();
            this.log.push(new CommentLine(message));
            this.end = Date.now();
            this.onDone(this);
        }
        return this;
    }

    /**
     * 
     */
    protected getCookies(): r.Cookie[] {
        return this.cookieJar.getCookies(this.options.uri);
    }

    /**
     * 
     */
    protected getScenarioType(): { name: string, responseObject: any;  } {
        if (this.responseType == ResponseType.json) {
            return {
                name: 'REST End Point',
                responseObject: JsonResponse
            }
        }
        else if (this.responseType == ResponseType.image) {
            return {
                name: 'Image',
                responseObject: ImageResponse
            }
        }
        else if (this.responseType == ResponseType.script) {
            return {
                name: 'Script',
                responseObject: ScriptResponse
            }
        }
        else if (this.responseType == ResponseType.stylesheet) {
            return {
                name: 'Stylesheet',
                responseObject: CssResponse
            }
        }
        else if (this.responseType == ResponseType.resource) {
            return {
                name: 'Resource',
                responseObject: ResourceResponse
            }
        }
        else if (this.responseType == ResponseType.browser) {
            return {
                name: 'Browser',
                responseObject: BrowserResponse
            }
        }
        else {
            return {
                name: 'HTML Page',
                responseObject: HtmlResponse
            }
        }
    }

    protected processResponse(simplifiedResponse: SimplifiedResponse) {
        let scenarioType: { name: string, responseObject: any } = this.getScenarioType();
        this.requestLoaded = Date.now();
        this.pass('Loaded ' + scenarioType.name + ' ' + this.url);
        
        if (this._thens.length > 0 && this.url !== null) {
            const _thens = this._thens;
            Promise.mapSeries(_thens, (_then) => {
                return _then(
                    new scenarioType.responseObject(this, this.url, simplifiedResponse)
                );
            })
            .then(() => {
                this.done();
            });
            return;
        }
        this.done();
    }

    protected buildUrl(): string {
        return this.suite.buildUrl(this.url || '');
    }

    public getBrowser(): Browser {
        this._browser = (this._browser !== null) ? this._browser : new Browser();
        return this._browser;
    }

    private executeImageRequest() {
        const scenario: Scenario = this;
        require('probe-image-size')(this.options.uri, this.options, function (error, result) {
            if (!error) {
                scenario.processResponse({
                    statusCode: 200,
                    body: JSON.stringify(result),
                    headers: {
                        'content-type': result.mime
                    },
                    cookies: scenario.getCookies()
                });
            }
            else {
                scenario.fail('Failed to load image ' + scenario.url);
                scenario.done();
            }
        });
    }

    private executeBrowserRequest() {
        const scenario: Scenario = this;
        this.getBrowser()
            .open(this.options)
            .then((next: { response: puppeteer.Response; body: string; }) => {
                const response: puppeteer.Response = next.response;
                const body: string = next.body;
                if (response !== null) {
                    scenario.processResponse(
                        Flagpole.toSimplifiedResponse(
                            {
                                statusCode: response.status(),
                                body: body,
                                headers: response.headers(),
                            },
                            body,
                            scenario.getCookies() // this isn't going to work, need to get cookies from Puppeteer
                        )
                    );
                }
                else {
                    scenario.fail('Failed to load ' + scenario.url);
                    scenario.comment('No response.');
                    scenario.done();
                }
                return;
            })
            .catch((e) => {
                scenario.fail('Failed to load ' + scenario.url);
                scenario.comment(e);
                scenario.done();
            });
    }

    private executeDefaultRequest() {
        const scenario: Scenario = this;
        request(this.options, function (error, response, body) {
            if (!error) {
                scenario.processResponse(
                    Flagpole.toSimplifiedResponse(
                        response,
                        body,
                        scenario.getCookies()
                    )
                );
            }
            else {
                scenario.fail('Failed to load ' + scenario.url);
                scenario.comment(error);
                scenario.done();
            }
        });
    }

    protected executeRequest() {
        if (!this.requestStart && this.url !== null) {
            this.requestStart = Date.now();
            this.options.uri = this.buildUrl();
            this.options.jar = this.cookieJar;
            if (this.responseType == ResponseType.image) {
                this.executeImageRequest();
            }
            else if (this.responseType == ResponseType.browser) {
                this.executeBrowserRequest();
            }
            else {
                this.executeDefaultRequest();
            }
        }
    }

    protected executeMock() {
        if (!this.requestStart && this.url !== null) {
            let scenario: Scenario = this;
            this.requestStart = Date.now();
            Mock.loadLocalFile(this.url).then(function (mock: Mock) {
                scenario.processResponse(mock);
            }).catch(function () {
                scenario.fail('Failed to load page ' + scenario.url);
                scenario.done();
            });
        }
    }

    /**
     * Execute this scenario
     */
    public execute(): Scenario {
        if (!this.hasExecuted() && this.url !== null) {
            this.start = Date.now();
            // If we waited first
            if (this.waitToExecute && this.initialized !== null) {
                this.log.push(new CommentLine('Waited ' + (this.start - this.initialized) + 'ms'));
            }
            // Execute it
            this._isMock ?
                this.executeMock() : 
                this.executeRequest();
        }
        return this;
    }

    /**
     * Fake response from local file for testing
     */
    public mock(localPath: string): Scenario {
        this.url = localPath;
        this._isMock = true;
        this.executeWhenReady();
        return this;
    }

    /**
     * Override the next test's default pass/fail message with something custom and more human readable
     *
     * @param {string} message
     * @returns {Scenario}
     */
    public label(message: string): Scenario {
        this.nextLabel = message;
        return this;
    }

    public getTitle(): string {
        return this.title;
    }

    /**
     * Get the log buffer
     *
     * @returns {Array<ConsoleLine>}
     */
    public getLog(): Array<iLogLine> {
        return this.log;
    }

    /**
     * Find the total execution time of this scenario
     *
     * @returns {number}
     */
    protected getExecutionTime(): number {
        return (this.end !== null && this.start !== null) ?
            (this.end - this.start) : 0;
    }

    /**
     * Mark this scenario as completed
     *
     * @returns {Scenario}
     */
    public done(): Scenario {
        this.end = Date.now();
        this.log.push(new CommentLine("Took " + this.getExecutionTime() + 'ms'));
        this.onDone(this);
        return this;
    }

    /**
     * Get the url
     */
    public getUrl(): string | null {
        return this.url;
    }

    /**
     * 
     */
    public getRequestLoadTime(): number | null {
        return (this.requestLoaded && this.requestStart) ?
            (this.requestLoaded - this.requestStart): null;
    }

    /**
     * We ready to pull the trigger on this one?
     */
    public canExecute(): boolean {
        return (!this.hasExecuted() && this.url !== null && this._thens.length > 0);
    }

    /**
     * Has this scenario already been executed?
     */
    public hasExecuted(): boolean {
        return this.start !== null;
    }

    /**
     * Did this scenario finish executing?
     */
    public hasFinished(): boolean {
        return this.hasExecuted() && this.end !== null;
    }

    /**
     * SET RESPONSE TYPE
     */

    protected setResponseType(type: ResponseType, opts: any = {}): Scenario {
        if (this.hasExecuted()) {
            throw new Error('Scenario was already executed. Can not change type.');
        }
        this.options = opts;
        this.responseType = type;
        return this;
    }

    public image(opts?: any): Scenario {
        return this.setResponseType(
            ResponseType.image,
            Object.assign(this.defaultRequestOptions, opts)
        );
    }

    public html(opts?: any): Scenario {
        return this.setResponseType(
            ResponseType.html,
            Object.assign(this.defaultRequestOptions, opts)
        );
    }

    public json(opts: any = {}): Scenario {
        return this.setResponseType(
            ResponseType.json,
            Object.assign(this.defaultRequestOptions, opts)
        );
    }

    public script(opts: any = {}): Scenario {
        return this.setResponseType(
            ResponseType.script,
            Object.assign(this.defaultRequestOptions, opts)
        );
    }

    public stylesheet(opts: any = {}): Scenario {
        return this.setResponseType(
            ResponseType.stylesheet,
            Object.assign(this.defaultRequestOptions, opts)
        );
    }

    public resource(opts: any = {}): Scenario {
        return this.setResponseType(
            ResponseType.resource,
            Object.assign(this.defaultRequestOptions, opts)
        );
    }

    public browser(opts: BrowserOptions = {}): Scenario {
        return this.setResponseType(
            ResponseType.browser,
            Object.assign(this.defaultBrowserOptions, opts)
        );
    }

}
