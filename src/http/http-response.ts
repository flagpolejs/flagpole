import { HttpHeaders, KeyValue } from "../interfaces/generic-types";
import { HttpResponseOptions } from "../interfaces/http";
import { CONTENT_TYPE_JSON } from "../interfaces/constants";
import { JsonData } from "../json/jpath";

export const parseResponsefromJsonData = (jsonBody: any): HttpResponse =>
  new HttpResponse({
    headers: {
      "content-type": CONTENT_TYPE_JSON,
    },
    jsonBody,
  });

export const createEmptyResponse = () =>
  new HttpResponse({
    body: "",
  });

export const parseResponseFromString = (body: string) =>
  new HttpResponse({
    body,
  });

export class HttpResponse {
  public get method(): string {
    return this.opts.method || "get";
  }

  public get url(): string {
    return this.opts.url || "/";
  }

  public get headers(): HttpHeaders {
    return this.opts.headers || {};
  }

  public get trailers(): KeyValue {
    return this.opts.trailers || {};
  }

  public get cookies(): KeyValue {
    return this.opts.cookies || {};
  }

  public get statusCode(): number {
    return this.opts.status ? this.opts.status[0] : 200;
  }

  public get statusMessage(): string {
    return this.opts.status ? this.opts.status[1] : "OK";
  }

  public get status(): [statusCode: number, statusMessage: string] {
    return this.opts.status || [200, "OK"];
  }

  public get body(): string {
    return this.opts.body !== undefined
      ? this.opts.body
      : this.opts.rawBody !== undefined
      ? String(this.opts.rawBody)
      : this.opts.jsonBody !== undefined
      ? JSON.stringify(this.opts.jsonBody)
      : "";
  }

  public get rawBody(): any {
    return this.opts.rawBody !== undefined
      ? this.opts.rawBody
      : this.opts.body !== undefined
      ? this.opts.body
      : this.opts.jsonBody !== undefined
      ? JSON.stringify(this.opts.jsonBody)
      : "";
  }

  public get jsonBody(): JsonData {
    try {
      if (this.opts.jsonBody !== undefined) return this.opts.jsonBody;
      return this.opts.body != undefined
        ? JSON.parse(this.opts.body)
        : this.opts.rawBody != undefined
        ? JSON.parse(this.opts.rawBody)
        : null;
    } catch (ex) {
      return null;
    }
  }

  public constructor(private opts: HttpResponseOptions) {}
}
