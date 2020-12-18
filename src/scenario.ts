import {
  ResponseType,
  ScenarioStatusEvent,
  ScenarioDisposition,
} from "./enums";
import {
  iAssertion,
  iAssertionContext,
  iLogItem,
  iResponse,
  iScenario,
  iSuite,
  iNextCallback,
  KeyValue,
  ResponsePipe,
  ScenarioCallback,
  ScenarioStatusCallback,
  ScenarioCallbackAndMessage,
  ResponsePipeCallbackAndMessage,
  iValue,
  HttpResponseOptions,
  WebhookServer,
} from "./interfaces";
import * as puppeteer from "puppeteer-core";
import {
  BrowserControl,
  iBrowserControlResponse,
} from "./puppeteer/browsercontrol";
import { createResponse } from "./responsefactory";
import {
  AssertionResult,
  AssertionPass,
  AssertionFail,
  AssertionFailWarning,
  AssertionFailOptional,
} from "./logging/assertionresult";
import { HttpResponse } from "./httpresponse";
import { ResourceResponse } from "./resourceresponse";
import { LogScenarioSubHeading, LogScenarioHeading } from "./logging/heading";
import { LogComment } from "./logging/comment";
import { LogCollection } from "./logging/logcollection";
import {
  HttpRequestOptions,
  HttpProxy,
  HttpAuth,
  HttpRequest,
  HttpTimeout,
  HttpMethodVerb,
  HttpMethodVerbAllowedValues,
  BrowserOptions,
} from "./httprequest";
import { FlagpoleExecution } from "./flagpoleexecution";
import { toType, asyncForEach, runAsync } from "./util";
import { AssertionContext } from "./assertioncontext";
import * as bluebird from "bluebird";
import { Browser } from "puppeteer-core";
import minikin, { Response, Server } from "minikin";
import { ServerOptions } from "https";
import { JsonDoc } from "./json/jpath";
import { wrapAsValue } from "./helpers";
import {
  beforeScenarioExecuted,
  afterScenarioReady,
  beforeScenarioFinished,
  afterScenarioExecuted,
  beforeScenarioRequestStarted,
} from "./decorators";

enum ScenarioRequestType {
  httpRequest = "httpRequest",
  localFile = "localFile",
  manual = "manual",
  webhook = "webhook",
}

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
      throw "Can not change the scenario's title after execution has started.";
    }
    this._title = newTitle;
  }

  /**
   * Length of time in milliseconds from initialization to completion
   */
  public get totalDuration(): number {
    return this._timeScenarioFinished !== null
      ? this._timeScenarioFinished - this._timeScenarioInitialized
      : Date.now() - this._timeScenarioInitialized;
  }

  /**
   * Length of time in milliseconds from start of execution to completion
   */
  public get executionDuration(): number | null {
    return this._timeScenarioFinished !== null &&
      this._timeScenarioExecuted !== null
      ? this._timeScenarioFinished - this._timeScenarioExecuted
      : null;
  }

  /**
   * Length of time in milliseconds from request start to response complete
   */
  public get requestDuration(): number | null {
    return this._timeRequestStarted !== null && this._timeRequestLoaded !== null
      ? this._timeRequestLoaded - this._timeRequestStarted
      : null;
  }

  /**
   * Did any assertions in this scenario fail?
   */
  public get hasFailed(): boolean {
    return this._log.items.some((item: iLogItem) => {
      return item.type == "resultFailure";
    });
  }

  /**
   * Did all assertions in this scenario pass? This also requires that the scenario has completed
   */
  public get hasPassed(): boolean {
    return this.hasFinished && !this.hasFailed;
  }

  public get hasAborted(): boolean {
    return this._disposition == ScenarioDisposition.aborted;
  }

  public get hasBeenCancelled(): boolean {
    return this._disposition == ScenarioDisposition.cancelled;
  }

  public get hasBeenSkipped(): boolean {
    return this._disposition == ScenarioDisposition.skipped;
  }

  public get isPending(): boolean {
    return this._disposition == ScenarioDisposition.pending;
  }

  public get isExecuting(): boolean {
    return this._disposition == ScenarioDisposition.excuting;
  }

  public get isCompleted(): boolean {
    return this._disposition == ScenarioDisposition.completed;
  }

  public get disposition(): ScenarioDisposition {
    return this._disposition;
  }

  /**
   * We ready to pull the trigger on this one?
   */
  public get isReadyToExecute(): boolean {
    return (
      !this.hasExecuted &&
      !this.isImplicitWait &&
      !this.isExplicitWait &&
      this.hasNextCallbacks
    );
  }

  /**
   * Has this scenario already been executed?
   */
  public get hasExecuted(): boolean {
    return this._timeScenarioExecuted !== null;
  }

  /**
   * Did this scenario finish executing?
   */
  public get hasFinished(): boolean {
    return this.hasExecuted && this._timeScenarioFinished !== null;
  }

  public get browserControl(): BrowserControl | null {
    if (this._response.isBrowser && this._browserControl === null) {
      this._browserControl = new BrowserControl();
    }
    return this._browserControl;
  }

  public get browser(): Browser | null {
    return this._browserControl?.browser || null;
  }

  /**
   * We will implicitly wait if the URL is not defined or has params in it
   */
  private get isImplicitWait(): boolean {
    if (this._requestType == ScenarioRequestType.httpRequest) {
      return this.url === null || /{[A-Za-z0-9_ -]+}/.test(this.url);
    } else if (
      this._requestType == ScenarioRequestType.manual ||
      this._requestType == ScenarioRequestType.webhook
    ) {
      return !this._mockResponseOptions;
    }
    return false;
  }

  private get isExplicitWait(): boolean {
    return this._waitToExecute;
  }

  private get hasNextCallbacks(): boolean {
    return this._nextCallbacks.length > 0;
  }

  public get hasRequestStarted(): boolean {
    return this._timeRequestStarted !== null;
  }

  /**
   * Get the url
   */
  public get url(): string | null {
    return this._request.uri;
  }

  public set url(value: string | null) {
    if (this.hasRequestStarted) {
      throw "Can not change the URL after the request has already started.";
    }
    if (value !== null) {
      // If the HTTP method was part of open
      const match = /([A-Z]+) (.*)/.exec(value);
      if (match !== null) {
        const verb: string = match[1].toLowerCase();
        if (HttpMethodVerbAllowedValues.includes(verb)) {
          this.setMethod(<HttpMethodVerb>verb);
        }
        value = match[2];
      }
      // If the URL had parameters in it, implicitly wait for execute parameters
      if (/{[A-Za-z0-9_ -]+}/.test(value)) {
        this.wait();
      }
    }
    this._request.uri = value;
  }

  /**
   * URL after redirects
   */
  public get finalUrl(): string | null {
    return this._finalUrl;
  }

  /**
   * Count the redirects
   */
  public get redirectCount(): number {
    return this._redirectChain.length;
  }

  /**
   * Return every URL reidrect
   */
  public get redirectChain(): string[] {
    return this._redirectChain;
  }

  /**
   * Retrieve the options that itialized the request in this scenario
   */
  public get request(): HttpRequest {
    return this._request;
  }

  protected _title: string;
  protected _log: LogCollection = new LogCollection();
  protected _subscribers: ScenarioStatusCallback[] = [];
  protected _nextCallbacks: iNextCallback[] = [];
  protected _nextMessages: Array<string | null> = [];
  protected _beforeCallbacks: ScenarioCallbackAndMessage[] = [];
  protected _afterCallbacks: ScenarioCallbackAndMessage[] = [];
  protected _finallyCallbacks: ScenarioCallbackAndMessage[] = [];
  protected _failureCallbacks: ScenarioCallbackAndMessage[] = [];
  protected _successCallbacks: ScenarioCallbackAndMessage[] = [];
  protected _pipeCallbacks: ResponsePipeCallbackAndMessage[] = [];
  protected _timeScenarioInitialized: number = Date.now();
  protected _timeScenarioExecuted: number | null = null;
  protected _timeRequestStarted: number | null = null;
  protected _timeRequestLoaded: number | null = null;
  protected _timeScenarioFinished: number | null = null;
  protected _requestType: ScenarioRequestType = ScenarioRequestType.httpRequest;
  protected _responseType: ResponseType = "html";
  protected _redirectChain: string[] = [];
  protected _finalUrl: string | null = null;
  protected _waitToExecute: boolean = false;
  protected _waitTime: number = 0;
  protected _flipAssertion: boolean = false;
  protected _ignoreAssertion: boolean = false;
  protected _request: HttpRequest;
  protected _mockResponseOptions: HttpResponseOptions | null = null;
  protected _browserControl: BrowserControl | null = null;
  protected _response: iResponse;
  protected _defaultBrowserOptions: BrowserOptions = {
    headless: true,
    recordConsole: true,
    outputConsole: false,
  };
  protected _defaultRequestOptions: HttpRequestOptions = {
    method: "get",
  };
  protected _aliasedData: any = {};
  protected _requestPromise: Promise<iScenario>;
  protected _requestResolve: Function = () => {};
  protected _finishedPromise: Promise<iScenario>;
  protected _finishedResolve: Function = () => {};
  protected _disposition: ScenarioDisposition = ScenarioDisposition.pending;
  protected _webhookPromise: Promise<WebhookServer>;
  protected _webhookResolver: Function = () => {};

  public static create(
    suite: iSuite,
    title: string,
    type: ResponseType,
    opts: any
  ): iScenario {
    return new Scenario(suite, title).setResponseType(type, opts);
  }

  protected constructor(suite: iSuite, title: string) {
    this.suite = suite;
    this._request = new HttpRequest(this._defaultRequestOptions);
    this._title = title;
    this._response = new ResourceResponse(this);
    this._requestPromise = new Promise((resolve) => {
      this._requestResolve = resolve;
    });
    this._finishedPromise = new Promise((resolve) => {
      this._finishedResolve = resolve;
    });
    this._webhookPromise = new Promise((resolve) => {
      this._webhookResolver = resolve;
    });
  }

  protected _getArray(key: string): any[] {
    const type = toType(this._aliasedData[key]);
    if (type == "undefined") {
      this._aliasedData[key] = [];
    } else if (type !== "array") {
      throw Error(
        `${key} was of type ${type} and not an array. Can only push into an array.`
      );
    }
    return this._aliasedData[key];
  }

  public push(key: string, value: any): iScenario {
    this._getArray(key).push(value);
    return this;
  }

  public set(aliasName: string, value: any): iScenario {
    this._aliasedData[aliasName] = value;
    return this;
  }

  public get<T = any>(aliasName: string): T {
    return this._aliasedData[aliasName];
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
  public subscribe(callback: ScenarioStatusCallback): iScenario {
    this._subscribers.push(callback);
    return this;
  }

  /**
   * Set body to submit as JSON object
   *
   * @param jsonObject
   */
  public setJsonBody(json: KeyValue): iScenario {
    this.request.setJsonData(json);
    return this;
  }

  /**
   * Set body to submit as raw string
   */
  public setRawBody(str: string): iScenario {
    this._request.data = str;
    return this;
  }

  /**
   * Make sure the web page has valid SSL certificate
   */
  public verifyCert(verify: boolean): iScenario {
    this._request.verifyCert = verify;
    return this;
  }

  public setProxy(proxy: HttpProxy): iScenario {
    this._request.proxy = proxy;
    return this;
  }

  /**
   * Set the timeout for how long the request should wait for a response
   */
  public setTimeout(n: number): iScenario;
  public setTimeout(timeouts: HttpTimeout): iScenario;
  public setTimeout(timeout: HttpTimeout | number): iScenario {
    this._request.timeout =
      typeof timeout === "number"
        ? {
            open: timeout,
          }
        : timeout;
    return this;
  }

  /**
   * Set the form options that will be submitted with the request
   *
   * @param form
   */
  public setFormData(form: FormData): iScenario;
  public setFormData(form: KeyValue, isMultipart?: boolean): iScenario;
  public setFormData(
    form: KeyValue | FormData,
    isMultipart?: boolean
  ): iScenario {
    this._request.setFormData(form, isMultipart);
    return this;
  }

  /**
   * Maximum number of redirects to allow
   *
   * @param n
   */
  public setMaxRedirects(n: number): iScenario {
    this._request.maxRedirects = n;
    return this;
  }

  /**
   * Set the basic authentication headers to be sent with this request
   *
   * @param authorization
   */
  public setBasicAuth(auth: HttpAuth): iScenario {
    this._request.auth = auth;
    this._request.authType = "basic";
    return this;
  }

  /**
   * Set the digest authentication headers to be sent with this request
   *
   * @param authorization
   */
  public setDigestAuth(auth: HttpAuth): iScenario {
    this._request.auth = auth;
    this._request.authType = "digest";
    return this;
  }

  /**
   * Set the authorization header with a bearer token
   *
   * @param {string} token
   */
  public setBearerToken(token: string): iScenario {
    this.setHeader("Authorization", `Bearer ${token}`);
    return this;
  }

  /**
   * Set a cookie
   *
   * @param key
   * @param value
   * @param opts
   */
  public setCookie(key: string, value: string): iScenario {
    this._request.setCookie(key, value);
    return this;
  }

  /**
   * Set the full list of headers to submit with this request
   *
   * @param headers
   */
  public setHeaders(headers: KeyValue): iScenario {
    this._request.headers = { ...this._request.headers, ...headers };
    return this;
  }

  /**
   * Set a single header key-value without overriding others
   *
   * @param {string} key
   * @param value
   */
  public setHeader(key: string, value: any): iScenario {
    this._request.setHeader(key, value);
    return this;
  }

  /**
   * Set the HTTP method of this request
   *
   * @param {string} method
   */
  public setMethod(method: HttpMethodVerb): iScenario {
    this._request.method = method;
    return this;
  }

  /**
   * Do not run this scenario until execute() is called
   *
   * @param bool
   */
  public wait(bool: boolean = true): iScenario {
    // Was waiting but not anymore
    if (this._waitToExecute && !bool) {
      this._waitTime = Date.now() - this._timeScenarioInitialized;
    }
    // Set waiting value
    this._waitToExecute = bool;
    return this;
  }

  public waitFor(thatScenario: iScenario): iScenario {
    if (this === thatScenario) {
      throw new Error("Scenario can't wait for itself");
    }
    this.wait();
    thatScenario.success(async () => {
      this.wait(false);
    });
    thatScenario.failure(async () => {
      this.cancel(
        `This scenario was pending completion of "${thatScenario.title}", but it failed.`
      );
    });
    return this;
  }

  /**
   * Add a neutral line to the output
   */
  public comment(input: any): iScenario {
    const type = toType(input);
    const message: string =
      type === "string"
        ? input
        : !!input?.isFlagpoleValue
        ? input.toString()
        : JSON.stringify(input, null, 2);
    return this._pushToLog(new LogComment(message));
  }

  /**
   * Push in a new passing assertion
   */
  public result(result: AssertionResult): iScenario {
    return this._pushToLog(result);
  }

  /**
   * Ignore assertions until further notice. This is created to prevent automatic assertions from firing.
   */
  public ignore(assertions: boolean | Function = true): iScenario {
    if (typeof assertions == "boolean") {
      this._ignoreAssertion = assertions;
    } else if (typeof assertions == "function") {
      this.ignore(true);
      assertions();
      this.ignore(false);
    }
    return this;
  }

  /**
   * Insert a next call back that waits this amount of time before continuing
   *
   * @param milliseconds
   */
  public pause(milliseconds: number): iScenario {
    this.next((context) => {
      context.comment(`Pause for ${milliseconds}ms`);
      return context.pause(milliseconds);
    });
    return this;
  }

  /**
   * Set the URL that this scenario will hit
   *
   * @param {string} url
   */
  public open(url: string, opts?: HttpRequestOptions): iScenario;
  public open(link: iValue, opts?: HttpRequestOptions): iScenario;
  public open(a: string | iValue, opts?: HttpRequestOptions): iScenario {
    if (this.hasExecuted) {
      throw `Can call open after scenario has executed`;
    }
    // Merge in options
    if (opts) {
      this._request.setOptions(opts);
    }
    this._requestType = ScenarioRequestType.httpRequest;
    // Handle overloading
    if (typeof a == "string") {
      // Passed in a string, so open it as url
      this.url = String(a);
    } else {
      // Passed in an iValue so get URL from that element
      runAsync(async () => {
        this.url = (await a.getUrl()).toString();
      });
    }
    return this;
  }

  /**
   * Set the callback for the assertions to run after the request has a response
   */
  public next(responseValues: { [key: string]: any }): iScenario;
  public next(message: string, callback: iNextCallback): iScenario;
  public next(callback: iNextCallback): iScenario;
  public next(...callbacks: iNextCallback[]): iScenario;
  public next(
    a: iNextCallback | iNextCallback[] | string | { [key: string]: any },
    b?: iNextCallback | { [key: string]: any }
  ): iScenario {
    if (Array.isArray(a)) {
      a.forEach((callback) => {
        this._next(callback, null, true);
      });
    } else {
      this._next(a, b, true);
    }
    return this;
  }

  /**
   * Insert this as the first next
   */
  public nextPrepend(message: string, callback: iNextCallback): iScenario;
  public nextPrepend(callback: iNextCallback): iScenario;
  public nextPrepend(a: iNextCallback | string, b?: iNextCallback): iScenario {
    return this._next(a, b, false);
  }

  /**
   * Skip this scenario completely and mark it done
   */
  @beforeScenarioExecuted
  public async skip(message?: string): Promise<iScenario> {
    await this._fireBefore();
    this._publish(ScenarioStatusEvent.executionProgress);
    this.comment(`Skipped ${message ? ": " + message : ""}`);
    await this._markScenarioCompleted(null, null, ScenarioDisposition.skipped);
    return this;
  }

  public async cancelOrAbort(message?: string): Promise<iScenario> {
    return this.hasExecuted ? this.abort(message) : this.cancel(message);
  }

  @afterScenarioExecuted
  @beforeScenarioFinished
  public async abort(message?: string): Promise<iScenario> {
    this._markScenarioCompleted(
      `Aborted ${message ? ": " + message : ""}`,
      null,
      ScenarioDisposition.aborted
    );
    return this;
  }

  @beforeScenarioExecuted
  public async cancel(message?: string): Promise<iScenario> {
    await this._fireBefore();
    this._publish(ScenarioStatusEvent.executionProgress);
    this._markScenarioCompleted(
      `Cancelled ${message ? ": " + message : ""}`,
      null,
      ScenarioDisposition.cancelled
    );
    return this;
  }

  /**
   * Prepare this scenario to execute
   */
  public async execute(): Promise<iScenario>;
  public async execute(params: {
    [key: string]: string | number;
  }): Promise<iScenario>;

  @beforeScenarioExecuted
  public async execute(pathParams?: {
    [key: string]: string | number;
  }): Promise<iScenario> {
    // Apply path parameters when the url was like /articles/{id}
    if (pathParams) {
      // Change the URL
      Object.keys(pathParams).forEach((key) => {
        this.url =
          this.url?.replace(`{${key}}`, String(pathParams[key])) || null;
      });
    }
    // Execute was called, so stop any explicit wait
    this.wait(false);
    return this;
  }

  /**
   * Do not call this directly. Only Suite Task Manager should call it.
   */
  @beforeScenarioExecuted
  @afterScenarioReady
  public async go() {
    // Do before callbacks
    await this._fireBefore();
    this._requestType == ScenarioRequestType.httpRequest
      ? this._executeHttpRequest()
      : this._requestType == ScenarioRequestType.localFile
      ? this._executeLocalRequest()
      : this._executeMock();
    this._publish(ScenarioStatusEvent.executionProgress);
    return this;
  }

  /**
   * Callback after scenario completes if successful
   *
   * @param callback
   */
  public success(callback: ScenarioCallback): iScenario;
  public success(message: string, callback: ScenarioCallback): iScenario;
  public success(...callbacks: ScenarioCallback[]): iScenario;
  public success(
    a: string | ScenarioCallback | ScenarioCallback[],
    b?: ScenarioCallback
  ): iScenario {
    return this._pushCallbacks("success", "_successCallbacks", a, b);
  }

  /**
   * Callback after scenario completes if failed
   *
   * @param callback
   */
  public failure(callback: ScenarioCallback): iScenario;
  public failure(message: string, callback: ScenarioCallback): iScenario;
  public failure(...callbacks: ScenarioCallback[]): iScenario;
  public failure(
    a: string | ScenarioCallback | ScenarioCallback[],
    b?: ScenarioCallback
  ): iScenario {
    return this._pushCallbacks("failure", "_failureCallbacks", a, b);
  }

  /**
   * Alter the response before we process assertions
   *
   * @param callback
   */
  public pipe(callback: ResponsePipe): iScenario;
  public pipe(...callbacks: ResponsePipe[]): iScenario;
  public pipe(message: string, callback: ResponsePipe): iScenario;
  public pipe(
    a: string | ResponsePipe | ResponsePipe[],
    b?: ResponsePipe
  ): iScenario {
    return this._pushCallbacks("pipe", "_pipeCallbacks", a, b);
  }

  /**
   * callback just before the scenario starts to execute
   *
   * @param callback
   */
  public before(callback: ScenarioCallback): iScenario;
  public before(...callbacks: ScenarioCallback[]): iScenario;
  public before(message: string, callback: ScenarioCallback): iScenario;
  public before(
    a: string | ScenarioCallback | ScenarioCallback[],
    b?: ScenarioCallback
  ): iScenario {
    return this._pushCallbacks("before", "_beforeCallbacks", a, b);
  }

  /**
   * callback just after the scenario completes
   */
  public after(callback: ScenarioCallback): iScenario;
  public after(...callbacks: ScenarioCallback[]): iScenario;
  public after(message: string, callback: ScenarioCallback): iScenario;
  public after(
    a: string | ScenarioCallback | ScenarioCallback[],
    b?: ScenarioCallback
  ): iScenario {
    return this._pushCallbacks("after", "_afterCallbacks", a, b);
  }

  /**
   * callback at the very end, whether pass or fail
   *
   * @param callback
   */
  public finally(callback: ScenarioCallback): iScenario;
  public finally(...callbacks: ScenarioCallback[]): iScenario;
  public finally(message: string, callback: ScenarioCallback): iScenario;
  public finally(
    a: string | ScenarioCallback | ScenarioCallback[],
    b?: ScenarioCallback
  ): iScenario {
    return this._pushCallbacks("finally", "_finallyCallbacks", a, b);
  }

  public mock(opts: HttpResponseOptions | string = ""): iScenario {
    this._requestType = ScenarioRequestType.manual;
    this._mockResponseOptions = typeof opts == "string" ? { body: opts } : opts;
    return this;
  }

  public local(localPath: string): iScenario {
    this._requestType = ScenarioRequestType.localFile;
    this.url = localPath;
    return this;
  }

  public webhook(
    a?: string | number | ServerOptions,
    b?: number | ServerOptions,
    c?: ServerOptions
  ): iScenario {
    const route = typeof a == "string" ? a : "*";
    const port =
      typeof a == "number" ? a : typeof b == "number" ? b : undefined;
    const opts = (() => {
      if (c) {
        return c;
      }
      if (typeof b !== "number") {
        return b;
      }
      if (typeof a !== "number" && typeof a !== "string") {
        return a;
      }
      return undefined;
    })();
    this._requestType = ScenarioRequestType.webhook;
    runAsync(async () => {
      const server = await minikin.server(port, opts);
      this._webhookResolver({
        port: server.port,
        opts: opts,
        server: server,
      });
      server.route(route, (req) => {
        this.url = req.url;
        this._mockResponseOptions = {
          body: req.body,
          headers: req.headers,
          cookies: req.cookies,
          trailers: req.trailers,
          url: req.url,
          method: req.method,
        };
        runAsync(() => {
          server.close();
        }, 100);
        return Response.fromString("OK");
      });
    });
    return this;
  }

  /**
   * Get reference to server
   */
  public server(): Promise<WebhookServer> {
    return this._webhookPromise;
  }

  /**
   * Set the type of response this scenario is and the options
   *
   * @param type
   * @param opts
   */
  @beforeScenarioExecuted
  public setResponseType(type: ResponseType, opts: any = {}): iScenario {
    // Merge passed in opts with default opts
    this._responseType = type;
    if (["browser", "extjs"].includes(type)) {
      // Overrides from command line
      const overrides: any = {};
      if (FlagpoleExecution.global.headless !== undefined) {
        overrides.headless = FlagpoleExecution.global.headless;
      }
      // Set browser options
      this._request.setOptions({
        browserOptions: {
          ...this._defaultBrowserOptions, // Flagpole defaults
          ...opts, // What was in the code
          ...overrides, // What was in the command line
        },
      });
    } else {
      this._request
        .setOptions({
          ...this._defaultRequestOptions,
          ...opts,
        })
        .setOptions({
          type:
            this._responseType === "json"
              ? "json"
              : this._responseType === "image"
              ? "image"
              : "generic",
        });
    }
    this._response = createResponse(this);
    return this;
  }

  public waitForFinished(): Promise<iScenario> {
    return this._finishedPromise;
  }

  public waitForResponse(): Promise<iScenario> {
    return this._requestPromise;
  }

  public promise(): Promise<iScenario> {
    return new Promise((resolve, reject) => {
      this.success(resolve);
      this.failure(reject);
    });
  }

  public buildUrl(): URL {
    const path = this.url || "/";
    // If there was no base URL, skip this
    if (this.suite.baseUrl === null) {
      return new URL(path);
    }
    // If it is already an absolute URL, don't apply the base
    else if (/^https?:\/\//.test(path) || /^data:/.test(path)) {
      return new URL(path);
    }
    // If the path starts in // then it has domain, just inherit the protocol from the base
    else if (/^\/\//.test(path)) {
      return new URL(`${this.suite.baseUrl.protocol}//${path}`);
    }
    // if it starts with / then it's absolute
    else if (/^\//.test(path)) {
      return new URL(
        `${this.suite.baseUrl.protocol}//${this.suite.baseUrl.host}${path}`
      );
    }
    return new URL(path, this.suite.baseUrl.href);
  }

  private _pushCallbacks(
    name: string,
    callbacksName: string,
    a:
      | string
      | ScenarioCallback
      | ScenarioCallback[]
      | ResponsePipe
      | ResponsePipe[],
    b?: ScenarioCallback | ResponsePipe
  ): iScenario {
    if (this.hasFinished) {
      throw `Can not add ${name} callbacks after execution has finished.`;
    }
    if (Array.isArray(a)) {
      a.forEach((callback: any) => {
        this[callbacksName].push({
          message: "",
          callback: callback,
        });
      });
    } else {
      const { message, callback } = this._getOverloads(a, b);
      this[callbacksName].push({
        callback: callback,
        message: message,
      });
    }
    return this;
  }

  /**
   * Clear out any previous settings
   */
  protected _reset(): iScenario {
    this._flipAssertion = false;
    return this;
  }

  /**
   * Send responses through the pipeline before we make assertions
   *
   * @param httpResponse
   */
  protected async _pipeResponses(
    httpResponse: HttpResponse
  ): Promise<HttpResponse> {
    await bluebird.mapSeries(this._pipeCallbacks, async (cb) => {
      cb.message && this.comment(cb.message);
      const result = await cb.callback(httpResponse);
      if (result) {
        httpResponse = result;
      }
    });
    return httpResponse;
  }

  /**
   * Handle the normalized response once the request comes back
   * This will loop through each next
   */
  protected async _processResponse(httpResponse: HttpResponse) {
    httpResponse = await this._pipeResponses(httpResponse);
    this._response.init(httpResponse);
    this._timeRequestLoaded = Date.now();
    this._requestResolve(this);
    this.result(
      new AssertionPass(
        `Loaded ${this._response.responseTypeName} ${
          this.url ? this.url : "[manual input]"
        }`
      )
    );
    let lastReturnValue: any = null;
    // Execute all the assertion callbacks one by one
    this._publish(ScenarioStatusEvent.executionProgress);
    bluebird
      .mapSeries(this._nextCallbacks, (_then, index) => {
        const context: iAssertionContext = new AssertionContext(
          this,
          this._response
        );
        const comment: string | null = this._nextMessages[index];
        if (comment !== null) {
          this._pushToLog(new LogScenarioSubHeading(comment));
        }
        context.result = lastReturnValue;
        // Run this next
        lastReturnValue = _then.apply(context, [context]);
        // Warn about any incomplete assertions
        context.incompleteAssertions.forEach((assertion: iAssertion) => {
          this.result(
            new AssertionFailWarning(
              `Incomplete assertion: ${assertion.name}`,
              assertion
            )
          );
        });
        // Don't continue until last value and all assertions resolve
        return bluebird
          .all([
            lastReturnValue,
            context.assertionsResolved,
            context.subScenariosResolved,
          ])
          .timeout(30000);
      })
      .then(() => {
        this._markScenarioCompleted();
      })
      .catch(bluebird.TimeoutError, (e) => {
        this._markScenarioCompleted(
          "Timed out.",
          e.message,
          ScenarioDisposition.aborted
        );
      })
      .catch((err) => {
        this._markScenarioCompleted(err, null, ScenarioDisposition.aborted);
      });
    this._publish(ScenarioStatusEvent.executionProgress);
  }

  /**
   * Start a browser scenario
   */
  private _executeBrowserRequest() {
    if (!this.browserControl) {
      throw "Not a browser scenario";
    }
    const handleError = (message: string, e: any) => {
      setTimeout(() => {
        this._markScenarioCompleted(message, e, ScenarioDisposition.aborted);
      }, 1000);
    };
    this.browserControl
      .open(this._request)
      .then((next: iBrowserControlResponse) => {
        const puppeteerResponse: puppeteer.Response = next.response;
        if (puppeteerResponse !== null) {
          this._finalUrl = puppeteerResponse.url();
          // Loop through the redirects to populate our array
          puppeteerResponse
            .request()
            .redirectChain()
            .forEach((req) => {
              this._redirectChain.push(req.url());
            });
          // Handle errors
          this.browser?.on("disconnected", (e) =>
            handleError("Puppeteer instance unexpectedly closed.", e)
          );
          this.browserControl?.page?.on("close", (e) =>
            handleError("Puppeteer closed unexpectedly.", e)
          );
          this.browserControl?.page?.on("error", (e) =>
            handleError("Puppeteer got an unexpected error.", e)
          );
          this.browserControl?.page?.on("pageerror", (e) =>
            this._pushToLog(
              new AssertionFailOptional(
                "Puppeteer got an unexpected page error.",
                e
              )
            )
          );
          // Finishing processing the response
          this._processResponse(
            HttpResponse.fromPuppeteer(
              puppeteerResponse,
              next.body,
              next.cookies
            )
          );
        } else {
          this._markScenarioCompleted(
            `Failed to load ${this._request.uri}`,
            null,
            ScenarioDisposition.aborted
          );
        }
        return;
      })
      .catch((err) =>
        this._markScenarioCompleted(
          `Failed to load ${this._request.uri}`,
          err,
          ScenarioDisposition.aborted
        )
      );
  }

  /**
   * Start a regular request scenario
   */
  private _executeDefaultRequest() {
    this._request
      .fetch({
        redirect: (url: string) => {
          this._finalUrl = url;
          this._redirectChain.push(url);
        },
      })
      .then((response) => {
        this._processResponse(response);
      })
      .catch((err) => {
        this._markScenarioCompleted(
          `Failed to load ${this._request.uri}`,
          err,
          ScenarioDisposition.aborted
        );
      });
  }

  private _markRequestAsStarted() {
    this._timeRequestStarted = Date.now();
  }

  /**
   * Used by all request types to kick off the request
   */
  @beforeScenarioRequestStarted
  protected _executeHttpRequest() {
    if (this.url === null) {
      throw "Can not execute request with null URL.";
    }
    this.url = this.buildUrl().href;
    if (this._responseType == "headers") {
      this.setMethod("head");
    }
    this._markRequestAsStarted();
    this._finalUrl = this._request.uri;
    if (["extjs", "browser"].includes(this._responseType)) {
      this._executeBrowserRequest();
    } else {
      this._executeDefaultRequest();
    }
  }

  /**
   * Start a local file scenario
   */
  @beforeScenarioRequestStarted
  protected _executeLocalRequest() {
    if (this.url === null) {
      throw "Can not execute request with null URL.";
    }
    this._markRequestAsStarted();
    HttpResponse.fromLocalFile(this.url)
      .then((res: HttpResponse) => {
        this._processResponse(res);
      })
      .catch((err) => {
        this._markScenarioCompleted(
          `Failed to load local file ${this.url}`,
          err,
          ScenarioDisposition.aborted
        );
      });
  }

  /**
   * Start a mock scenario, which will load a local file
   */
  @beforeScenarioRequestStarted
  protected _executeMock() {
    if (this._mockResponseOptions === null) {
      throw "Can not execute a mock request with no mocked response.";
    }
    this._markRequestAsStarted();
    try {
      const response = HttpResponse.fromOpts(this._mockResponseOptions);
      this._processResponse(response);
    } catch (err) {
      this._markScenarioCompleted(
        `Failed to load page ${this.url}`,
        err,
        ScenarioDisposition.aborted
      );
    }
  }

  /**
   * Mark this scenario as completed
   *
   * @returns {Scenario}
   */
  protected async _markScenarioCompleted(
    message: string | null = null,
    details: string | null = null,
    disposition: ScenarioDisposition = ScenarioDisposition.completed
  ): Promise<iScenario> {
    // Only run this once
    if (!this.hasFinished) {
      this._disposition = disposition;
      if (disposition == ScenarioDisposition.cancelled) {
        this._publish(ScenarioStatusEvent.executionCancelled);
      } else if (disposition == ScenarioDisposition.skipped) {
        this._publish(ScenarioStatusEvent.executionSkipped);
        this.comment(message);
      } else if (disposition == ScenarioDisposition.aborted) {
        this._publish(ScenarioStatusEvent.executionAborted);
      }
      // Save time finished
      this._timeScenarioFinished = Date.now();
      // If execution started, show time took
      if (
        disposition == ScenarioDisposition.completed ||
        disposition == ScenarioDisposition.aborted
      ) {
        this.comment(`Took ${this.executionDuration}ms`);
      }
      // Scenario completed with an error
      if (
        disposition !== ScenarioDisposition.completed &&
        disposition !== ScenarioDisposition.skipped
      ) {
        this.result(new AssertionFail(message || disposition, details));
      }
      // After
      await this._fireAfter();
      // Success or failure
      this.hasPassed
        ? await this._fireSuccess()
        : await this._fireFailure(details || message || disposition);
      // Finally
      await this._fireFinally();
      // Close the browser window
      // Important! Don't close right away, some things may need to finish that were async
      runAsync(() => {
        this.browserControl?.close();
      }, 100);
    }
    return this;
  }

  private async _fireCallbacks(callbacks: ScenarioCallbackAndMessage[]) {
    await asyncForEach(callbacks, async (cb) => {
      cb.message && this._pushToLog(new LogComment(cb.message));
      return await cb.callback(this, this.suite);
    });
  }

  private _logScenarioHeading() {
    // Log the start of this scenario
    this._pushToLog(new LogScenarioHeading(this.title));
    // If we waited first
    if (this._waitTime > 0) {
      this.comment(`Waited ${this._waitTime}ms`);
    }
  }

  private _markExecutionAsStarted() {
    this._timeScenarioExecuted = Date.now();
  }

  /**
   * Run the before execution and wait for any response.
   */
  protected async _fireBefore(): Promise<any> {
    this._markExecutionAsStarted();
    await this._fireCallbacks(this._beforeCallbacks);
    this._publish(ScenarioStatusEvent.beforeExecute);
    this._logScenarioHeading();
    this._publish(ScenarioStatusEvent.executionStart);
  }

  /**
   * Run after execution and wait for any response
   */
  protected async _fireAfter(): Promise<void> {
    await this._fireCallbacks(this._afterCallbacks);
    this._publish(ScenarioStatusEvent.afterExecute);
  }

  protected async _fireSuccess(): Promise<void> {
    await this._fireCallbacks(this._successCallbacks);
    this._publish(ScenarioStatusEvent.finished);
  }

  protected async _fireFailure(errorMessage?: string): Promise<void> {
    await this._fireCallbacks(this._failureCallbacks);
    errorMessage && this._pushToLog(new LogComment(errorMessage));
    this._publish(ScenarioStatusEvent.finished);
  }

  protected async _fireFinally(): Promise<void> {
    await this._fireCallbacks(this._finallyCallbacks);
    this._publish(ScenarioStatusEvent.finished);
    this._finishedResolve(this);
  }

  protected _getOverloads(
    a: any,
    b?: any
  ): { message: string | null; callback: Function } {
    return {
      message: this._getMessageOverload(a),
      callback: this._getCallbackOverload(a, b),
    };
  }

  protected _expect(responseValues: { [key: string]: any }): iNextCallback {
    return async (context) => {
      const json = new JsonDoc(context.response.serialize(), true);
      const paths = Object.keys(responseValues);
      //console.log(json.root);
      await context.each(paths, async (path) => {
        const data = await json.search(path);
        const thisValue: iValue = wrapAsValue(context, data, path, data);
        const thatValue = responseValues[path];
        const type = toType(thatValue);
        if (type === "function") {
          const result = thatValue(thisValue.$);
          context.assert(thisValue.name, result).equals(true);
        } else if (type === "array") {
          context.assert(thisValue).in(thatValue);
        } else if (type === "regexp") {
          context.assert(thisValue).matches(thatValue);
        } else {
          context.assert(thisValue).equals(thatValue);
        }
      });
    };
  }

  protected _getCallbackOverload(a: any, b?: any): Function {
    const aType = toType(a);
    const bType = toType(b);
    if (bType == "function") {
      return b;
    } else if (aType == "function") {
      return a;
    } else if (bType == "asyncfunction") {
      return b;
    } else if (aType == "asyncfunction") {
      return a;
    } else if (bType == "object") {
      return this._expect(b);
    } else if (aType == "object") {
      return this._expect(a);
    } else {
      throw new Error("No callback provided.");
    }
  }

  protected _getMessageOverload(a: any): string | null {
    return (() => {
      if (typeof a == "string" && a.trim().length > 0) {
        return a;
      }
      return null;
    })();
  }

  @beforeScenarioFinished
  protected _next(
    a: iNextCallback | string | { [key: string]: any },
    b?: iNextCallback | { [key: string]: any } | null,
    append: boolean = true
  ): iScenario {
    const callback: iNextCallback = <iNextCallback>(
      this._getCallbackOverload(a, b)
    );
    const message: string | null = this._getMessageOverload(a);
    if (append) {
      this._nextCallbacks.push(callback);
      this._nextMessages.push(message);
    } else {
      this._nextCallbacks.unshift(callback);
      this._nextMessages.unshift(message);
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
    this._subscribers.forEach(async (callback) => {
      callback(scenario, statusEvent);
    });
  }

  protected _pushToLog(logItem: iLogItem): iScenario {
    this._log.add(logItem);
    return this;
  }
}
