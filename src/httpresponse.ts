import * as puppeteer from "puppeteer-core";
import { NeedleResponse } from "needle";
import { KeyValue, HttpResponseOptions } from "./interfaces";
import { readFile } from "fs-extra";

export interface probeImageResponse {
  headers: KeyValue;
  statusCode: number;
  url: string;
  length: number;
  imageData: probeImageData;
}

export type probeImageData = {
  width: number;
  height: number;
  type: string;
  mimeType: string;
};

export class HttpResponse {
  public body: string = "";
  public statusCode: number = 0;
  public statusMessage: string = "";
  public headers: KeyValue = {};
  public cookies: KeyValue = {};
  public trailers: KeyValue = {};
  public url: string = "";
  public method: string = "";

  private constructor(opts?: HttpResponseOptions) {
    if (opts) {
      this.body =
        typeof opts.body == "string" ? opts.body : JSON.stringify(opts.body);
      this.statusCode = opts.status ? opts.status[0] : 200;
      this.statusMessage = opts.status ? opts.status[1] : "OK";
      this.headers = opts.headers || {};
      this.cookies = opts.cookies || {};
      this.trailers = opts.trailers || {};
      this.url = opts.url || "";
      this.method = opts.method || "";
    }
  }

  static createEmpty() {
    const r = new HttpResponse();
    return r;
  }

  static fromNeedle(response: NeedleResponse): HttpResponse {
    const r = new HttpResponse({
      status: [response.statusCode || 0, response.statusMessage || ""],
      headers: <KeyValue>response.headers,
      body:
        typeof response.body === "string"
          ? response.body
          : response.body.toString("utf8"),
      cookies: response.cookies ? <KeyValue>response.cookies : {},
      trailers: <KeyValue>response.trailers,
      method: response.method,
      url: response.url,
    });
    return r;
  }

  static fromPuppeteer(
    response: puppeteer.Response,
    body: string,
    cookies?: KeyValue
  ): HttpResponse {
    const r = new HttpResponse();
    r.statusCode = response.status();
    r.statusMessage = response.statusText();
    r.headers = response.headers();
    r.body = body;
    r.cookies = cookies || {};
    r.url = response.url();
    return r;
  }

  static fromProbeImage(
    response: probeImageResponse,
    cookies?: KeyValue
  ): HttpResponse {
    const r = new HttpResponse();
    r.headers = response.headers;
    r.statusCode = response.statusCode;
    r.body = JSON.stringify({
      ...response.imageData,
      ...{
        length: response.length,
        url: response.url,
        mime: response.imageData.mimeType,
      },
    });
    r.cookies = cookies || {};
    r.url = response.url;
    return r;
  }

  static fromLocalFile(relativePath: string): Promise<HttpResponse> {
    let path: string = __dirname + "/" + relativePath;
    return new Promise((resolve, reject) => {
      readFile(path, (err, data) => {
        if (err) {
          return reject(err);
        }
        resolve(
          new HttpResponse({
            body: data.toString(),
          })
        );
      });
    });
  }

  static fromString(content: string): HttpResponse {
    return new HttpResponse({
      body: content,
    });
  }

  static fromOpts(opts: HttpResponseOptions): HttpResponse {
    return new HttpResponse(opts);
  }
}
