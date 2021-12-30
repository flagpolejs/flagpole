import { NeedleResponse } from "needle";
import { readFile } from "fs-extra";
import { FfprobeData } from "media-probe";
import { probeImageResponse } from "./visual/image";
import { KeyValue } from "./interfaces/generic-types";
import { HttpResponseOptions, iHttpRequest } from "./interfaces/http";

export interface ffprobeResponse {
  headers: KeyValue;
  statusCode: number;
  url: string;
  length: number;
  probeData: FfprobeData;
}

export class HttpResponse {
  public body: string = "";
  public json: any = null;
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
    const r = new HttpResponse();
    r.statusCode = response.statusCode || 0;
    r.statusMessage = response.statusMessage || "";
    r.headers = <KeyValue>response.headers;
    r.body =
      typeof response.body === "string" ||
      response.headers["content-type"]?.includes("image")
        ? response.body
        : response.body.toString("utf8");
    r.json = response.headers["content-type"]?.includes("json")
      ? JSON.parse(r.body)
      : null;
    r.cookies = response.cookies ? <KeyValue>response.cookies : {};
    r.trailers = <KeyValue>response.trailers;
    r.method = response.method || "get";
    r.url = response.url || "";
    return r;
  }

  static fromJsonData(request: iHttpRequest, data: any): HttpResponse {
    const r = new HttpResponse();
    r.headers = {};
    r.statusCode = 200;
    r.body = "";
    r.json = data;
    r.url = request.uri || "";
    return r;
  }

  static fromProbeImage(
    response: probeImageResponse,
    cookies?: KeyValue
  ): HttpResponse {
    const r = new HttpResponse();
    r.headers = response.headers;
    r.statusCode = response.statusCode;
    r.json = {
      ...response.imageData,
      ...{
        length: response.length,
        url: response.url,
        mime: response.imageData.mimeType,
      },
    };
    r.body = "";
    r.cookies = cookies || {};
    r.url = response.url;
    return r;
  }

  static fromLocalFile(relativePath: string): Promise<HttpResponse> {
    const path: string = __dirname + "/" + relativePath;
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
