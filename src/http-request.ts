import {
  KeyValue,
  BrowserOptions,
  iHttpRequest,
  HttpData,
  HttpAuthType,
  HttpAuth,
  HttpTimeout,
  HttpProxy,
  HttpMethodVerb,
  HttpRequestOptions,
  CONTENT_TYPE_JSON,
  CONTENT_TYPE_FORM_MULTIPART,
  CONTENT_TYPE_FORM,
  HttpRequestFetch,
} from "./interfaces";
import { HttpResponse } from "./http-response";
import tunnel = require("tunnel");
import * as http from "http";
import * as FormData from "form-data";
import formurlencoded from "form-urlencoded";
import { fetchWithNeedle } from "./adapters/needle";

export const HttpMethodVerbAllowedValues = [
  "get",
  "head",
  "delete",
  "patch",
  "post",
  "put",
  "options",
];

export class HttpRequest implements iHttpRequest {
  private _uri: string | null = null;
  private _method: HttpMethodVerb = "get";
  private _headers: KeyValue = {};
  private _cookies: KeyValue = {};
  private _verifyCert: boolean = false;
  private _proxy: HttpProxy | undefined;
  private _timeout: HttpTimeout = { open: 10000 };
  private _maxRedirects: number = 10;
  private _auth: HttpAuth | undefined;
  private _authType: HttpAuthType | undefined;
  private _data: HttpData;
  private _fetched: boolean = false;
  private _browser: BrowserOptions = {};
  private _outputFile?: string;

  public get uri(): string | null {
    return this._uri;
  }

  public set uri(value: string | null) {
    if (!this.isImmutable) {
      this._uri = value;
    }
  }

  public get method(): HttpMethodVerb {
    return this._method;
  }

  public set method(value: HttpMethodVerb) {
    if (!this.isImmutable) {
      this._method = value;
    }
  }

  public get headers(): KeyValue {
    return this._headers;
  }

  public set headers(value: KeyValue) {
    if (!this.isImmutable) {
      this._headers = value;
    }
  }

  public get cookies(): KeyValue {
    return this._cookies;
  }

  public set cookies(value: KeyValue) {
    if (!this.isImmutable) {
      this._cookies = value;
    }
  }

  public get auth(): HttpAuth | undefined {
    return this._auth;
  }

  public set auth(value: HttpAuth | undefined) {
    if (!this.isImmutable) {
      this._auth = value;
    }
  }

  public get authType(): HttpAuthType {
    return this._authType || "auto";
  }

  public set authType(value: HttpAuthType) {
    if (!this.isImmutable) {
      this._authType = value;
    }
  }

  public get maxRedirects(): number {
    return this._maxRedirects;
  }

  public set maxRedirects(value: number) {
    if (!this.isImmutable) {
      this._maxRedirects = value;
    }
  }

  public get timeout(): HttpTimeout {
    return this._timeout;
  }

  public set timeout(value: HttpTimeout) {
    if (!this.isImmutable) {
      this._timeout = value;
    }
  }

  public get proxy(): HttpProxy | undefined {
    return this._proxy;
  }

  public set proxy(value: HttpProxy | undefined) {
    if (!this.isImmutable) {
      this._proxy = value;
    }
  }

  public get verifyCert(): boolean {
    return this._verifyCert;
  }

  public set verifyCert(value: boolean) {
    if (!this.isImmutable) {
      this._verifyCert = value;
    }
  }

  public get data(): HttpData {
    return this._data;
  }

  public set data(value: HttpData) {
    if (!this.isImmutable) {
      this._data = value;
    }
  }

  public get browser(): BrowserOptions {
    return this._browser;
  }

  public set browser(value: BrowserOptions) {
    if (!this.isImmutable) {
      this._browser = value;
    }
  }

  public get proxyAgent(): http.Agent | undefined {
    if (this._proxy) {
      return tunnel.httpOverHttp({
        proxy: {
          host: this._proxy.host,
          port: this._proxy.port,
          proxyAuth: `${this._proxy.auth.username}:${this._proxy.auth.password}`,
        },
      });
    }
  }

  /**
   * Once this request has been fetched, changes can no longer be made
   */
  public get isImmutable(): boolean {
    return this._fetched;
  }

  public get outputFile(): string | undefined {
    return this._outputFile;
  }

  public set outputFile(value: string | undefined) {
    if (!this.isImmutable) {
      this._outputFile = value;
    }
  }

  public get options(): HttpRequestOptions {
    return {
      uri: this._uri,
      method: this._method,
      headers: this._headers,
      cookies: this._cookies,
      verifyCert: this._verifyCert,
      proxy: this._proxy,
      maxRedirects: this._maxRedirects,
      timeout: this._timeout,
      auth: this._auth,
      authType: this._authType,
      outputFile: this._outputFile,
      data: this._data,
    };
  }

  constructor(opts: HttpRequestOptions) {
    this.setOptions(opts);
  }

  /**
   * Overlay these options on top of existing ones
   *
   * @param opts
   */
  public setOptions(opts: HttpRequestOptions): HttpRequest {
    if (!this.isImmutable) {
      this._uri = opts.uri || this._uri;
      this._method = opts.method || this._method;
      this._headers = opts.headers || this._headers;
      this._cookies = opts.cookies || this._cookies;
      this._verifyCert =
        typeof opts.verifyCert === "undefined"
          ? this._verifyCert
          : opts.verifyCert;
      this._proxy = opts.proxy;
      this._maxRedirects =
        typeof opts.maxRedirects === "undefined"
          ? this._maxRedirects
          : opts.maxRedirects;
      this._timeout = (() => {
        if (!opts.timeout) {
          return this._timeout;
        }
        if (typeof opts.timeout == "number") {
          return {
            open: opts.timeout,
          };
        }
        return opts.timeout;
      })();
      this._auth = opts.auth || this._auth;
      this._browser = opts.browserOptions || this._browser;
      this._data = opts.data || this._data;
      this._outputFile = opts.outputFile || this._outputFile;
    }
    return this;
  }

  public setCookie(key: string, value: any) {
    if (!this.isImmutable) {
      this._cookies[key] = value;
    }
  }

  public getCookie(key: string): any {
    return this._cookies[key];
  }

  public setHeader(key: string, value: any) {
    if (!this.isImmutable) {
      this._headers[key] = value;
    }
  }

  public getHeader(key: string): any {
    return this._headers[key];
  }

  public setJsonData(data: KeyValue) {
    this.setHeader("Content-Type", CONTENT_TYPE_JSON);
    this.data = data;
  }

  public setFormData(formData: FormData): HttpRequest;
  public setFormData(data: KeyValue, isMultipart?: boolean): HttpRequest;
  public setFormData(
    data: KeyValue | FormData,
    isMultipart?: boolean
  ): HttpRequest {
    // If submitted FormData, the default should be multipart
    if (data instanceof FormData && !isMultipart) {
      throw new Error("This format of form data must be multipart.");
    }
    // Set header
    this.setHeader(
      "Content-Type",
      isMultipart ? CONTENT_TYPE_FORM_MULTIPART : CONTENT_TYPE_FORM
    );
    // Already is form data, don't need to change it
    if (data instanceof FormData) {
      this.data = data;
    }
    // Convert JSON object to multipart format
    else if (isMultipart) {
      const formData = new FormData();
      Object.keys(data).forEach((key) => formData.append(key, data[key]));
      this.data = formData;
    }
    // Convert JSON object to URL encoded form
    else {
      this.data = formurlencoded(data);
      //this.data = this.urlEncodeForm(data);
    }
    return this;
  }

  /**
   * Execute the request
   *
   * @param opts
   */
  public fetch(
    opts: KeyValue = {},
    fetchMethod?: HttpRequestFetch
  ): Promise<HttpResponse> {
    if (this._fetched) {
      throw new Error("This request was already fetched.");
    }
    this._fetched = true;
    if (this._uri === null) {
      throw new Error("Invalid URI");
    }
    fetchMethod = fetchMethod || fetchWithNeedle;
    return fetchMethod(this, opts);
  }
}
