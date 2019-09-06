import { ResponseType, LogItemType, ScenarioStatusEvent } from "./enums";
import { iLogItem, iResponse, iScenario, iSuite, BrowserOptions } from './interfaces';
import * as puppeteer from "puppeteer-core";
import { BrowserControl, iBrowserControlResponse } from "./browsercontrol";
import * as r from "request";
import { createResponse } from './responsefactory';
import { AssertionContext } from './assertioncontext';
import { AssertionResult, AssertionPass, AssertionFail, AssertionFailWarning } from './logging/assertionresult';
import { HttpResponse } from './httpresponse';
import { ResourceResponse } from './resourceresponse';
import { LogScenarioSubHeading, LogScenarioHeading } from './logging/heading';
import { LogComment } from './logging/comment';
import { LogCollection } from './logging/logcollection';
import { Assertion } from './assertion';

const request = require('request');
const probeImage = require('probe-image-size');

/**
 * A scenario contains tests that run against one request
 */
export class Scenario implements iScenario {

    public readonly suite: iSuite;

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
        return this._log.items.some((item: iLogItem) => {
            return (
                item.type == LogItemType.Result &&
                item.failed && !item.isOptional
            );
        });
    }

    /**
     * Did all assertions in this scenario pass? This also requires that the scenario has completed
     */
    public get hasPassed(): boolean {
        return (this.hasFinished && !this.hasFailed);
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
    protected _log: LogCollection = new LogCollection();
    protected _subscribers: Function[] = [];
    protected _nextCallbacks: Function[] = [];
    protected _nextMessages: Array<string | null> = [];
    protected _beforeCallbacks: Function[] = [];
    protected _afterCallbacks: Function[] = [];
    protected _finallyCallbacks: Function[] = [];
    protected _errorCallbacks: Function[] = [];
    protected _failureCallbacks: Function[] = [];
    protected _successCallbacks: Function[] = [];
    protected _onCompletedCallback: Function;
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
    protected _browserControl: BrowserControl | null = null;
    protected _isMock: boolean = false;
    protected _response: iResponse;
    protected _defaultBrowserOptions: BrowserOptions = {
        headless: true,
        recordConsole: true,
        outputConsole: false,
    };
    protected _defaultRequestOptions: any = {
        method: 'GET',
        headers: {}
    };

    public static create(suite: iSuite, title: string, type: ResponseType, opts: any, onCompletedCallback: Function): Scenario {
        return new Scenario(suite, title, onCompletedCallback)
            .setResponseType(type, opts);
    }

    private constructor(suite: iSuite, title: string, onCompletedCallback: Function) {
        this.suite = suite;
        this._cookieJar = new request.jar();
        this._options = this._defaultRequestOptions;
        this._title = title;
        this._onCompletedCallback = onCompletedCallback;
        this._response = new ResourceResponse(this);
    }

    /**
     * Get log of all assetions, comments, etc. from this scenario
     */
    public async getLog(): Promise<iLogItem[]> {
        return this._log.items;
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
     * Add a neutral line to the output
     */
    public comment(message: string): Scenario {
        return this._pushToLog(new LogComment(message));
    }

    /**
     * Push in a new passing assertion
     */
    public result(result: AssertionResult): Scenario {
        return this._pushToLog(result);
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
        await this._fireBefore();
        this._publish(ScenarioStatusEvent.executionProgress);
        this.comment(`Skipped${(message ? ': ' + message : '')}`);
        await this._fireAfter();
        await this._fireFinally();
        return this;
    }

    public async cancel(): Promise<Scenario> {
        if (this.hasExecuted) {
            throw new Error(`Can't cancel Scenario since it already started executing.`);
        }
        await this._fireBefore();
        await this._fireAfter();
        await this._fireFinally();
        return this;
    }

    /**
     * Get the browser object for a browser request
     */
    public getBrowserControl(): BrowserControl {
        this._browserControl = (this._browserControl !== null) ? this._browserControl : new BrowserControl();
        return this._browserControl;
    }

    /**
     * Execute this scenario
     */
    public async execute(): Promise<Scenario> {
        if (!this.hasExecuted && this._url !== null) {
            await this._fireBefore();
            this._pushToLog(
                new LogScenarioHeading(this.title)
            );
            // If we waited first
            if (this._waitToExecute) {
                this.comment(`Waited ${this.executionDuration}ms`);
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
        if (this.hasFinished) {
            throw new Error('Can not add error callbacks after execution has finished.');
        }
        this._errorCallbacks.push(callback);
        return this;
    }

    /**
     * Callback after scenario completes if successful
     * 
     * @param callback 
     */
    public success(callback: Function): Scenario {
        if (this.hasFinished) {
            throw new Error('Can not add success callbacks after execution has finished.');
        }
        this._successCallbacks.push(callback);
        return this;
    }

    /**
     * Callback after scenario completes if failed
     * 
     * @param callback 
     */
    public failure(callback: Function): Scenario {
        if (this.hasFinished) {
            throw new Error('Can not add failure callbacks after execution has finished.');
        }
        this._failureCallbacks.push(callback);
        return this;
    }

    /**
     * callback just before the scenario starts to execute
     * 
     * @param callback 
     */
    public before(callback: Function): Scenario {
        if (this.hasExecuted) {
            throw new Error('Can not add before callbacks after execution has started.');
        }
        this._beforeCallbacks.push(callback);
        return this;
    }

    /**
     * callback just after the scenario completes
     */
    public after(callback: Function): Scenario {
        if (this.hasFinished) {
            throw new Error('Can not add after callbacks after execution has finished.');
        }
        this._afterCallbacks.push(callback);
        return this;
    }

    /**
     * callback at the very end, whether pass or fail
     * 
     * @param callback 
     */
    public finally(callback: Function): Scenario {
        if (this.hasFinished) {
            throw new Error('Can not add failure callbacks after execution has finished.');
        }
        this._finallyCallbacks.push(callback);
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
    protected _processResponse(httpResponse: HttpResponse) {
        this._response.init(httpResponse);
        const scenario: Scenario = this;
        this._timeRequestLoaded = Date.now();
        this.result(new AssertionPass('Loaded ' + this._response.responseTypeName + ' ' + this._url));
        let lastReturnValue: any = null;
        // Execute all the assertion callbacks one by one
        this._publish(ScenarioStatusEvent.executionProgress);
        Promise.mapSeries(scenario._nextCallbacks, (_then, index) => {
            const context: AssertionContext = new AssertionContext(scenario, this._response);
            const comment: string | null = scenario._nextMessages[index];
            if (comment !== null) {
                this._pushToLog(
                    new LogScenarioSubHeading(comment)
                );
            }
            context.result = lastReturnValue;
            // Run this next
            lastReturnValue = _then.apply(context, [context]);
            // Warn about any incomplete assertions
            context.incompleteAssertions.forEach((assertion: Assertion) => {
                this.result(new AssertionFailWarning(`Incomplete assertion: ${assertion.name}`, assertion));
            })
            // Don't continue until last value and all assertions resolve
            return Promise.all([
                lastReturnValue,
                context.assertionsResolved,
                context.subScenariosResolved
            ]).timeout(30000);
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
    public setResponseType(type: ResponseType, opts: any = {}): Scenario {
        if (this.hasExecuted) {
            throw new Error('Scenario was already executed. Can not change type.');
        }
        // Merge passed in opts with default opts
        opts = (() => {
            return (type == ResponseType.browser || type == ResponseType.extjs) ?
                { ...this._defaultBrowserOptions, ...opts } :
                { ...this._defaultRequestOptions, ...opts }
        })();
        this._options = opts;
        this._responseType = type;
        this._response = createResponse(this);
        return this;
    }

    /**
     * Start an image scenario
     */
    private _executeImageRequest() {
        const scenario: Scenario = this;
        probeImage(this._options.uri, this._options)
            .then(result => {
                const response: HttpResponse = HttpResponse.fromProbeImage(
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
        const browserControl: BrowserControl = this.getBrowserControl();
        browserControl
            .open(this._options)
            .then((next: iBrowserControlResponse) => {
                const puppeteerResponse: puppeteer.Response = next.response;
                if (puppeteerResponse !== null) {
                    scenario._finalUrl = puppeteerResponse.url();
                    scenario._processResponse(
                        HttpResponse.fromPuppeteer(
                            puppeteerResponse,
                            next.body,
                            next.cookies
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
                    HttpResponse.fromRequest(
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
            HttpResponse.fromLocalFile(this._url)
                .then((mock: HttpResponse) => {
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
            this.comment(`Took ${this.executionDuration}ms`);
            // Scenario completed without an error (could be pass or fail)
            if (errorMessage === null) {
                this.hasPassed ?
                    await this._fireSuccess() :
                    await this._fireFailure();
            }
            // Scenario compelted with an error
            else {
                this.result(
                    new AssertionFail(errorMessage, errorDetails)
                );
                await this._fireError(errorDetails || errorMessage);
            }
            // Finally
            await this._fireFinally();
            // Close the browser window
            if (this._browserControl !== null) {
                //this._browserControl.close();
            }
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
            Promise.mapSeries(scenario._beforeCallbacks, (_then, index) => {
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
            Promise.mapSeries(this._afterCallbacks, (_then, index) => {
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
            Promise.mapSeries(this._successCallbacks, (_then, index) => {
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
            Promise.mapSeries(this._failureCallbacks, (_then, index) => {
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
            Promise.mapSeries(this._errorCallbacks, (_then) => {
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
            Promise.mapSeries(this._finallyCallbacks, _then => {
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
        // If it hasn't already finished
        if (!this.hasFinished) {
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
            throw new Error('Scenario already finished.');
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

    protected _pushToLog(logItem: iLogItem): Scenario {
        this._log.add(logItem);
        return this;
    }

}
