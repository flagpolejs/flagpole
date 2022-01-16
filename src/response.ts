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
import { OptionalXY } from "./interfaces/generic-types";
import { ScreenProperties } from "./interfaces/screen-properties";
import { iAssertionContext } from "./interfaces/iassertioncontext";
import { iScenario } from "./interfaces/iscenario";
import { iResponse } from "./interfaces/iresponse";
import { iHttpResponse } from "./interfaces/http";

export abstract class ProtoResponse implements iResponse {
  protected _currentUrl: string | null = null;
  protected _httpResponse: iHttpResponse = createEmptyResponse();

  abstract find(selector: string, opts?: FindOptions): ValuePromise;
  abstract find(
    selector: string,
    contains: string,
    opts?: FindOptions
  ): ValuePromise;
  abstract find(
    selector: string,
    matches: RegExp,
    opts?: FindOptions
  ): ValuePromise;
  abstract findAll(selector: string, opts?: FindAllOptions): Promise<iValue[]>;
  abstract findAll(
    selector: string,
    contains: string,
    opts?: FindAllOptions
  ): Promise<iValue[]>;
  abstract findAll(
    selector: string,
    matches: RegExp,
    opts?: FindAllOptions
  ): Promise<iValue[]>;

  public async eval(callback: any, ...args: any[]): Promise<any> {
    throw "This type of scenario does not suport eval.";
  }

  public get httpResponse(): iHttpResponse {
    return this._httpResponse;
  }

  /**
   * HTTP Status Code
   */
  public get statusCode(): iValue {
    return wrapAsValue(
      this.context,
      this.httpResponse.statusCode,
      "HTTP Status Code"
    );
  }

  /**
   * HTTP Status Message
   */
  public get statusMessage(): iValue {
    return wrapAsValue(
      this.context,
      this.httpResponse.statusMessage,
      "HTTP Status Message"
    );
  }

  /**
   * Raw Response Body
   */
  public get body(): iValue {
    return wrapAsValue(
      this.context,
      this.httpResponse.body,
      "Raw Response Body"
    );
  }

  /**
   * Size of the response body
   */
  public get length(): iValue {
    return wrapAsValue(
      this.context,
      this.httpResponse.body.length,
      "Length of Response Body"
    );
  }

  /**
   * HTTP Headers
   */
  public get headers(): iValue {
    return wrapAsValue(this.context, this.httpResponse.headers, "HTTP Headers");
  }

  /**
   * HTTP Cookies
   */
  public get cookies(): iValue {
    return wrapAsValue(this.context, this.httpResponse.cookies, "HTTP Cookies");
  }

  /**
   * HTTP Trailers
   */
  public get trailers(): iValue {
    return wrapAsValue(
      this.context,
      this.httpResponse.trailers,
      "HTTP Trailers"
    );
  }

  /**
   * JSON parsed response body
   */
  public get jsonBody(): iValue {
    return wrapAsValue(this.context, this.httpResponse.jsonBody, "JSON Body");
  }

  /**
   * URL of the request
   */
  public get url(): iValue {
    return wrapAsValue(this.context, this.scenario.url, "Request URL");
  }

  /**
   * URL of the response, after all redirects
   */
  public get finalUrl(): iValue {
    return wrapAsValue(
      this.context,
      this.scenario.finalUrl,
      "Response URL (after redirects)"
    );
  }

  /**
   * Current URL after any navigation, is nothing for static requets but comes into play with browser requests
   */
  public get currentUrl(): iValue {
    return wrapAsValue(this.context, this.scenario.finalUrl, "Current URL");
  }

  /**
   * URL of the response, after all redirects
   */
  public get redirectCount(): iValue {
    return wrapAsValue(
      this.context,
      this.scenario.redirectCount,
      "Response URL (after redirects)"
    );
  }

  /**
   * Time from request start to response complete
   */
  public get loadTime(): iValue {
    return wrapAsValue(
      this.context,
      this.scenario.requestDuration,
      "Request to Response Load Time"
    );
  }

  public get method(): iValue {
    return wrapAsValue(this.context, this._httpResponse.method, "Method");
  }

  public get context(): iAssertionContext {
    return new AssertionContext(this.scenario, this);
  }

  constructor(public readonly scenario: iScenario) {
    this._currentUrl = scenario.finalUrl;
  }

  public init(res: iHttpResponse) {
    this._httpResponse = res;
  }

  /**
   * After the response is loaded, can navigate to a different one
   *
   * @param req
   * @returns
   */
  public async navigate(req: HttpRequest) {
    this._currentUrl = this.absolutizeUri(req.uri || "");
    return this.init(await req.fetch());
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

  public getSource(): ValuePromise {
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
  public header(key: string): iValue {
    // Try first as they put it in the test, then try all lowercase
    key =
      typeof this.httpResponse.headers[key] !== "undefined"
        ? key
        : key.toLowerCase();
    const headerValue: any = this.httpResponse.headers[key];
    return wrapAsValue(
      this.context,
      typeof headerValue == "undefined" ? null : headerValue,
      "HTTP Headers[" + key + "]"
    );
  }

  /**
   * Return a single cookie by key or all cookies in an object
   *
   * @param key
   */
  public cookie(key: string): iValue {
    return wrapAsValue(
      this.context,
      this.httpResponse.cookies[key],
      "HTTP Cookies[" + key + "]"
    );
  }

  public async waitForFunction(..._args: any[]): Promise<void> {
    return this.context.pause(1);
  }

  public async waitForNavigation(..._args: any[]): Promise<void> {
    return this.context.pause(1);
  }

  public async waitForLoad(..._args: any[]): Promise<void> {
    return this.context.pause(1);
  }

  public async waitForReady(..._args: any[]): Promise<void> {
    return this.context.pause(1);
  }

  public async waitForNetworkIdle(..._args: any[]): Promise<void> {
    return this.context.pause(1);
  }

  public waitForHidden(..._args: any[]): ValuePromise {
    throw new Error(
      `This scenario type (${this.scenario.typeName}) does not support waitForHidden.`
    );
  }

  public waitForVisible(..._args: any[]): ValuePromise {
    throw new Error(
      `This scenario type (${this.scenario.typeName}) does not support waitForVisible.`
    );
  }

  public waitForExists(..._args: any[]): ValuePromise {
    throw new Error(
      `This scenario type (${this.scenario.typeName}) does not support waitForExists.`
    );
  }

  public waitForNotExists(..._args: any[]): ValuePromise {
    throw new Error(
      `This scenario type (${this.scenario.typeName}) does not support waitForNotExists.`
    );
  }

  public waitForHavingText(..._args: any[]): ValuePromise {
    throw new Error(
      `This scenario type (${this.scenario.typeName}) does not support waitForHavingText.`
    );
  }

  public async screenshot(): Promise<Buffer> {
    throw new Error(
      `This scenario type (${this.scenario.typeName}) does not support screenshots.`
    );
  }

  public type(
    selector: string,
    textToType: string,
    opts: any = {}
  ): ValuePromise {
    throw new Error(
      `This scenario type (${this.scenario.typeName}) does not support type.`
    );
  }

  public clear(selector: string): ValuePromise {
    throw new Error(
      `This scenario type (${this.scenario.typeName}) does not support clear.`
    );
  }

  public clearThenType(
    selector: string,
    textToType: string,
    opts: any = {}
  ): ValuePromise {
    throw new Error(
      `This scenario type (${this.scenario.typeName}) does not support clearThenType.`
    );
  }

  public waitForXPath(xPath: string): ValuePromise {
    throw new Error(
      `This scenario type (${this.scenario.typeName}) does not support waitForXPath.`
    );
  }

  public findXPath(xPath: string): ValuePromise {
    throw new Error(
      `This scenario type (${this.scenario.typeName}) does not support findXPath.`
    );
  }

  public async findAllXPath(xPath: string): Promise<iValue[]> {
    throw new Error(
      `This scenario type (${this.scenario.typeName}) does not support findAllXPath.`
    );
  }

  public findHavingText(
    selector: string,
    searchForText: string | RegExp
  ): ValuePromise {
    throw new Error(
      `This scenario type (${this.scenario.typeName}) does not support findHavingText.`
    );
  }

  public async findAllHavingText(
    selector: string,
    searchForText: string | RegExp
  ): Promise<iValue[]> {
    throw new Error(
      `This scenario type (${this.scenario.typeName}) does not support findAllHavingText.`
    );
  }

  public selectOption(
    selector: string,
    value: string | string[]
  ): ValuePromise {
    throw new Error(
      `This scenario type (${this.scenario.typeName}) does not support selectOption.`
    );
  }

  public async movePointer(...pointers: PointerMove[]): Promise<iResponse> {
    throw new Error(
      `This scenario type (${this.scenario.typeName}) does not support pointer.`
    );
  }

  public async gesture(
    type: GestureType,
    opts: GestureOpts
  ): Promise<iResponse> {
    throw new Error(
      `This scenario type (${this.scenario.typeName}) does not support gesture.`
    );
  }

  public async scrollTo(_point: OptionalXY): Promise<iResponse> {
    return this;
  }

  /**
   * Click on this element
   *
   * @param selector
   */
  public click(selector: string, opts?: FindOptions): ValuePromise;
  public click(
    selector: string,
    contains: string,
    opts?: FindOptions
  ): ValuePromise;
  public click(
    selector: string,
    matches: RegExp,
    opts?: FindOptions
  ): ValuePromise;
  public click(
    selector: string,
    a?: FindOptions | string | RegExp,
    b?: FindOptions
  ): ValuePromise {
    return ValuePromise.execute(async () => {
      const contains = typeof a == "string" ? a : undefined;
      const matches = a instanceof RegExp ? a : undefined;
      const opts = (b || a || {}) as FindOptions;
      const element = contains
        ? await this.find(selector, contains, opts)
        : matches
        ? await this.find(selector, matches, opts)
        : await this.find(selector, opts);
      if (!(await element.exists()).isNull()) {
        return element.click();
      }
      return element;
    });
  }

  public serialize(): object {
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
