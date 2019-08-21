import { Suite } from "./suite";
import { iLogLine, SubheadingLine, CommentLine, PassLine, FailLine, ConsoleColor, WarningLine, OptionalFailLine, DetailLine } from "./consoleline";
import { ResponseType, NormalizedResponse, iResponse } from "./response";
import * as puppeteer from "puppeteer-core";
import { Browser, BrowserOptions } from "./browser";
import * as Bluebird from "bluebird";
import * as r from "request";
import { createResponse } from './responsefactory';
import { AssertionContext } from './assertioncontext';
import { AssertionResult } from './assertionresult';

const request = require('request');
const probeImage = require('probe-image-size');

export enum ScenarioStatusEvent {
    beforeExecute,
    executionProgress,
    afterExecute,
    finished
}

/**
 * A scenario contains tests that run against one request
 */
export class Scenario {

    public readonly suite: Suite;

    public get responseType(): ResponseType {
        return this._responseType;
    }

    public get title(): string {
        return this._title;
    }

    public set title(newTitle: string) {
        if (this.hasExecuted) {
            throw new Error("Can not change the scenario's title after execution has started.");
        }
        this._title = newTitle;
    }

    /**
     * Length of time in milliseconds from initialization to completion
     */
    public get totalDuration(): number | null {
        return this._timeScenarioFinished !== null ?
            (this._timeScenarioFinished - this._timeScenarioInitialized) : null;
    }

    /**
     * Length of time in milliseconds from start of execution to completion
     */
    public get executionDuration(): number | null {
        return this._timeScenarioFinished !== null && this._timeScenarioExecuted !== null ?
            (this._timeScenarioFinished - this._timeScenarioExecuted) : null;
    }

    /**
     * Length of time in milliseconds from request start to response complete
     */
    public get requestDuration(): number | null {
        return (this._timeRequestStarted !== null && this._timeRequestLoaded !== null) ?
            (this._timeRequestLoaded - this._timeRequestStarted) : null;
    }

    /**
     * Did any assertions in this scenario fail?
     */
    public get hasFailed(): boolean {
        return (this._failures.length > 0);
    }

    /**
     * Did all assertions in this scenario pass? This also requires that the scenario has completed
     */
    public get hasPassed(): boolean {
        return !!(this.hasFinished && this._failures.length == 0);
    }


    /**
     * We ready to pull the trigger on this one?
     */
    public get canExecute(): boolean {
        return (
            !this.hasExecuted &&
            this._url !== null &&
            this._nextCallbacks.length > 0
        );
    }

    /**
     * Has this scenario already been executed?
     */
    public get hasExecuted(): boolean {
        return (this._timeScenarioExecuted !== null);
    }

    /**
     * Did this scenario finish executing?
     */
    public get hasFinished(): boolean {
        return (
            this.hasExecuted &&
            this._timeScenarioFinished !== null
        );
    }

    /**
    * Get the url
    */
    public get url(): string | null {
        return this._url;
    }

    /**
     * URL after redirects
     */
    public get finalUrl(): string | null {
        return this._finalUrl;
    }

    /**
     * Retrieve the options that itialized the request in this scenario
     */
    public get requestOptions(): any {
        return this._options;
    }

    protected _title: string;
    protected _subscribers: Function[] = [];
    protected _nextCallbacks: Function[] = [];
    protected _nextMessages: Array<string | null> = [];
    protected _beforeCallbacks: Function[] = [];
    protected _afterCallbacks: Function[] = [];
    protected _finallyCallbacks: Function[] = [];
    protected _errorCallbacks: Function[] = [];
    protected _failureCallbacks: Function[] = [];
    protected _successCallbacks: Function[] = [];
    protected _onCompletedCallback: (scenario: Scenario) => void;
    protected _log: iLogLine[] = [];
    protected _failures: Array<AssertionResult> = [];
    protected _passes: Array<AssertionResult> = [];
    protected _timeScenarioInitialized: number = Date.now();
    protected _timeScenarioExecuted: number | null = null;
    protected _timeRequestStarted: number | null = null;
    protected _timeRequestLoaded: number | null = null;
    protected _timeScenarioFinished: number | null = null;
    protected _responseType: ResponseType = ResponseType.html;
    protected _redirectCount: number = 0;
    protected _finalUrl: string | null = null;
    protected _url: string | null = null;
    protected _waitToExecute: boolean = false;
    protected _flipAssertion: boolean = false;
    protected _ignoreAssertion: boolean = false;
    protected _cookieJar: r.CookieJar;
    protected _options: any = {};
    protected _followRedirect: boolean | Function | null = null;
    protected _browser: Browser | null = null;
    protected _isMock: boolean = false;
    protected _defaultBrowserOptions: BrowserOptions = {
        headless: true,
        recordConsole: true,
        outputConsole: false,
    };
    protected _defaultRequestOptions: any = {
        method: 'GET',
        headers: {}
    };

    public static create(suite: Suite, title: string, type: ResponseType, opts: any, onCompletedCallback: (scenario: Scenario) => void): Scenario {
        const scenario: Scenario = new Scenario(suite, title, onCompletedCallback);
        opts = (() => {
            return (type == ResponseType.browser || type == ResponseType.extjs) ?
                { ...scenario._defaultBrowserOptions, ...opts } : 
                { ...scenario._defaultRequestOptions, ...opts }
        })();
        return scenario._setResponseType(type, opts);
    }

    private constructor(suite: Suite, title: string, onCompletedCallback: (scenario: Scenario) => void) {
        this.suite = suite;
        this._cookieJar = new request.jar();
        this._options = this._defaultRequestOptions;
        this._title = title;
        this._onCompletedCallback = onCompletedCallback;
    }

    /**
     * Get log of all assetions, comments, etc. from this scenario
     */
    public async getLog(): Promise<iLogLine[]> {
        let output: iLogLine[] = [];
        output = this._log;
        return output;
    }

    /**
     * PubSub Subscription to any significant status changes of this scenario
     * 
     * @param callback 
     */
    public subscribe(callback: Function) {
        this._subscribers.push(callback);
    }

    /**
     * Set body to submit as JSON object
     * 
     * @param jsonObject 
     */
    public setJsonBody(jsonObject: any): Scenario {
        this.setHeader('Content-Type', 'application/json');
        return this.setRawBody(JSON.stringify(jsonObject));
    }

    /**
     * Set body to submit as raw string
     */
    public setRawBody(str: string): Scenario {
        this._options.body = str;
        return this;
    }

    /**
     * Make sure the web page has valid SSL certificate
     */
    public verifySslCert(verify: boolean): Scenario {
        this._options.strictSSL = verify;
        this._options.rejectUnauthorized = verify;
        return this;
    }

    /**
     * Set the proxy URL for the request
     */
    public setProxyUrl(proxyUrl: string): Scenario {
        this._options.proxy = proxyUrl;
        return this;
    }

    /**
     * Set the timeout for how long the request should wait for a response
     */
    public setTimeout(timeout: number): Scenario {
        this._options.timeout = timeout;
        return this;
    }

    /**
     * Set the form options that will be submitted with the request
     *
     * @param form
     */
    public setFormData(form: {}): Scenario {
        this._options.form = form;
        return this;
    }

    /**
     * Maximum number of redirects to allow
     * 
     * @param n 
     */
    public setMaxRedirects(n: number): Scenario {
        this._options.maxRedirects = n;
        return this;
    }

    /**
     * Should we follow redirects? This can be boolean or a function callback which returns boolean
     * 
     * @param onRedirect 
     */
    public shouldFollowRedirects(onRedirect: boolean | Function): Scenario {
        this._followRedirect = onRedirect;
        return this;
    }

    /**
     * Set the basic authentication headers to be sent with this request
     *
     * @param authorization
     */
    public setBasicAuth(authorization: { username: string, password: string }): Scenario {
        this._options.auth = authorization;
        return this;
    }

    /**
     * Set the authorization header with a bearer token
     *
     * @param {string} token
     */
    public setBearerToken(token: string): Scenario {
        this.setHeader('Authorization', `Bearer ${token}`)
        return this;
    }

    /**
     * Set a cookie
     * 
     * @param key 
     * @param value 
     * @param opts 
     */
    public setCookie(key: string, value: string, opts?: any): Scenario {
        let cookie: r.Cookie | undefined = r.cookie(key + '=' + value);
        if (cookie !== undefined) {
            this._cookieJar.setCookie(cookie, this._buildUrl(), opts);
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
     */
    public setHeaders(headers: {}): Scenario {
        this._options.headers = { ...this._options.headers, ...headers };
        return this;
    }

    /**
     * Set a single header key-value without overriding others
     *
     * @param {string} key
     * @param value
     */
    public setHeader(key: string, value: any): Scenario {
        this._options.headers = this._options.headers || {};
        this._options.headers[key] = value;
        return this;
    }

    /**
     * Set the HTTP method of this request
     *
     * @param {string} method
     */
    public setMethod(method: string): Scenario {
        this._options.method = method.toUpperCase();
        return this;
    }

    /**
     * Do not run this scenario until execute() is called
     * 
     * @param bool 
     */
    public wait(bool: boolean = true): Scenario {
        this._waitToExecute = bool;
        return this;
    }

    /**
     * Add a subheading log message to buffer
     */
    public subheading(message: string): Scenario {
        this._log.push(new SubheadingLine(message));
        return this;
    }

    /**
     * Add a neutral line to the output
     */
    public comment(message: string): Scenario {
        this._log.push(
            new CommentLine(message)
        );
        return this;
    }

    /**
     * Push in a new passing assertion
     */
    public logResult(result: AssertionResult): Scenario {
        // Log into passes and failures
        if (result.passed) {
            this._passes.push(result);
            this._log.push(new PassLine(result.message));
        }
        else if (!result.isOptional) {
            this._failures.push(result);
            this._log.push(new FailLine(result.message));
            (result.details !== null) && this._log.push(new DetailLine(result.details));
        }
        else {
            this._log.push(new OptionalFailLine(result.message));
            (result.details !== null) && this._log.push(new DetailLine(result.details));
        }
        return this;
    }

    /**
     * Put in a non-fatal warning message, like a deprecation
     * 
     * @param message 
     */
    public logWarning(message: string): Scenario {
        this._log.push(new WarningLine(message));
        return this;
    }

    /**
     * Ignore assertions until further notice. This is created to prevent automatic assertions from firing.
     */
    public ignore(assertions: boolean | Function = true): Scenario {
        if (typeof assertions == 'boolean') {
            this._ignoreAssertion = assertions;
        }
        else if (typeof assertions == 'function') {
            this.ignore(true);
            assertions();
            this.ignore(false);
        }
        return this;
    }

    /**
     * Set the URL that this scenario will hit
     *
     * @param {string} url
     */
    public open(url: string): Scenario {
        // You can only load the url once per scenario
        if (!this.hasExecuted) {
            this._url = String(url);
            this._isMock = false;
            this._executeWhenReady();
        }
        return this;
    }

    /**
     * Set the callback for the assertions to run after the request has a response
     */
    public next(message: string, callback: any): Scenario;
    public next(callback: any): Scenario;
    public next(a: Function | string, b?: Function): Scenario {
        return this._next(a, b, true);
    }

    /**
     * Insert this as the first next
     */
    public nextPrepend(message: string, callback: any): Scenario;
    public nextPrepend(callback: any): Scenario;
    public nextPrepend(a: Function | string, b?: Function): Scenario {
        return this._next(a, b, false);
    }

    /**
     * Skip this scenario completely and mark it done
     */
    public async skip(message?: string): Promise<Scenario> {
        if (this.hasExecuted) {
            throw new Error(`Can't skip Scenario since it already started executing.`);
        }
        const scenario = this;
        await this._fireBefore();
        message = "Skipped" + (message ? ': ' + message : '');
        scenario._publish(ScenarioStatusEvent.executionProgress);
        scenario._log.push(new CommentLine(message));
        await scenario._fireAfter();
        await scenario._fireFinally();
        return this;
    }

    /**
     * Get the browser object for a browser request
     */
    public getBrowser(): Browser {
        this._browser = (this._browser !== null) ? this._browser : new Browser();
        return this._browser;
    }

    /**
     * Execute this scenario
     */
    public async execute(): Promise<Scenario> {
        if (!this.hasExecuted && this._url !== null) {
            await this._fireBefore();
            this.subheading(this.title);
            // If we waited first
            if (this._waitToExecute) {
                this._log.push(new CommentLine(`Waited ${this.executionDuration}ms`));
            }
            // Execute it
            this._publish(ScenarioStatusEvent.executionProgress);
            this._isMock ?
                this._executeMock() :
                this._executeRequest();
        }
        return this;
    }

    /**
     * Callback when someting in the scenario throws an error
     */
    public error(callback: Function): Scenario {
        this._errorCallbacks.push(callback);
        return this;
    }

    /**
     * Callback after scenario completes if successful
     * 
     * @param callback 
     */
    public success(callback: Function): Scenario {
        this._successCallbacks.push(callback);
        return this;
    }

    /**
     * Callback after scenario completes if failed
     * 
     * @param callback 
     */
    public failure(callback: Function): Scenario {
        this._failureCallbacks.push(callback);
        return this;
    }

    /**
     * callback just before the scenario starts to execute
     * 
     * @param callback 
     */
    public before(callback: Function): Scenario {
        this._beforeCallbacks.push(callback);
        return this;
    }

    /**
     * callback just after the scenario completes
     */
    public after(callback: Function): Scenario {
        this._afterCallbacks.push(callback);
        return this;
    }

    /**
     * callback at the very end, whether pass or fail
     * 
     * @param callback 
     */
    public finally(callback: Function): Scenario {
        this._finallyCallbacks.push(callback);
        return this;
    }

    /**
     * Set scenario response type to image
     * 
     * @param opts 
     */
    public image(opts?: any): Scenario {
        return this._setResponseType(
            ResponseType.image,
            { ...this._defaultRequestOptions, ...opts }
        );
    }

    /**
     * Set scenario response type to video
     * 
     * @param opts 
     */
    public video(opts?: any): Scenario {
        return this._setResponseType(
            ResponseType.video,
            { ...this._defaultRequestOptions, ...opts }
        );
    }

    /**
     * Set scenario response type to html/DOM
     * 
     * @param opts 
     */
    public html(opts?: any): Scenario {
        return this._setResponseType(
            ResponseType.html,
            { ...this._defaultRequestOptions, ...opts }
        );
    }

    /**
     * Set scenario response type to JSON/REST API
     * 
     * @param opts 
     */
    public json(opts: any = {}): Scenario {
        return this._setResponseType(
            ResponseType.json,
            { ...this._defaultRequestOptions, ...opts }
        );
    }

    /**
     * Set scenario response type to script
     * 
     * @param opts 
     */
    public script(opts: any = {}): Scenario {
        return this._setResponseType(
            ResponseType.script,
            { ...this._defaultRequestOptions, ...opts }
        );
    }

    /**
     * Set scenario response type to stylesheet
     * 
     * @param opts 
     */
    public stylesheet(opts: any = {}): Scenario {
        return this._setResponseType(
            ResponseType.stylesheet,
            { ...this._defaultRequestOptions, ...opts }
        );
    }

    /**
     * Set scenario response type to generic resource
     * 
     * @param opts 
     */
    public resource(opts: any = {}): Scenario {
        return this._setResponseType(
            ResponseType.resource,
            { ...this._defaultRequestOptions, ...opts }
        );
    }

    /**
     * Set scenario response type to browser, which will use Puppeteer 
     * 
     * @param opts 
     */
    public browser(opts: BrowserOptions = {}): Scenario {
        return this._setResponseType(
            ResponseType.browser,
            { ...this._defaultBrowserOptions, ...opts }
        );
    }

    /**
     * Set scenario response type to extjs, which will use Puppeteer 
     * 
     * @param opts 
     */
    public extjs(opts: BrowserOptions = {}): Scenario {
        // Uses browser options because it will leverage Puppeteer
        return this._setResponseType(
            ResponseType.extjs,
            { ...this._defaultBrowserOptions, ...opts }
        );
    }

    /**
     * Fake response from local file for testing
     */
    public mock(localPath: string): Scenario {
        this._url = localPath;
        this._isMock = true;
        this._executeWhenReady();
        return this;
    }

    /**
     * Clear out any previous settings
     */
    protected _reset(): Scenario {
        this._flipAssertion = false;
        return this;
    }

    /**
     * Get the cookie jar for this url
     */
    protected _getCookies(): r.Cookie[] {
        return this._cookieJar.getCookies(this._options.uri);
    }

    /**
     * Handle the normalized response once the request comes back
     * This will loop through each next
     * 
     * @param r 
     */
    protected _processResponse(r: NormalizedResponse) {
        const scenario: Scenario = this;
        const response: iResponse = createResponse(this, r);
        const context: AssertionContext = new AssertionContext(scenario, response);
        this._timeRequestLoaded = Date.now();
        this.logResult(AssertionResult.pass('Loaded ' + response.typeName + ' ' + this._url));
        let lastReturnValue: any = null;
        // Execute all the assertion callbacks one by one
        this._publish(ScenarioStatusEvent.executionProgress);
        Bluebird.mapSeries(scenario._nextCallbacks, (_then, index) => {
            const comment: string | null = scenario._nextMessages[index];
            comment !== null && this.comment(comment)
            context.result = lastReturnValue;
            lastReturnValue = _then.apply(context, [context]);
            return lastReturnValue;
        }).then(() => {
            scenario._markScenarioCompleted();
        }).catch((err) => {
            scenario._markScenarioCompleted(err);
        });
        this._publish(ScenarioStatusEvent.executionProgress);
    }

    /**
     * Build URL for this scenario, relative to the Suite's base
     */
    protected _buildUrl(): string {
        return this.suite.buildUrl(this._url || '');
    }

    /**
     * Set the type of response this scenario is and the options
     * 
     * @param type 
     * @param opts 
     */
    protected _setResponseType(type: ResponseType, opts: any = {}): Scenario {
        if (this.hasExecuted) {
            throw new Error('Scenario was already executed. Can not change type.');
        }
        this._options = opts;
        this._responseType = type;
        return this;
    }

    /**
     * Start an image scenario
     */
    private _executeImageRequest() {
        const scenario: Scenario = this;
        probeImage(this._options.uri, this._options)
            .then(result => {
                const response: NormalizedResponse = NormalizedResponse.fromProbeImage(
                    result,
                    scenario._getCookies()
                );
                scenario._finalUrl = scenario.url;
                scenario._processResponse(response);
            })
            .catch(err => {
                scenario._markScenarioCompleted(`Failed to load image ${scenario._url}`, err);
            });
    }

    /**
     * Start a browser scenario
     */
    private _executeBrowserRequest() {
        const scenario: Scenario = this;
        this.getBrowser()
            .open(this._options)
            .then((next: { response: puppeteer.Response; body: string; }) => {
                const response: puppeteer.Response = next.response;
                const body: string = next.body;
                if (response !== null) {
                    scenario._finalUrl = response.url();
                    scenario._processResponse(
                        NormalizedResponse.fromPuppeteer(
                            response,
                            body,
                            scenario._getCookies() // this isn't going to work, need to get cookies from Puppeteer
                        )
                    );
                }
                else {
                    scenario._markScenarioCompleted(`Failed to load ${scenario._url}`);
                }
                return;
            })
            .catch(err => scenario._markScenarioCompleted(`Failed to load ${scenario._url}`, err));
    }

    /**
     * Start a regular request scenario
     */
    private _executeDefaultRequest() {
        const scenario: Scenario = this;
        this._options.followRedirect = (this._followRedirect === null) ?
            (response: any) => {
                const url = require('url');
                scenario._finalUrl = response.request.href;
                if (response.headers.location) {
                    scenario._finalUrl = url.resolve(response.headers.location, response.request.href);
                }
                scenario._redirectCount++;
                return true;
            } : this._followRedirect;
        request(this._options, function (err: string, response: any, body: string) {
            if (!err) {
                scenario._processResponse(
                    NormalizedResponse.fromRequest(
                        response,
                        body,
                        scenario._getCookies()
                    )
                );
            }
            else {
                scenario._markScenarioCompleted(`Failed to load ${scenario._url}`, err);
            }
        });
    }

    /**
     * Used by all request types to kick off the request
     */
    protected _executeRequest() {
        if (!this._timeRequestStarted && this._url !== null) {
            this._timeRequestStarted = Date.now();
            this._options.uri = this._buildUrl();
            this._options.jar = this._cookieJar;
            if (this._responseType == ResponseType.image) {
                this._executeImageRequest();
            }
            else if (
                this._responseType == ResponseType.browser ||
                this._responseType == ResponseType.extjs
            ) {
                this._executeBrowserRequest();
            }
            else {
                this._executeDefaultRequest();
            }
        }
    }

    /**
     * Start a mock scenario, which will load a local file
     */
    protected _executeMock() {
        if (!this._timeRequestStarted && this._url !== null) {
            const scenario: Scenario = this;
            this._timeRequestStarted = Date.now();
            NormalizedResponse.fromLocalFile(this._url)
                .then((mock: NormalizedResponse) => {
                    scenario._processResponse(mock);
                }).catch(err => {
                    scenario._markScenarioCompleted(`Failed to load page ${scenario._url}`, err);
                });
        }
    }

    /**
     * Execute now if we are able to do so
     */
    protected _executeWhenReady() {
        if (!this._waitToExecute && this.canExecute) {
            this.execute();
        }
    }

    /**
     * Mark this scenario as completed
     *
     * @returns {Scenario}
     */
    protected async _markScenarioCompleted(errorMessage: string | null = null, errorDetails?: string): Promise<Scenario> {
        // Only run this once
        if (!this.hasFinished) {
            await this._fireAfter();
            this._log.push(new CommentLine(`Took ${this.executionDuration}ms`));
            // Scenario completed without an error (could be pass or fail)
            if (errorMessage === null) {
                this.hasPassed ?
                    await this._fireSuccess() :
                    await this._fireFailure();
            }
            // Scenario compelted with an error
            else {
                this.logResult(AssertionResult.fail(errorMessage, errorDetails));
                await this._fireError(errorDetails || errorMessage);
            }
            // Finally
            await this._fireFinally();
        }
        return this;
    }

    /**
     * Run the before execution and wait for any response.
     */
    protected _fireBefore(): Promise<any> {
        const scenario = this;
        this._timeScenarioExecuted = Date.now();
        return new Promise(async function (resolve, reject) {
            // Do all of the befores first, so they can do setup, and then actually execute
            Bluebird.mapSeries(scenario._beforeCallbacks, (_then, index) => {
                return _then.apply(scenario, [scenario]);
            }).then(() => {
                // Then do notifications
                scenario._publish(ScenarioStatusEvent.beforeExecute);
                resolve();
            }).catch((err) => {
                reject(err);
            });
        });
    }

    /**
     * Run after execution and wait for any response
     */
    protected _fireAfter(): Promise<void> {
        const scenario = this;
        this._timeScenarioFinished = Date.now();
        return new Promise((resolve, reject) => {
            // Do all of the afters first, so they can tear down, and then mark it as finished
            Bluebird.mapSeries(this._afterCallbacks, (_then, index) => {
                return _then.apply(scenario, [scenario]);
            }).then(() => {
                this._publish(ScenarioStatusEvent.afterExecute);
                resolve();
            }).catch((err) => {
                reject(err);
            });
        });
    }

    protected _fireSuccess(): Promise<void> {
        const scenario = this;
        return new Promise((resolve, reject) => {
            // Do all all fthe finally callbacks first
            Bluebird.mapSeries(this._successCallbacks, (_then, index) => {
                return _then.apply(scenario, [scenario]);
            }).then(() => {
                this._publish(ScenarioStatusEvent.finished);
                resolve();
            }).catch((err) => {
                reject(err);
            });
        });
    }

    protected _fireFailure(): Promise<void> {
        const scenario = this;
        return new Promise((resolve, reject) => {
            // Do all all fthe finally callbacks first
            Bluebird.mapSeries(this._failureCallbacks, (_then, index) => {
                return _then.apply(scenario, [scenario]);
            }).then(() => {
                this._publish(ScenarioStatusEvent.finished);
                resolve();
            }).catch((err) => {
                reject(err);
            });
        });
    }

    protected _fireError(error: string): Promise<void> {
        const scenario = this;
        return new Promise((resolve, reject) => {
            // Do all all fthe finally callbacks first
            Bluebird.mapSeries(this._errorCallbacks, (_then) => {
                return _then.apply(scenario, [error, scenario]);
            }).then(() => {
                this._publish(ScenarioStatusEvent.finished);
                resolve();
            }).catch((err) => {
                reject(err);
            });
        });
    }

    protected _fireFinally(): Promise<void> {
        const scenario = this;
        return new Promise((resolve, reject) => {
            // Do all all fthe finally callbacks first
            Bluebird.mapSeries(this._finallyCallbacks, (_then, index) => {
                return _then.apply(scenario, [scenario]);
            }).then(() => {
                this._onCompletedCallback(scenario);
                this._publish(ScenarioStatusEvent.finished);
                resolve();
            }).catch((err) => {
                reject(err);
            });
        });
    }

    protected _getCallbackOverload(a: Function | string, b?: Function | null): Function {
        return (() => {
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
    }

    protected _getMessageOverload(a: any): string | null {
        return (function () {
            if (typeof a == 'string' && a.trim().length > 0) {
                return a;
            }
            return null;
        })();
    }

    protected _next(a: Function | string, b?: Function | null, append: boolean = true): Scenario {
        const callback: Function = this._getCallbackOverload(a, b);
        const message: string | null = this._getMessageOverload(a);
        // If it hasn't already been executed
        if (!this.hasExecuted) {
            if (append) {
                this._nextCallbacks.push(callback);
                this._nextMessages.push(message);
            }
            else {
                this._nextCallbacks.unshift(callback);
                this._nextMessages.unshift(message);
            }
            // Execute at the next opportunity.
            setTimeout(() => {
                this._executeWhenReady();
            }, 0);
        }
        else {
            throw new Error('Scenario already executed.');
        }
        return this;
    }
    
    /**
     * PubSub Publish: To any subscribers, just listening for updates (no interupt)
     * 
     * @param statusEvent 
     */
    protected async _publish(statusEvent: ScenarioStatusEvent) {
        const scenario = this;
        this._subscribers.forEach(async function (callback: Function) {
            callback(scenario, statusEvent);
        });
    }

}
