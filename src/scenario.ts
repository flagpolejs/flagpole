import { Flagpole } from "./index";
import { Suite } from "./suite";
import { iLogLine, SubheadingLine, CommentLine, PassLine, FailLine, ConsoleColor } from "./consoleline";
import { ResponseType, NormalizedResponse, iResponse, GenericResponse } from "./response";
import * as puppeteer from "puppeteer-core";
import { Browser, BrowserOptions } from "./browser";
import * as Bluebird from "bluebird";
import * as r from "request";
import { createResponse } from './responsefactory';
import { AssertionContext } from './assertioncontext';

const request = require('request');

/**
 * A scenario contains tests that run against one request
 */
export class Scenario {

    public readonly suite: Suite;

    protected notifySuiteOnCompleted: Function;
    protected onReject: Function = () => { };
    protected onResolve: Function = () => { };
    protected onFinally: Function = () => { };

    protected title: string;
    protected log: Array<iLogLine> = [];
    protected failures: Array<string> = [];
    protected passes: Array<string> = [];
    protected initialized: number | null = null;
    protected start: number | null = null;
    protected end: number | null = null;
    protected requestStart: number | null = null;
    protected requestLoaded: number | null = null;
    protected responseType: ResponseType = ResponseType.html;
    protected redirectCount: number = 0;
    protected finalUrl: string | null = null;
    protected url: string | null = null;
    protected waitToExecute: boolean = false;
    protected nextLabel: string | null = null;
    protected flipAssertion: boolean = false;
    protected optionalAssertion: boolean = false;
    protected ignoreAssertion: boolean = false;
    protected cookieJar: r.CookieJar;
    protected options: any = {};
    protected _followRedirect: boolean | Function | null = null;

    protected _browser: Browser | null = null;
    protected _thens: Function[] = [];
    protected _thensMessage: Array<string | null> = [];
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

    constructor(suite: Suite, title: string, notifySuiteOnCompleted: Function) {
        const me: Scenario = this;
        this.initialized = Date.now();
        this.suite = suite;
        this.title = title;
        this.cookieJar = new request.jar();
        this.options = this.defaultRequestOptions;
        this.notifySuiteOnCompleted = notifySuiteOnCompleted;
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
        this._followRedirect = onRedirect;
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
    public assert(assertion: boolean, message: string, actualValue?: string): Scenario {
        if (!this.ignoreAssertion) {
            let passed: boolean = this.flipAssertion ? !assertion : !!assertion;
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

    public asyncAssert(assertion: Function | boolean, message: string, actualValue?: string): Promise<any> {
        return new Promise((resolve) => {
            this.assert(
                typeof assertion == 'function' ? assertion() : assertion,
                message,
                actualValue
            );
            resolve();
        });
    }

    public resolves(promise: Promise<any>, message: string, actualValue?: string): Promise<any> {
        return new Promise((resolve, reject) => {
            promise.then(() => {
                this.assert(true, message, actualValue);
                resolve();
            }).catch(() => {
                this.assert(false, message, actualValue);
                reject();
            })
        });
    }

    public rejects(promise: Promise<any>, message: string, actualValue?: string): Promise<any> {
        return new Promise((resolve, reject) => {
            promise.then(() => {
                this.assert(false, message, actualValue);
                reject();
            }).catch(() => {
                this.assert(true, message, actualValue);
                resolve();
            })
        });
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
    public then(a: Function | string, b?: Function): Scenario {
        const callback: Function = (() => {
            if (typeof b == 'function') {
                return b;
            }
            else if (typeof a == 'function') {
                return a;
            }
            else {
                throw new Error('No callback provided.');
            }
        })();
        const message: string | null = (function () {
            if (typeof a == 'string' && a.trim().length > 0) {
                return a;
            }
            return null;
        })();
        // If it hasn't already been executed
        if (!this.hasExecuted()) {
            this._thens.push(callback);
            this._thensMessage.push(message);
            // Execute at the next opportunity.
            setTimeout(() => {
                this.executeWhenReady();
            }, 0);
        }
        else {
            throw new Error('Scenario already executed.');
        }
        return this;
    }
    
    /**
     * Backwards compatible alias
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
            this.notifySuiteOnCompleted(this);
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
    public getResponseType(): ResponseType {
        return this.responseType;
    }

    protected processResponse(r: NormalizedResponse) {
        const scenario: Scenario = this;
        const response: iResponse = createResponse(this, r);
        this.requestLoaded = Date.now();
        this.pass('Loaded ' + response.typeName + ' ' + this.url);
        if (this._thens.length > 0 && this.url !== null) {
            let lastReturnValue: any = null;
            Bluebird.mapSeries(scenario._thens, (_then, index) => {
                const context: AssertionContext = new AssertionContext(scenario, response);
                const comment: string | null = scenario._thensMessage[index];
                comment !== null && this.comment(comment)
                context.result = lastReturnValue;
                lastReturnValue = _then.call(context, response, context);
                return lastReturnValue;
            }).then(() => {
                scenario.done();
            }).catch((err) => {
                scenario.done(err);
            });
            return;
        }
        scenario.done();
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
                scenario.finalUrl = scenario.getUrl();
                scenario.processResponse(
                    NormalizedResponse.fromProbeImage(
                        result,
                        scenario.getCookies()
                    )
                );
            }
            else {
                scenario.fail('Failed to load image ' + scenario.url);
                scenario.done('Failed to load image');
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
                    scenario.finalUrl = response.url();
                    scenario.processResponse(
                        NormalizedResponse.fromPuppeteer(
                            response,
                            body,
                            scenario.getCookies() // this isn't going to work, need to get cookies from Puppeteer
                        )
                    );
                }
                else {
                    scenario.fail('Failed to load ' + scenario.url);
                    scenario.comment('No response.');
                    scenario.done('Failed to load');
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
        this.options.followRedirect = (this._followRedirect === null) ?
            (response: any) => {
                const url = require('url');
                scenario.finalUrl = response.request.href;
                if (response.headers.location) {
                    scenario.finalUrl = url.resolve(response.headers.location, response.request.href);
                }
                scenario.redirectCount++;
                return true;
            } : this._followRedirect;
        request(this.options, function (error: string, response: any, body: string) {
            if (!error) {
                scenario.processResponse(
                    NormalizedResponse.fromRequest(
                        response,
                        body,
                        scenario.getCookies()
                    )
                );
            }
            else {
                scenario.fail('Failed to load ' + scenario.url);
                scenario.comment(error);
                scenario.done('Failed to load');
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
            const scenario: Scenario = this;
            this.requestStart = Date.now();
            NormalizedResponse.fromLocalFile(this.url).then((mock: NormalizedResponse) => {
                scenario.processResponse(mock);
            }).catch(function () {
                scenario.fail('Failed to load page ' + scenario.url);
                scenario.done('Failed to load page');
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
    protected done(err: any = null): Scenario {
        // Only run this once
        if (this.end === null) {
            this.end = Date.now();
            this.log.push(new CommentLine("Took " + this.getExecutionTime() + 'ms'));
            // Resolve or reject, like scenario is a promise
            if (err === null) {
                this.onResolve(this)
            }
            else {
                this.fail(err);
                this.onReject(err);
            }
            // Finally
            this.onFinally(this);
            this.notifySuiteOnCompleted(this);
        }
        return this;
    }

    public catch(callback: Function): Scenario {
        this.onReject = callback;
        return this;
    }

    public success(callback: Function): Scenario {
        this.onResolve = callback;
        return this;
    }

    public finally(callback: Function): Scenario {
        this.onFinally = callback;
        return this;
    }

    /**
     * Get the url
     */
    public getUrl(): string | null {
        return this.url;
    }

    /**
     * URL after redirects
     */
    public getFinalUrl(): string | null {
        return this.finalUrl;
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

    public video(opts?: any): Scenario {
        return this.setResponseType(
            ResponseType.video,
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

    public pause(millis: number): Scenario {
        this.then(() => {
            return new Promise((resolve) => {
                setTimeout(() => {
                    this.echo('Paused ' + millis + ' milliseconds');
                    resolve();
                }, millis);
            });
        });
        return this;
    }

}
