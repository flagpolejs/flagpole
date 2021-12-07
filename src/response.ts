import { URL } from "url";
import {
  iValue,
  iResponse,
  iScenario,
  iAssertionContext,
  FindOptions,
  FindAllOptions,
  OptionalXY,
  ScreenProperties,
} from "./interfaces";
import { HttpResponse } from "./httpresponse";
import { HttpRequest } from "./httprequest";
import { AssertionContext } from "./assertioncontext";
import { wrapAsValue } from "./helpers";
import { ValuePromise } from "./value-promise";
import { ScenarioType } from "./scenario-types";

export function isPuppeteer(type: ScenarioType): boolean {
  return ["browser", "extjs"].indexOf(type) >= 0;
}

export abstract class ProtoResponse implements iResponse {
  public readonly scenario: iScenario;

  protected _currentUrl: string | null = null;
  protected _httpResponse: HttpResponse = HttpResponse.createEmpty();

  abstract get responseType(): ScenarioType;
  abstract get responseTypeName(): string;
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
  abstract eval(callback: any, ...args: any[]): Promise<any>;

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
  public get body(): iValue | Promise<iValue> {
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
    try {
      const json = JSON.parse(this.httpResponse.body);
      return wrapAsValue(this.context, json, "JSON Response");
    } catch (ex) {
      return wrapAsValue(this.context, null, `JSON Response: ${ex}`);
    }
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

  constructor(scenario: iScenario) {
    this.scenario = scenario;
    this._currentUrl = scenario.finalUrl;
  }

  public init(res: HttpResponse) {
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

  public async waitForHidden(..._args: any[]): Promise<iValue> {
    throw new Error(
      `This scenario type (${this.responseTypeName}) does not support waitForHidden.`
    );
  }

  public async waitForVisible(..._args: any[]): Promise<iValue> {
    throw new Error(
      `This scenario type (${this.responseTypeName}) does not support waitForVisible.`
    );
  }

  public async waitForExists(..._args: any[]): Promise<iValue> {
    throw new Error(
      `This scenario type (${this.responseTypeName}) does not support waitForExists.`
    );
  }

  public async waitForNotExists(..._args: any[]): Promise<iValue> {
    throw new Error(
      `This scenario type (${this.responseTypeName}) does not support waitForNotExists.`
    );
  }

  public async waitForHavingText(..._args: any[]): Promise<iValue> {
    throw new Error(
      `This scenario type (${this.responseTypeName}) does not support waitForHavingText.`
    );
  }

  public async screenshot(): Promise<Buffer> {
    throw new Error(
      `This scenario type (${this.responseTypeName}) does not support screenshots.`
    );
  }

  public type(
    selector: string,
    textToType: string,
    opts: any = {}
  ): ValuePromise {
    throw new Error(
      `This scenario type (${this.responseTypeName}) does not support type.`
    );
  }

  public clear(selector: string): ValuePromise {
    throw new Error(
      `This scenario type (${this.responseTypeName}) does not support clear.`
    );
  }

  public clearThenType(
    selector: string,
    textToType: string,
    opts: any = {}
  ): ValuePromise {
    throw new Error(
      `This scenario type (${this.responseTypeName}) does not support clearThenType.`
    );
  }

  public async waitForXPath(xPath: string): Promise<iValue> {
    throw new Error(
      `This scenario type (${this.responseTypeName}) does not support waitForXPath.`
    );
  }

  public async findXPath(xPath: string): Promise<iValue> {
    throw new Error(
      `This scenario type (${this.responseTypeName}) does not support findXPath.`
    );
  }

  public async findAllXPath(xPath: string): Promise<iValue[]> {
    throw new Error(
      `This scenario type (${this.responseTypeName}) does not support findAllXPath.`
    );
  }

  public async findHavingText(
    selector: string,
    searchForText: string | RegExp
  ): Promise<iValue> {
    throw new Error(
      `This scenario type (${this.responseTypeName}) does not support findHavingText.`
    );
  }

  public async findAllHavingText(
    selector: string,
    searchForText: string | RegExp
  ): Promise<iValue[]> {
    throw new Error(
      `This scenario type (${this.responseTypeName}) does not support findAllHavingText.`
    );
  }

  public async selectOption(
    selector: string,
    value: string | string[]
  ): Promise<void> {
    throw new Error(
      `This scenario type (${this.responseTypeName}) does not support selectOption.`
    );
  }

  public async touchMove(
    array: [x: number, y: number, duration?: number],
    ...otherMoves: [x: number, y: number, duration?: number][]
  ): Promise<void> {
    throw new Error(
      `This scenario type (${this.responseTypeName}) does not support touchMove.`
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
  public click(selector: string, opts?: FindOptions): Promise<iValue>;
  public click(
    selector: string,
    contains: string,
    opts?: FindOptions
  ): Promise<iValue>;
  public click(
    selector: string,
    matches: RegExp,
    opts?: FindOptions
  ): Promise<iValue>;
  public async click(
    selector: string,
    a?: FindOptions | string | RegExp,
    b?: FindOptions
  ): Promise<iValue> {
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

  public async rotate(rotation: string | number): Promise<string | number> {
    throw "rotate not implemented for this kind of scenario.";
  }

  public async getScreenProperties(): Promise<ScreenProperties> {
    throw "getScreenProperties not implemented for this kind of scenario.";
  }

  public async hideKeyboard(): Promise<void> {
    throw "hideKeyboard not implemented for this kind of scenario.";
  }
}
