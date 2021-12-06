import { HttpResponse } from "../httpresponse";
import {
  HttpRequestFetch,
  iHttpRequest,
  KeyValue,
  ENCODING_GZIP,
  CONTENT_TYPE_JSON,
  CONTENT_TYPE_FORM_MULTIPART,
} from "../interfaces";
import needle = require("needle");
import { FlagpoleExecution } from "../flagpoleexecution";

export const getNeedleOptions = (
  request: iHttpRequest
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

export const fetchWithNeedle: HttpRequestFetch = (
  request: iHttpRequest,
  opts?: KeyValue
): Promise<HttpResponse> => {
  return new Promise((resolve, reject) => {
    if (request.options.cacheKey) {
      const response = FlagpoleExecution.global.getCache(
        request.options.cacheKey
      );
      if (response !== null) {
        return resolve(response as HttpResponse);
      }
    }
    const stream = needle.request(
      // Needle doesn't support "options"
      request.method === "options" ? "head" : request.method,
      request.uri || "/",
      request.data || null,
      getNeedleOptions(request),
      (err, resp) => {
        console.log(request.uri);
        if (!err && resp) {
          const response = HttpResponse.fromNeedle(resp);
          if (request.options.cacheKey) {
            FlagpoleExecution.global.setCache(
              request.options.cacheKey,
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
};
