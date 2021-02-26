import { KeyValue } from "./interfaces";
import { ffprobeResponse, HttpResponse } from "./httpresponse";
import needle = require("needle");
import tunnel = require("tunnel");
import * as http from "http";
import { LaunchOptions } from "puppeteer-core";
import { probeImageResponse } from "./httpresponse";
import * as FormData from "form-data";
import formurlencoded from "form-urlencoded";
import { ImageProbe } from "@zerodeps/image-probe";
import { FlagpoleExecution } from "./flagpoleexecution";
import { ffprobe, FfprobeOptions } from "media-probe";
import {
  mediaStreamValidator,
  MediaStreamValidatorOpts,
} from "media-stream-validator";

const CONTENT_TYPE_JSON = "application/json";
const CONTENT_TYPE_FORM_MULTIPART = "multipart/form-data";
const CONTENT_TYPE_FORM = "application/x-www-form-urlencoded";
const ENCODING_GZIP = "gzip,deflate";

type HttpRequestType =
  | "generic"
  | "json"
  | "image"
  | "ffprobe"
  | "mediastreamvalidator";

export const HttpRequestTypes = [
  "generic",
  "json",
  "image",
  "ffprobe",
  "mediastreamvalidator",
];

export const HttpMethodVerbAllowedValues = [
  "get",
  "head",
  "delete",
  "patch",
  "post",
  "put",
  "options",
];

export type HttpMethodVerb =
  | "get"
  | "head"
  | "delete"
  | "patch"
  | "post"
  | "put"
  | "options";

export type HttpAuthType = "basic" | "digest" | "auto";

export interface BrowserOptions extends LaunchOptions {
  width?: number;
  height?: number;
  recordConsole?: boolean;
  outputConsole?: boolean;
  product?: "chrome" | "firefox";
  ignoreHTTPSErrors?: boolean;
  headless?: boolean;
  executablePath?: string;
  slowMo?: number;
  args?: string[];
  ignoreDefaultArgs?: boolean | string[];
  timeout?: number;
  devtools?: boolean;
  defaultViewport?: {
    width?: number;
    height?: number;
    deviceScaleFactor?: number;
    isMobile?: boolean;
    hasTouch?: boolean;
    isLandscape?: boolean;
  };
  handleSIGINT?: boolean;
  handleSIGTERM?: boolean;
  handleSIGHUP?: boolean;
  dumpio?: boolean;
  userDataDir?: string;
  env?: { [key: string]: any };
  pipe?: boolean;
  extraPrefsFirefox?: any;
}

export type HttpAuth = {
  username: string;
  password: string;
};

export type HttpTimeout = {
  read?: number;
  open?: number;
  response?: number;
};

export type HttpProxy = {
  host: string;
  port: number;
  auth: HttpAuth;
};

export type HttpData =
  | Buffer
  | KeyValue
  | NodeJS.ReadableStream
  | string
  | null
  | undefined;

export type HttpRequestOptions = {
  browserOptions?: BrowserOptions;
  auth?: HttpAuth;
  authType?: HttpAuthType;
  data?: HttpData;
  cookies?: KeyValue;
  headers?: KeyValue;
  maxRedirects?: number;
  method?: HttpMethodVerb;
  outputFile?: string;
  proxy?: HttpProxy;
  timeout?: HttpTimeout | number;
  type?: HttpRequestType;
  uri?: string | null;
  /**
   * For https, should we reject unauthorized certs?
   */
  verifyCert?: boolean;
  cacheKey?: string;
};

export class HttpRequest {
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
  private _type: HttpRequestType = "generic";
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

  public get type(): HttpRequestType {
    return this._type;
  }

  public set type(value: HttpRequestType) {
    if (!this.isImmutable) {
      this._type = value;
      if (value === "json") {
        this.headers["Content-Type"] = CONTENT_TYPE_JSON;
      }
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

  public get authType(): HttpAuthType | undefined {
    return this._authType;
  }

  public set authType(value: HttpAuthType | undefined) {
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

  private get proxyAgent(): http.Agent | undefined {
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
      type: this._type,
    };
  }

  /**
   * For the Needle library
   */
  private get needleOptions(): needle.NeedleOptions {
    return {
      agent: this.proxyAgent,
      auth: this._authType || "auto",
      compressed: this.headers["Accept-Encoding"] === ENCODING_GZIP,
      cookies: this.cookies,
      follow_max: this.maxRedirects,
      headers: this.headers,
      json: this.headers["Content-Type"] === CONTENT_TYPE_JSON,
      multipart: this.headers["Content-Type"] === CONTENT_TYPE_FORM_MULTIPART,
      open_timeout: this.timeout.open,
      output: this.outputFile,
      parse_cookies: true,
      parse_response: false,
      password: this.auth?.password,
      read_timeout: this.timeout.read,
      rejectUnauthorized: this.verifyCert,
      username: this.auth?.username,
      user_agent: "Flagpole",
    };
  }

  constructor(opts: HttpRequestOptions) {
    this.setOptions(opts);
  }

  private urlEncodeForm(data: KeyValue): string {
    const encoded: string[] = [];
    Object.keys(data).forEach((key) => {
      encoded.push(
        `${encodeURIComponent(key)}=${encodeURIComponent(data[key])}`
      );
    });
    return encoded.join("&");
  }

  public setType(type: string) {
    this._type = HttpRequestTypes.includes(type)
      ? (type as HttpRequestType)
      : "generic";
  }

  /**
   * Overlay these options on top of existing ones
   *
   * @param opts
   */
  public setOptions(opts: HttpRequestOptions): HttpRequest {
    if (!this.isImmutable) {
      this._type = opts.type || this._type;
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
  public fetch(opts?: KeyValue): Promise<HttpResponse> {
    if (this._fetched) {
      throw new Error("This request was already fetched.");
    }
    this._fetched = true;
    if (this._uri === null) {
      throw new Error("Invalid URI");
    }
    if (this.type === "image") {
      return this._fetchImage(opts);
    } else if (this.type === "ffprobe") {
      return this._fetchFfprobe(opts);
    } else if (this.type === "mediastreamvalidator") {
      return this._fetchMediaStreamValidator(opts);
    } else {
      return this._fetchHttp(opts);
    }
  }

  private _fetchHttp(opts?: KeyValue): Promise<HttpResponse> {
    return new Promise((resolve, reject) => {
      if (this.options.cacheKey) {
        const response = FlagpoleExecution.global.getCache(
          this.options.cacheKey
        );
        if (response !== null) {
          return resolve(response as HttpResponse);
        }
      }
      const stream = needle.request(
        // Needle doesn't support "options"
        this.method === "options" ? "head" : this.method,
        this.uri || "/",
        this.data || null,
        this.needleOptions,
        (err, resp) => {
          if (!err && resp) {
            const response = HttpResponse.fromNeedle(resp);
            if (this.options.cacheKey) {
              FlagpoleExecution.global.setCache(
                this.options.cacheKey,
                response
              );
            }
            return resolve(response);
          }
          reject(err);
        }
      );
      if (opts?.redirect) {
        stream.on("redirect", opts.redirect);
      }
    });
  }

  protected _fetchImage(opts?: KeyValue): Promise<HttpResponse> {
    return new Promise((resolve, reject) => {
      const stream = needle.request(
        "get",
        this.uri || "/",
        null,
        this.needleOptions
      );
      if (opts?.redirect) {
        stream.on("redirect", opts.redirect);
      }
      // Process response
      const response: probeImageResponse = {
        statusCode: 0,
        length: 0,
        url: this.uri || "",
        headers: {},
        imageData: {
          width: 0,
          height: 0,
          type: "",
          mimeType: "",
        },
      };
      stream
        .on("header", (statusCode: number, headers: KeyValue) => {
          response.statusCode = statusCode;
          response.headers = headers;
          response.length = Number(headers["content-length"]);
        })
        .on("readable", () => {
          // Read the first 512 bytes and process image
          const chunk = <Buffer>stream.read(512);
          response.imageData =
            ImageProbe.fromBuffer(chunk) || response.imageData;
          // We have enough! Stop processing any more data!
          stream.pause();
          try {
            // @ts-ignore
            stream.destroy();
          } catch {}
          // Set the response
          resolve(HttpResponse.fromProbeImage(response));
        });
    });
  }

  protected _fetchFfprobe(opts?: FfprobeOptions): Promise<HttpResponse> {
    return new Promise((resolve, reject) => {
      if (!this.uri) {
        return reject("No uri");
      }
      try {
        ffprobe(this.uri, opts).then((data) => {
          resolve(HttpResponse.fromFfprobe(this, data));
        });
      } catch (err) {
        reject(err);
      }
    });
  }

  protected _fetchMediaStreamValidator(
    opts?: MediaStreamValidatorOpts
  ): Promise<HttpResponse> {
    return new Promise((resolve, reject) => {
      if (!this.uri) {
        return reject("No uri");
      }
      try {
        mediaStreamValidator(this.uri, opts).then((data) => {
          resolve(HttpResponse.fromMediaStreamValidator(this, data));
        });
      } catch (err) {
        reject(err);
      }
    });
  }
}
