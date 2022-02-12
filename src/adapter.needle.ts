import needle = require("needle");
import { FlagpoleExecution } from "./flagpole-execution";
import {
  CONTENT_TYPE_FORM_MULTIPART,
  CONTENT_TYPE_JSON,
  ENCODING_GZIP,
} from "./interfaces/constants";
import { Adapter } from "./adapter";
import { HttpRequest } from "./http/http-request";
import { HttpResponse } from "./http/http-response";
import { KeyValue } from "./interfaces/generic-types";

export type NeedleAdapterOptions = {
  redirect: (...args: any[]) => void;
};

export const getNeedleOptions = (
  request: HttpRequest
): needle.NeedleOptions => {
  return {
    agent: request.proxyAgent,
    auth: request.authType,
    compressed: request.headers["Accept-Encoding"] === ENCODING_GZIP,
    cookies: request.cookies,
    follow_max: request.maxRedirects,
    headers: request.headers,
    json: request.headers["Content-Type"] === CONTENT_TYPE_JSON,
    multipart: request.headers["Content-Type"] === CONTENT_TYPE_FORM_MULTIPART,
    open_timeout: request.timeout.open,
    output: request.outputFile,
    parse_cookies: true,
    parse_response: false,
    password: request.auth?.password,
    read_timeout: request.timeout.read,
    rejectUnauthorized: request.verifyCert,
    username: request.auth?.username,
    user_agent: "Flagpole",
  };
};

const parseResponseFromNeedle = (response: needle.NeedleResponse) =>
  new HttpResponse({
    status: [response.statusCode || 0, response.statusMessage || ""],
    headers: <KeyValue>response.headers,
    body:
      typeof response.body === "string" ||
      response.headers["content-type"]?.includes("image")
        ? response.body
        : response.body.toString("utf8"),
    cookies: response.cookies ? <KeyValue>response.cookies : {},
    trailers: <KeyValue>response.trailers,
    method: response.method || "get",
    url: response.url || "",
    rawBody: response.raw,
  });

export class NeedleAdapter implements Adapter {
  public fetch(
    req: HttpRequest,
    opts?: NeedleAdapterOptions
  ): Promise<HttpResponse> {
    return new Promise((resolve, reject) => {
      if (req.options.cacheKey) {
        const response = FlagpoleExecution.global.getCache(
          req.options.cacheKey
        );
        if (response !== null) {
          return resolve(response as HttpResponse);
        }
      }
      const stream = needle.request(
        // Needle doesn't support "options"
        req.method === "options" ? "head" : req.method,
        req.uri || "/",
        req.data || null,
        getNeedleOptions(req),
        (err, resp) => {
          if (!err && resp) {
            const response = parseResponseFromNeedle(resp);
            if (req.options.cacheKey) {
              FlagpoleExecution.global.setCache(req.options.cacheKey, response);
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
}
