import { Cookie } from "tough-cookie";
import { IncomingMessage } from "http";
import * as puppeteer from "puppeteer-core";
import request = require("request");

export class HttpResponse {
  public body: string = "";
  public statusCode: number = 0;
  public statusMessage: string = "";
  public headers: { [key: string]: string } = {};
  public cookies: Cookie[] = [];

  private constructor() {}

  static createEmpty() {
    const r = new HttpResponse();
    return r;
  }

  static fromRequest(
    response: request.Response,
    cookies: Cookie[]
  ): HttpResponse {
    const r = new HttpResponse();
    r.statusCode = response.statusCode || 0;
    r.statusMessage = response.statusMessage || "";
    r.headers = <{ [key: string]: string }>response.headers;
    r.body = response.body;
    r.cookies = cookies;
    return r;
  }

  static fromPuppeteer(
    response: puppeteer.Response,
    body: string,
    cookies: Cookie[]
  ): HttpResponse {
    const r = new HttpResponse();
    r.statusCode = response.status();
    r.statusMessage = response.statusText();
    r.headers = response.headers();
    r.body = body;
    r.cookies = cookies;
    //r.url = response.url();
    return r;
  }

  static fromProbeImage(response: any, cookies: Cookie[]): HttpResponse {
    const r = new HttpResponse();
    r.headers = {
      "content-type": response.mime
    };
    r.body = JSON.stringify(response);
    return r;
  }

  static fromLocalFile(relativePath: string): Promise<HttpResponse> {
    const r = new HttpResponse();
    let fs = require("fs");
    let path: string = __dirname + "/" + relativePath;
    return new Promise((resolve, reject) => {
      fs.readFile(path, function(err, data) {
        if (err) {
          return reject(err);
        }
        r.body = data.toString();
        //r.url = path;
        resolve(r);
      });
    });
  }
}
