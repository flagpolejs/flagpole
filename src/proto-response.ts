import { URL } from "url";
import { createEmptyResponse } from "./http/http-response";
import { HttpRequest } from "./http/http-request";
import { ValuePromise } from "./value-promise";
import { FindAllOptions, FindOptions } from "./interfaces/find-options";
import { PointerMove } from "./interfaces/pointer";
import { GestureOpts, GestureType } from "./interfaces/gesture";
import {
  HttpHeaderValue,
  JsFunction,
  KeyValue,
  OptionalXY,
} from "./interfaces/generic-types";
import { ScreenProperties } from "./interfaces/screen-properties";
import { HttpResponse } from "./http/http-response";
import { ScreenshotOpts } from "./interfaces/screenshot";
import { JsonData } from "./json/jpath";
import { Value } from "./value";
import { Scenario } from "./scenario";
import { UnknownValue } from "./values/unknown-value";
import { NumericValue } from "./values/numeric-value";
import { StringValue } from "./values/string-value";
import { GenericValue } from "./values/generic-value";
import { JsonValue } from "./values/json-value";

export abstract class ProtoResponse {
  protected _currentUrl: string | null = null;
  protected _httpResponse: HttpResponse = createEmptyResponse();

  constructor(public readonly scenario: Scenario) {
    this._currentUrl = scenario.finalUrl;
  }

  public get context() {
    return this.scenario.context;
  }

  public init(res: HttpResponse) {
    this._httpResponse = res;
  }

  abstract find(
    selector: string,
    opts?: FindOptions
  ): ValuePromise<UnknownValue>;
  abstract find(
    selector: string,
    contains: string,
    opts?: FindOptions
  ): ValuePromise<UnknownValue>;
  abstract find(
    selector: string,
    matches: RegExp,
    opts?: FindOptions
  ): ValuePromise<UnknownValue>;

  abstract findAll(
    selector: string,
    opts?: FindAllOptions
  ): Promise<Value<any>[]>;
  abstract findAll(
    selector: string,
    contains: string,
    opts?: FindAllOptions
  ): Promise<Value<any>[]>;
  abstract findAll(
    selector: string,
    matches: RegExp,
    opts?: FindAllOptions
  ): Promise<Value<any>[]>;

  public async eval(callback: any, ...args: any[]): Promise<any> {
    throw "This type of scenario does not suport eval.";
  }

  public get httpResponse(): HttpResponse {
    return this._httpResponse;
  }

  /**
   * HTTP Status Code
   */
  public get statusCode() {
    return new NumericValue(
      this.httpResponse.statusCode,
      this.context,
      "HTTP Status Code"
    );
  }

  /**
   * HTTP Status Message
   */
  public get statusMessage() {
    return new StringValue(
      this.httpResponse.statusMessage,
      this.context,
      "HTTP Status Message"
    );
  }

  public get body() {
    return new StringValue(
      this.httpResponse.body,
      this.context,
      "Response Body String"
    );
  }

  public get rawBody() {
    return new GenericValue<unknown>(
      this.httpResponse.rawBody,
      this.context,
      "Raw Response Body"
    );
  }

  /**
   * Size of the response body
   */
  public get length() {
    return new NumericValue(
      this.httpResponse.body.length,
      this.context,
      "Length of Response Body"
    );
  }

  /**
   * HTTP Headers
   */
  public get headers() {
    return new GenericValue<KeyValue>(
      this.httpResponse.headers,
      this.context,
      "HTTP Headers"
    );
  }

  /**
   * HTTP Cookies
   */
  public get cookies() {
    return new GenericValue<KeyValue>(
      this.httpResponse.cookies,
      this.context,
      "HTTP Cookies"
    );
  }

  /**
   * HTTP Trailers
   */
  public get trailers() {
    return new GenericValue<KeyValue>(
      this.httpResponse.trailers,
      this.context,
      "HTTP Trailers"
    );
  }

  /**
   * JSON parsed response body
   */
  public get jsonBody() {
    return new JsonValue(this.httpResponse.jsonBody, this.context, "JSON Body");
  }

  /**
   * URL of the request
   */
  public get url() {
    return new StringValue(
      this.scenario.url || "",
      this.context,
      "Request URL"
    );
  }

  /**
   * URL of the response, after all redirects
   */
  public get finalUrl() {
    return new StringValue(
      this.scenario.finalUrl || "",
      this.context,
      "Response URL (after redirects)"
    );
  }

  /**
   * Current URL after any navigation, is nothing for static requets but comes into play with browser requests
   */
  public get currentUrl() {
    return new StringValue(
      this.scenario.finalUrl || "",
      this.context,
      "Current URL"
    );
  }

  /**
   * URL of the response, after all redirects
   */
  public get redirectCount() {
    return new NumericValue(
      this.scenario.redirectCount,
      this.context,
      "Response URL (after redirects)"
    );
  }

  /**
   * Time from request start to response complete
   */
  public get loadTime() {
    return new NumericValue(
      this.scenario.requestDuration || -1,
      this.context,
      "Request to Response Load Time"
    );
  }

  public get method() {
    return new StringValue(this.httpResponse.method, this.context, "Method");
  }

  /**
   * After the response is loaded, can navigate to a different one
   *
   * @param req
   * @returns
   */
  public async navigate(req: HttpRequest) {
    this._currentUrl = this.absolutizeUri(req.uri || "");
    return this.init(await req.fetch(this.scenario.adapter));
  }

  /**
   * Take a relative URL and make it absolute, based on the requested URL
   *
   * @param uri
   */
  public absolutizeUri(uri: string): string {
    return new URL(uri, this.scenario.buildUrl()).href;
  }

  public getRoot(): any {
    return this.httpResponse.body;
  }

  public getSource(): StringValue {
    throw new Error(
      `This scenario type (${this.scenario.typeName}) does not support getSource.`
    );
  }

  public header(key: string) {
    // Try first as they put it in the test, then try all lowercase
    key =
      typeof this.httpResponse.headers[key] !== "undefined"
        ? key
        : key.toLowerCase();
    const headerValue = this.httpResponse.headers[key];
    return new GenericValue<HttpHeaderValue | null>(
      headerValue === undefined ? null : headerValue,
      this.context,
      "HTTP Headers[" + key + "]"
    );
  }

  public cookie(key: string) {
    return new StringValue(
      this.httpResponse.cookies[key],
      this.context,
      "HTTP Cookies[" + key + "]"
    );
  }

  public async waitForFunction(
    js: JsFunction,
    opts?: KeyValue,
    ...args: any[]
  ): Promise<void> {
    return this.context.pause(1);
  }

  public async waitForNavigation(
    timeout?: number,
    waitFor?: string | string[]
  ): Promise<void> {
    return this.context.pause(1);
  }

  public async waitForLoad(timeout?: number): Promise<void> {
    return this.context.pause(1);
  }

  public async waitForReady(timeout?: number): Promise<void> {
    return this.context.pause(1);
  }

  public async waitForNetworkIdle(timeout?: number): Promise<void> {
    return this.context.pause(1);
  }

  public waitForHidden(
    selector: string,
    timeout?: number
  ): ValuePromise<UnknownValue> {
    throw new Error(
      `This scenario type (${this.scenario.typeName}) does not support waitForHidden.`
    );
  }

  public waitForVisible(
    selector: string,
    timeout?: number
  ): ValuePromise<UnknownValue> {
    throw new Error(
      `This scenario type (${this.scenario.typeName}) does not support waitForVisible.`
    );
  }

  waitForExists(selector: string, timeout?: number): ValuePromise<UnknownValue>;
  waitForExists(
    selector: string,
    contains: string | RegExp,
    timeout?: number
  ): ValuePromise<UnknownValue>;
  public waitForExists(..._args: any[]): ValuePromise<UnknownValue> {
    throw new Error(
      `This scenario type (${this.scenario.typeName}) does not support waitForExists.`
    );
  }

  waitForNotExists(
    selector: string,
    timeout?: number
  ): ValuePromise<UnknownValue>;
  waitForNotExists(
    selector: string,
    contains: string | RegExp,
    timeout?: number
  ): ValuePromise<UnknownValue>;
  public waitForNotExists(..._args: any[]): ValuePromise<UnknownValue> {
    throw new Error(
      `This scenario type (${this.scenario.typeName}) does not support waitForNotExists.`
    );
  }

  public waitForHavingText(
    selector: string,
    text: string | RegExp,
    timeout?: number
  ): ValuePromise<UnknownValue> {
    throw new Error(
      `This scenario type (${this.scenario.typeName}) does not support waitForHavingText.`
    );
  }

  screenshot(): Promise<Buffer>;
  screenshot(localFilePath: string, opts?: ScreenshotOpts): Promise<Buffer>;
  screenshot(opts: ScreenshotOpts): Promise<Buffer>;
  public async screenshot(
    a?: string | ScreenshotOpts,
    b?: ScreenshotOpts
  ): Promise<Buffer> {
    throw new Error(
      `This scenario type (${this.scenario.typeName}) does not support screenshots.`
    );
  }

  public type(
    selector: string,
    textToType: string,
    opts: any = {}
  ): ValuePromise<UnknownValue> {
    throw new Error(
      `This scenario type (${this.scenario.typeName}) does not support type.`
    );
  }

  public clear(selector: string): ValuePromise<UnknownValue> {
    throw new Error(
      `This scenario type (${this.scenario.typeName}) does not support clear.`
    );
  }

  public clearThenType(
    selector: string,
    textToType: string,
    opts: any = {}
  ): ValuePromise<UnknownValue> {
    throw new Error(
      `This scenario type (${this.scenario.typeName}) does not support clearThenType.`
    );
  }

  public waitForXPath(
    xPath: string,
    timeout?: number
  ): ValuePromise<UnknownValue> {
    throw new Error(
      `This scenario type (${this.scenario.typeName}) does not support waitForXPath.`
    );
  }

  public findXPath(xPath: string): ValuePromise<UnknownValue> {
    throw new Error(
      `This scenario type (${this.scenario.typeName}) does not support findXPath.`
    );
  }

  public async findAllXPath(xPath: string): Promise<Value<any>[]> {
    throw new Error(
      `This scenario type (${this.scenario.typeName}) does not support findAllXPath.`
    );
  }

  public findHavingText(
    selector: string,
    searchForText: string | RegExp
  ): ValuePromise<UnknownValue> {
    throw new Error(
      `This scenario type (${this.scenario.typeName}) does not support findHavingText.`
    );
  }

  public async findAllHavingText(
    selector: string,
    searchForText: string | RegExp
  ): Promise<Value<any>[]> {
    throw new Error(
      `This scenario type (${this.scenario.typeName}) does not support findAllHavingText.`
    );
  }

  public selectOption(
    selector: string,
    value: string | string[]
  ): ValuePromise<UnknownValue> {
    throw new Error(
      `This scenario type (${this.scenario.typeName}) does not support selectOption.`
    );
  }

  public async movePointer(...pointers: PointerMove[]): Promise<this> {
    throw new Error(
      `This scenario type (${this.scenario.typeName}) does not support pointer.`
    );
  }

  public async gesture(type: GestureType, opts: GestureOpts): Promise<this> {
    throw new Error(
      `This scenario type (${this.scenario.typeName}) does not support gesture.`
    );
  }

  public async scrollTo(_point: OptionalXY): Promise<this> {
    return this;
  }

  /**
   * Click on this element
   *
   * @param selector
   */
  public click(
    selector: string,
    opts?: FindOptions
  ): ValuePromise<UnknownValue>;
  public click(
    selector: string,
    contains: string,
    opts?: FindOptions
  ): ValuePromise<UnknownValue>;
  public click(
    selector: string,
    matches: RegExp,
    opts?: FindOptions
  ): ValuePromise<UnknownValue>;
  public click(
    selector: string,
    a?: FindOptions | string | RegExp,
    b?: FindOptions
  ): ValuePromise<UnknownValue> {
    return ValuePromise.execute(async () => {
      const contains = typeof a == "string" ? a : undefined;
      const matches = a instanceof RegExp ? a : undefined;
      const opts = (b || a || {}) as FindOptions;
      const element = contains
        ? await this.find(selector, contains, opts)
        : matches
        ? await this.find(selector, matches, opts)
        : await this.find(selector, opts);
      if (element.isNull()) {
        return element.click();
      }
      return element;
    });
  }

  public serialize(): JsonData {
    return {
      statusCode: this.statusCode.$,
      statusMessage: this.statusMessage.$,
      url: this.url.toString(),
      finalURl: this.finalUrl.toString(),
      body: this.body.toString(),
      jsonBody: this.jsonBody.$,
      loadTime: this.loadTime.$,
      length: this.length.$,
      method: this.context.request.method.toString(),
      headers: this.headers.$,
      cookies: this.cookies.$,
      trailers: this.trailers.$,
    };
  }

  public async rotateScreen(
    rotation: string | number
  ): Promise<string | number> {
    throw "rotateScreen not implemented for this kind of scenario.";
  }

  public async getScreenProperties(): Promise<ScreenProperties> {
    throw "getScreenProperties not implemented for this kind of scenario.";
  }

  public async hideKeyboard(): Promise<void> {
    throw "hideKeyboard not implemented for this kind of scenario.";
  }
}
