import { Scenario } from "../scenario";
import { ClassConstructor, KeyValue } from "./generic-types";
import {
  HttpAuth,
  HttpMethodVerb,
  HttpProxy,
  HttpRequestOptions,
} from "./http";
import { NextCallback } from "./next-callback";

export interface ScenarioInitOptions<T extends Scenario> {
  type: ClassConstructor<T>;
  bearerToken?: string;
  url?: string;
  httpRequestOpts?: HttpRequestOptions;
  jsonBody?: any;
  method?: HttpMethodVerb;
  headers?: KeyValue;
  cookies?: KeyValue;
  rawBody?: string;
  proxy?: HttpProxy;
  timeout?: number;
  formData?: KeyValue;
  basicAuth?: HttpAuth;
  digestAuth?: HttpAuth;
  maxRedirects?: number;
  next?:
    | NextCallback<any>
    | { [title: string]: NextCallback<any> }
    | NextCallback<any>[];
  set?: KeyValue;
  statusCode?: number;
  maxLoadTime?: number;
  opts?: KeyValue;
}
