import { URL } from "url";
import { iValue } from "./interfaces/ivalue";
import { createEmptyResponse } from "./http/http-response";
import { HttpRequest } from "./http/http-request";
import { AssertionContext } from "./assertion/assertion-context";
import { wrapAsValue } from "./helpers";
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
import { iScenario } from "./interfaces/iscenario";
import { HttpResponse } from "./http/http-response";
import { ScreenshotOpts } from "./interfaces/screenshot";
import { JsonData } from "./json/jpath";
import { Value } from ".";
import { ValueFactory } from "./helpers/value-factory";

export abstract class ProtoResponse {
  protected _currentUrl: string | null = null;
  protected _httpResponse: HttpResponse = createEmptyResponse();

  public readonly context: AssertionContext;
  public readonly valueFactory: ValueFactory;

  constructor(public readonly scenario: iScenario) {
    this._currentUrl = scenario.finalUrl;
    this.context = new AssertionContext(this.scenario, this);
    this.valueFactory = new ValueFactory(this.context);
  }

  public init(res: HttpResponse) {
    this._httpResponse = res;
  }

  abstract find(
    selector: string,
    opts?: FindOptions
  ): ValuePromise<any, iValue>;
  abstract find(
    selector: string,
    contains: string,
    opts?: FindOptions
  ): ValuePromise<any, iValue>;
  abstract find(
    selector: string,
    matches: RegExp,
    opts?: FindOptions
  ): ValuePromise<any, iValue>;

  abstract findAll(
    selector: string,
    opts?: FindAllOptions
  ): Promise<iValue<any>[]>;
  abstract findAll(
    selector: string,
    contains: string,
    opts?: FindAllOptions
  ): Promise<iValue<any>[]>;
  abstract findAll(
    selector: string,
    matches: RegExp,
    opts?: FindAllOptions
  ): Promise<iValue<any>[]>;

  public async eval(callback: any, ...args: any[]): Promise<any> {
    throw "This type of scenario does not suport eval.";
  }

  public get httpResponse(): HttpResponse {
    return this._httpResponse;
  }

  /**
   * HTTP Status Code
   */
  public get statusCode(): iValue<number> {
    return wrapAsValue(
      this.context,
      this.httpResponse.statusCode,
      "HTTP Status Code"
    );
  }

  /**
   * HTTP Status Message
   */
  public get statusMessage(): iValue<string> {
    return wrapAsValue(
      this.context,
      this.httpResponse.statusMessage,
      "HTTP Status Message"
    );
  }

  public get body(): iValue<string> {
    return wrapAsValue<string>(
      this.context,
      this.httpResponse.body,
      "Response Body String"
    );
  }

  public get rawBody(): iValue<any> {
    return wrapAsValue(
      this.context,
      this.httpResponse.rawBody,
      "Raw Response Body"
    );
  }

  /**
   * Size of the response body
   */
  public get length(): iValue<number> {
    return wrapAsValue(
      this.context,
      this.httpResponse.body.length,
      "Length of Response Body"
    );
  }

  /**
   * HTTP Headers
   */
  public get headers(): iValue<KeyValue> {
    return wrapAsValue(this.context, this.httpResponse.headers, "HTTP Headers");
  }

  /**
   * HTTP Cookies
   */
  public get cookies(): iValue<KeyValue> {
    return wrapAsValue(this.context, this.httpResponse.cookies, "HTTP Cookies");
  }

  /**
   * HTTP Trailers
   */
  public get trailers(): iValue<KeyValue> {
    return wrapAsValue(
      this.context,
      this.httpResponse.trailers,
      "HTTP Trailers"
    );
  }

  /**
   * JSON parsed response body
   */
  public get jsonBody(): iValue<any> {
    return wrapAsValue(this.context, this.httpResponse.jsonBody, "JSON Body");
  }

  /**
   * URL of the request
   */
  public get url(): iValue<string | null> {
    return wrapAsValue(this.context, this.scenario.url, "Request URL");
  }

  /**
   * URL of the response, after all redirects
   */
  public get finalUrl(): iValue<string | null> {
    return wrapAsValue(
      this.context,
      this.scenario.finalUrl,
      "Response URL (after redirects)"
    );
  }

  /**
   * Current URL after any navigation, is nothing for static requets but comes into play with browser requests
   */
  public get currentUrl(): iValue<string | null> {
    return wrapAsValue(this.context, this.scenario.finalUrl, "Current URL");
  }

  /**
   * URL of the response, after all redirects
   */
  public get redirectCount(): iValue<number> {
    return wrapAsValue(
      this.context,
      this.scenario.redirectCount,
      "Response URL (after redirects)"
    );
  }

  /**
   * Time from request start to response complete
   */
  public get loadTime(): iValue<number | null> {
    return wrapAsValue(
      this.context,
      this.scenario.requestDuration,
      "Request to Response Load Time"
    );
  }

  public get method(): iValue<string> {
    return wrapAsValue(this.context, this.httpResponse.method, "Method");
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

  public getSource(): ValuePromise<string, Value> {
    throw new Error(
      `This scenario type (${this.scenario.typeName}) does not support getSource.`
    );
  }

  /**
   * Return a single header by key or all headers in an object
   *
   * @param {string} key
   * @returns {Value}
   */
  public header(key: string): Value<HttpHeaderValue | null> {
    // Try first as they put it in the test, then try all lowercase
    key =
      typeof this.httpResponse.headers[key] !== "undefined"
        ? key
        : key.toLowerCase();
    const headerValue = this.httpResponse.headers[key];
    return wrapAsValue(
      this.context,
      headerValue === undefined ? null : headerValue,
      "HTTP Headers[" + key + "]"
    );
  }

  /**
   * Return a single cookie by key or all cookies in an object
   *
   * @param key
   */
  public cookie(key: string): iValue<any> {
    return wrapAsValue(
      this.context,
      this.httpResponse.cookies[key],
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
  ): ValuePromise<any, iValue> {
    throw new Error(
      `This scenario type (${this.scenario.typeName}) does not support waitForHidden.`
    );
  }

  public waitForVisible(
    selector: string,
    timeout?: number
  ): ValuePromise<any, iValue> {
    throw new Error(
      `This scenario type (${this.scenario.typeName}) does not support waitForVisible.`
    );
  }

  waitForExists(selector: string, timeout?: number): ValuePromise<any, iValue>;
  waitForExists(
    selector: string,
    contains: string | RegExp,
    timeout?: number
  ): ValuePromise<any, iValue>;
  public waitForExists(..._args: any[]): ValuePromise<any, iValue> {
    throw new Error(
      `This scenario type (${this.scenario.typeName}) does not support waitForExists.`
    );
  }

  waitForNotExists(
    selector: string,
    timeout?: number
  ): ValuePromise<any, iValue>;
  waitForNotExists(
    selector: string,
    contains: string | RegExp,
    timeout?: number
  ): ValuePromise<any, iValue>;
  public waitForNotExists(..._args: any[]): ValuePromise<any, iValue> {
    throw new Error(
      `This scenario type (${this.scenario.typeName}) does not support waitForNotExists.`
    );
  }

  public waitForHavingText(
    selector: string,
    text: string | RegExp,
    timeout?: number
  ): ValuePromise<any, iValue> {
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
  ): ValuePromise<any, iValue> {
    throw new Error(
      `This scenario type (${this.scenario.typeName}) does not support type.`
    );
  }

  public clear(selector: string): ValuePromise<any, iValue> {
    throw new Error(
      `This scenario type (${this.scenario.typeName}) does not support clear.`
    );
  }

  public clearThenType(
    selector: string,
    textToType: string,
    opts: any = {}
  ): ValuePromise<any, iValue> {
    throw new Error(
      `This scenario type (${this.scenario.typeName}) does not support clearThenType.`
    );
  }

  public waitForXPath(
    xPath: string,
    timeout?: number
  ): ValuePromise<any, iValue> {
    throw new Error(
      `This scenario type (${this.scenario.typeName}) does not support waitForXPath.`
    );
  }

  public findXPath(xPath: string): ValuePromise<any, iValue> {
    throw new Error(
      `This scenario type (${this.scenario.typeName}) does not support findXPath.`
    );
  }

  public async findAllXPath(xPath: string): Promise<iValue<any>[]> {
    throw new Error(
      `This scenario type (${this.scenario.typeName}) does not support findAllXPath.`
    );
  }

  public findHavingText(
    selector: string,
    searchForText: string | RegExp
  ): ValuePromise<any, iValue> {
    throw new Error(
      `This scenario type (${this.scenario.typeName}) does not support findHavingText.`
    );
  }

  public async findAllHavingText(
    selector: string,
    searchForText: string | RegExp
  ): Promise<iValue<any>[]> {
    throw new Error(
      `This scenario type (${this.scenario.typeName}) does not support findAllHavingText.`
    );
  }

  public selectOption(
    selector: string,
    value: string | string[]
  ): ValuePromise<any, iValue> {
    throw new Error(
      `This scenario type (${this.scenario.typeName}) does not support selectOption.`
    );
  }

  public async movePointer(...pointers: PointerMove[]): Promise<ProtoResponse> {
    throw new Error(
      `This scenario type (${this.scenario.typeName}) does not support pointer.`
    );
  }

  public async gesture(
    type: GestureType,
    opts: GestureOpts
  ): Promise<ProtoResponse> {
    throw new Error(
      `This scenario type (${this.scenario.typeName}) does not support gesture.`
    );
  }

  public async scrollTo(_point: OptionalXY): Promise<ProtoResponse> {
    return this;
  }

  /**
   * Click on this element
   *
   * @param selector
   */
  public click(selector: string, opts?: FindOptions): ValuePromise<any, iValue>;
  public click(
    selector: string,
    contains: string,
    opts?: FindOptions
  ): ValuePromise<any, iValue>;
  public click(
    selector: string,
    matches: RegExp,
    opts?: FindOptions
  ): ValuePromise<any, iValue>;
  public click(
    selector: string,
    a?: FindOptions | string | RegExp,
    b?: FindOptions
  ): ValuePromise<any, iValue> {
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
