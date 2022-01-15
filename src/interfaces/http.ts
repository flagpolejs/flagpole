import { KeyValue } from "./generic-types";
import * as http from "http";

export const HttpMethodVerbArray = [
  "get",
  "head",
  "delete",
  "patch",
  "post",
  "put",
  "options",
] as const;
export type HttpMethodVerb = typeof HttpMethodVerbArray[number];

export type HttpAuthType = "basic" | "digest" | "auto";

export type HttpAdapter = (
  request: iHttpRequest,
  opts?: KeyValue
) => Promise<iHttpResponse>;

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
  customOpts?: KeyValue;
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
  uri?: string | null;
  verifyCert?: boolean;
  cacheKey?: string;
};

export interface iHttpRequest {
  uri: string | null;
  method: HttpMethodVerb;
  headers: KeyValue;
  cookies: KeyValue;
  verifyCert: boolean;
  proxy: HttpProxy | undefined;
  timeout: HttpTimeout;
  maxRedirects: number;
  auth: HttpAuth | undefined;
  authType?: HttpAuthType;
  data: HttpData;
  customOpts?: KeyValue;
  outputFile?: string;
  options: HttpRequestOptions;
  proxyAgent?: http.Agent;
}

export interface HttpResponseOptions {
  body?: string;
  jsonBody?: any;
  rawBody?: any;
  status?: [number, string];
  headers?: KeyValue;
  cookies?: KeyValue;
  trailers?: KeyValue;
  method?: string;
  url?: string;
}

export interface iHttpResponse {
  body: string;
  jsonBody: any;
  rawBody: any;
  status: [statusCode: number, statusMessage: string];
  statusCode: number;
  statusMessage: string;
  headers: KeyValue;
  cookies: KeyValue;
  trailers: KeyValue;
  url: string;
  method: string;
}
