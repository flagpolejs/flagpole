import * as puppeteer from "puppeteer-core";
import { NeedleResponse } from "needle";
import { KeyValue } from "./interfaces";

export type probeImageResponse = {
  width: number;
  height: number;
  type: string;
  mime: string;
  wUnits: string;
  hUnits: string;
  url: string;
};

export class HttpResponse {
  public body: string = "";
  public statusCode: number = 0;
  public statusMessage: string = "";
  public headers: KeyValue = {};
  public cookies: KeyValue = {};

  private constructor() {}

  static createEmpty() {
    const r = new HttpResponse();
    return r;
  }

  static fromNeedle(response: NeedleResponse): HttpResponse {
    const r = new HttpResponse();
    r.statusCode = response.statusCode || 0;
    r.statusMessage = response.statusMessage || "";
    r.headers = <KeyValue>response.headers;
    r.body = response.body;
    r.cookies = response.cookies ? <KeyValue>response.cookies : {};
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
    return r;
  }

  static fromProbeImage(
    response: probeImageResponse,
    cookies?: KeyValue
  ): HttpResponse {
    const r = new HttpResponse();
    r.headers = {
      "content-type": response.mime,
    };
    r.body = JSON.stringify(response);
    r.cookies = cookies || {};
    return r;
  }

  static fromLocalFile(relativePath: string): Promise<HttpResponse> {
    const r = new HttpResponse();
    let fs = require("fs");
    let path: string = __dirname + "/" + relativePath;
    return new Promise((resolve, reject) => {
      fs.readFile(path, function (err, data) {
        if (err) {
          return reject(err);
        }
        r.body = data.toString();
        resolve(r);
      });
    });
  }
}
