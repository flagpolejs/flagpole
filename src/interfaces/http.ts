import { JsonData } from "../json/jpath";
import { KeyValue, HttpHeaders } from "./generic-types";

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

export interface HttpResponseOptions {
  body?: string;
  jsonBody?: JsonData;
  rawBody?: any;
  status?: [number, string];
  headers?: HttpHeaders;
  cookies?: KeyValue;
  trailers?: KeyValue;
  method?: string;
  url?: string;
}
