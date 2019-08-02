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
const probeImage = require('probe-image-size');

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
        if (this.hasExecuted()) {
            throw new Error("Can not change the scenario's title after execution has started.");
        }
        this._title = newTitle;
    }

    protected _title: string;
    protected _notifySuiteOnProgress: Function;
    protected _onReject: Function = () => { };
    protected _onResolve: Function = () => { };
    protected _onFinally: Function = () => { };
    protected _log: Array<iLogLine> = [];
    protected _failures: Array<string> = [];
    protected _passes: Array<string> = [];
    protected _timeScenarioInitialized: number = Date.now();
    protected _timeScenarioExecuted: number | null = null;
    protected _timeScenarioFinished: number | null = null;
    protected _timeRequestStarted: number | null = null;
    protected _timeRequestLoaded: number | null = null;
    protected _responseType: ResponseType = ResponseType.html;
    protected _redirectCount: number = 0;
    protected _finalUrl: string | null = null;
    protected _url: string | null = null;
    protected _waitToExecute: boolean = false;
    protected _nextLabel: string | null = null;
    protected _flipAssertion: boolean = false;
    protected _optionalAssertion: boolean = false;
    protected _ignoreAssertion: boolean = false;
    protected _cookieJar: r.CookieJar;
    protected _options: any = {};
    protected _followRedirect: boolean | Function | null = null;
    protected _browser: Browser | null = null;
    protected _thens: Function[] = [];
    protected _thensMessage: Array<string | null> = [];
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

    public get totalDuration(): number | null {
        return this._timeScenarioFinished !== null ?
            (this._timeScenarioFinished - this._timeScenarioInitialized) : null;
    }

    public get executionDuration(): number | null {
        return this._timeScenarioFinished !== null && this._timeScenarioExecuted !== null ?
            (this._timeScenarioFinished - this._timeScenarioExecuted) : null;
    }

    public get requestDuration(): number | null {
        return (this._timeRequestStarted !== null && this._timeRequestLoaded !== null) ?
            (this._timeRequestLoaded - this._timeRequestStarted) : null;
    }

    constructor(suite: Suite, title: string, notifySuiteOnProgress: Function) {
        this.suite = suite;
        this._cookieJar = new request.jar();
        this._options = this._defaultRequestOptions;
        this._notifySuiteOnProgress = notifySuiteOnProgress;
        this._title = title;
    }

    /**
     * Did any assertions in this scenario fail?
     */
    public failed(): boolean {
        return (this._failures.length > 0);
    }

    /**
     * Did all assertions in this scenario pass? This also requires that the scenario has completed
     */
    public passed(): boolean {
        return !!(this.hasFinished() && this._failures.length == 0);
    }

    /**
     * Set body to submit as JSON object
     * 
     * @param jsonObject 
     */
    public jsonBody(jsonObject: any): Scenario {
        this.header('Content-Type', 'application/json');
        return this.body(JSON.stringify(jsonObject));
    }

    /**
     * Set body to submit as raw string
     */
    public body(str: string): Scenario {
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
    public proxy(proxyUri: string): Scenario {
        this._options.proxy = proxyUri;
        return this;
    }

    /**
     * Set the timeout for how long the request should wait for a response
     */
    public timeout(timeout: number): Scenario {
        this._options.timeout = timeout;
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
     * Set the form options that will be submitted with the request
     *
     * @param form
     */
    public form(form: {}): Scenario {
        this._options.form = form;
        return this;
    }

    /**
     * Maximum number of redirects to allow
     * 
     * @param n 
     */
    public maxRedirects(n: number): Scenario {
        this._options.maxRedirects = n;
        return this;
    }

    /**
     * Should we follow redirects? This can be boolean or a function callback which returns boolean
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
     */
    public auth(authorization: { username: string, password: string }): Scenario {
        this._options.auth = authorization;
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
    public headers(headers: {}): Scenario {
        this._options.headers = { ...this._options.headers, ...headers };
        return this;
    }

    /**
     * Set a single header key-value without overriding others
     *
     * @param {string} key
     * @param value
     */
    public header(key: string, value: any): Scenario {
        this._options.headers = this._options.headers || {};
        this._options.headers[key] = value;
        return this;
    }

    /**
     * Set the HTTP method of this request
     *
     * @param {string} method
     */
    public method(method: string): Scenario {
        this._options.method = method.toUpperCase();
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
    public echo = this.comment;
    public comment(message: string): Scenario {
        this._log.push(
            new CommentLine(message)
        );
        return this;
    }

    /**
     * Assert something is true, with respect to the flipped not()
     * Also respect ignore assertions flag
     */
    public assert(assertion: boolean, message: string, actualValue?: string): Scenario {
        if (!this._ignoreAssertion) {
            let passed: boolean = this._flipAssertion ? !assertion : !!assertion;
            if (this._flipAssertion) {
                message = 'NOT: ' + message;
            }
            if (this._optionalAssertion) {
                message += ' - Optional';
            }
            if (passed) {
                this.pass(message);
            }
            else {
                if (actualValue) {
                    message += ' (' + actualValue + ')';
                }
                this.fail(message, this._optionalAssertion);
            }
            return this._reset();
        }
        return this;
    }

    /**
     * Push in a new passing assertion
     */
    public pass(message: string): Scenario {
        if (this._nextLabel) {
            message = this._nextLabel;
            this._nextLabel = null;
        }
        this._log.push(new PassLine(message));
        this._passes.push(message);
        return this;
    }

    /**
     * Push in a new failing assertion
     */
    public fail(message: string, isOptional: boolean = false): Scenario {
        if (this._nextLabel) {
            message = this._nextLabel;
            this._nextLabel = null;
        }
        let line: FailLine = new FailLine(message);
        if (isOptional) {
            line.color = ConsoleColor.FgMagenta;
            line.textSuffix = '(Optional)';
        }
        this._log.push(line);
        if (!isOptional) {
            this._failures.push(message);
        }
        return this;
    }

    /**
     * Flip the next assertion
     */
    public not(): Scenario {
        this._flipAssertion = true;
        return this;
    }

    /**
    * Consider the next set of tests optional, until the next selector
    */
    public optional(): Scenario {
        this._optionalAssertion = true;
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
        if (!this.hasExecuted()) {
            this._url = url;
            this._isMock = false;
            this._executeWhenReady();
        }
        return this;
    }

    /**
     * Set the callback for the assertions to run after the request has a response
     */
    //public then = this.assertions;  // this was causing problems because Node thought it was a real promise
    public next = this.assertions;
    public assertions(a: Function | string, b?: Function): Scenario {
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
                this._executeWhenReady();
            }, 0);
        }
        else {
            throw new Error('Scenario already executed.');
        }
        return this;
    }

    /**
     * Skip this scenario completely and mark it done
     */
    public skip(message?: string): Scenario {
        if (this.hasExecuted()) {
            throw new Error(`Can't skip Scenario since it already started executing.`);
        }
        message = "Skipped" + (message ? ': ' + message : '');
        this._timeScenarioExecuted = Date.now();
        this._log.push(new CommentLine(message));
        this._timeScenarioFinished = Date.now();
        this._notifySuiteOnProgress(this);
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
    public execute(): Scenario {
        if (!this.hasExecuted() && this._url !== null) {
            this._timeScenarioExecuted = Date.now();
            this._notifySuiteOnProgress(this);
            this.subheading(this.title);
            // If we waited first
            if (this._waitToExecute) {
                this._log.push(new CommentLine(`Waited ${this.executionDuration}ms`));
            }
            // Execute it
            this._isMock ?
                this._executeMock() : 
                this._executeRequest();
        }
        return this;
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
     * Override the next test's default pass/fail message with something custom and more human readable
     *
     * @param {string} message
     * @returns {Scenario}
     */
    public label(message: string): Scenario {
        this._nextLabel = message;
        return this;
    }

    /**
     * Get the log buffer
     *
     * @returns {Array<ConsoleLine>}
     */
    public getLog(): Array<iLogLine> {
        return this._log;
    }

    public catch = this.error;
    public error(callback: Function): Scenario {
        this._onReject = callback;
        return this;
    }

    public success(callback: Function): Scenario {
        this._onResolve = callback;
        return this;
    }

    public finally(callback: Function): Scenario {
        this._onFinally = callback;
        return this;
    }

    /**
     * Get the url
     */
    public getUrl(): string | null {
        return this._url;
    }

    /**
     * URL after redirects
     */
    public getFinalUrl(): string | null {
        return this._finalUrl;
    }

    /**
     * We ready to pull the trigger on this one?
     */
    public canExecute(): boolean {
        return (
            !this.hasExecuted() &&
            this._url !== null &&
            this._thens.length > 0
        );
    }

    /**
     * Has this scenario already been executed?
     */
    public hasExecuted(): boolean {
        return (this._timeScenarioExecuted !== null);
    }

    /**
     * Did this scenario finish executing?
     */
    public hasFinished(): boolean {
        return (
            this.hasExecuted() &&
            this._timeScenarioFinished !== null
        );
    }

    /**
     * Retrieve the options that itialized the request in this scenaior
     */
    public getRequestOptions(): any {
        return this._options;
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
     * Add a delay callback into the chain that waits for this number of milliseconds
     * 
     * @param millis 
     */
    public pause(millis: number): Scenario {
        this.next(() => {
            return new Promise((resolve) => {
                setTimeout(() => {
                    this.echo('Paused ' + millis + ' milliseconds');
                    resolve();
                }, millis);
            });
        });
        return this;
    }

    /**
     * Clear out any previous settings
     */
    protected _reset(): Scenario {
        this._flipAssertion = false;
        this._optionalAssertion = false;
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
     * 
     * @param r 
     */
    protected _processResponse(r: NormalizedResponse) {
        const scenario: Scenario = this;
        const response: iResponse = createResponse(this, r);
        const context: AssertionContext = new AssertionContext(scenario, response);
        this._timeRequestLoaded = Date.now();
        this.pass('Loaded ' + response.typeName + ' ' + this._url);
        let lastReturnValue: any = null;
        // Execute all the assertion callbacks one by one
        Bluebird.mapSeries(scenario._thens, (_then, index) => {
            const comment: string | null = scenario._thensMessage[index];
            comment !== null && this.comment(comment)
            context.result = lastReturnValue;
            lastReturnValue = _then.apply(context, [response, context]);
            return lastReturnValue;
        }).then(() => {
            scenario._markScenarioCompleted();
        }).catch((err) => {
            scenario._markScenarioCompleted(err);
        });
    }

    /**
     * 
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
        if (this.hasExecuted()) {
            throw new Error('Scenario was already executed. Can not change type.');
        }
        this._options = opts;
        this._responseType = type;
        return this;
    }

    private _executeImageRequest() {
        const scenario: Scenario = this;
        probeImage(this._options.uri, this._options)
            .then(result => {
                const response: NormalizedResponse = NormalizedResponse.fromProbeImage(
                    result,
                    scenario._getCookies()
                );
                scenario._finalUrl = scenario.getUrl();
                scenario._processResponse(response);
            })
            .catch(ex => {
                scenario.fail('Failed to load image ' + scenario._url);
                scenario._markScenarioCompleted('Failed to load image');
            });
    }

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
            .catch((e) => {
                scenario.fail('Failed to load ' + scenario._url);
                scenario.comment(e);
                scenario._markScenarioCompleted();
            });
    }

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
        request(this._options, function (error: string, response: any, body: string) {
            if (!error) {
                scenario._processResponse(
                    NormalizedResponse.fromRequest(
                        response,
                        body,
                        scenario._getCookies()
                    )
                );
            }
            else {
                scenario.comment(error);
                scenario._markScenarioCompleted(`Failed to load ${scenario._url}`);
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
            else if (this._responseType == ResponseType.browser) {
                this._executeBrowserRequest();
            }
            else {
                this._executeDefaultRequest();
            }
        }
    }

    /**
     * 
     */
    protected _executeMock() {
        if (!this._timeRequestStarted && this._url !== null) {
            const scenario: Scenario = this;
            this._timeRequestStarted = Date.now();
            NormalizedResponse.fromLocalFile(this._url)
                .then((mock: NormalizedResponse) => {
                    scenario._processResponse(mock);
                }).catch(function () {
                    scenario._markScenarioCompleted(`Failed to load page ${scenario._url}`);
                });
        }
    }

    /**
     * Execute now if we are able to do so
     */
    protected _executeWhenReady() {
        if (!this._waitToExecute && this.canExecute()) {
            this.execute();
        }
    }

    /**
     * Mark this scenario as completed
     *
     * @returns {Scenario}
     */
    protected _markScenarioCompleted(err?: string): Scenario {
        // Only run this once
        if (!this.hasFinished()) {
            this._timeScenarioFinished = Date.now();
            this._log.push(new CommentLine(`Took ${this.executionDuration}ms`));
            // Resolve or reject, like scenario is a promise
            if (typeof err !== 'string') {
                this._onResolve(this)
            }
            else {
                this.fail(err);
                this._onReject(err);
            }
            // Finally
            this._onFinally(this);
            this._notifySuiteOnProgress(this);
        }
        return this;
    }

}
