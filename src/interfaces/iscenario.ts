import { ClassConstructor, KeyValue } from "./generic-types";
import {
  HttpAuth,
  HttpMethodVerb,
  HttpProxy,
  HttpRequestOptions,
  HttpResponseOptions,
  HttpTimeout,
  iHttpRequest,
} from "./http";
import { iLogItem } from "./ilog-item";
import { WebhookServer } from "./webhook";
import { ServerOptions } from "https";
import { ScenarioDisposition, ScenarioStatusEvent } from "./enums";
import { ResponsePipe } from "./response-pipe";
import { iAssertionResult } from "./iassertion-result";
import { iNextCallback } from "./iassertioncontext";
import { iSuite, ScenarioType } from "..";

interface ValueLink {
  getUrl(): Promise<any>;
}

export type ScenarioConstructor = ClassConstructor<iScenario>;

export type ScenarioAsyncCallback = (
  scenario: iScenario,
  suite: iSuite
) => Promise<void>;
export type ScenarioSyncCallback = (scenario: iScenario, suite: iSuite) => void;
export type ScenarioCallback = ScenarioAsyncCallback | ScenarioSyncCallback;
export type ScenarioCallbackAndMessage = {
  message: string;
  callback: ScenarioCallback;
};

export type ScenarioTemplateInitOptions<T extends iScenario> = Omit<
  ScenarioInitOptions<T>,
  "type"
>;

export type ScenarioMapper = (
  value: any,
  index: number,
  arr: any[],
  suite: iSuite
) => iScenario;

export type ScenarioStatusCallback = (
  scenario: iScenario,
  status: ScenarioStatusEvent
) => any;

export interface ScenarioInitOptions<T extends iScenario> {
  type: ClassConstructor<T> | ScenarioType;
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
  next?: iNextCallback | { [title: string]: iNextCallback } | iNextCallback[];
  set?: KeyValue;
  statusCode?: number;
  maxLoadTime?: number;
  opts?: KeyValue;
}

export interface iScenario {
  title: string;
  type: ScenarioConstructor;
  suite: iSuite;
  opts: KeyValue;
  totalDuration: number | null;
  executionDuration: number | null;
  requestDuration: number | null;
  hasFailed: boolean;
  hasPassed: boolean;
  isReadyToExecute: boolean;
  hasExecuted: boolean;
  hasFinished: boolean;
  hasRequestStarted: boolean;
  buildUrl(): URL;
  url: string | null;
  finalUrl: string | null;
  redirectCount: number;
  redirectChain: string[];
  request: iHttpRequest;
  hasAborted: boolean;
  hasBeenCancelled: boolean;
  hasBeenSkipped: boolean;
  isPending: boolean;
  isExecuting: boolean;
  isCompleted: boolean;
  disposition: ScenarioDisposition;
  nextCallbacks: Array<{
    message: string;
    callback: iNextCallback;
  }>;
  push(aliasName: string, value: any): iScenario;
  set(aliasName: string, value: any): iScenario;
  get<T = any>(aliasName: string): T;
  getLog(): Promise<iLogItem[]>;
  subscribe(callback: ScenarioStatusCallback): iScenario;
  setJsonBody(jsonObject: any): iScenario;
  setRawBody(str: string): iScenario;
  verifyCert(verify: boolean): iScenario;
  setProxy(proxy: HttpProxy): iScenario;
  setTimeout(timeout: number): iScenario;
  setTimeout(timeout: HttpTimeout): iScenario;
  setFormData(form: FormData): iScenario;
  setFormData(form: KeyValue, isMultipart?: boolean): iScenario;
  setMaxRedirects(n: number): iScenario;
  setBasicAuth(authorization: HttpAuth): iScenario;
  setDigestAuth(authorization: HttpAuth): iScenario;
  setBearerToken(token: string): iScenario;
  setCookies(cookies: KeyValue): iScenario;
  setCookie(key: string, value: string): iScenario;
  setHeaders(headers: KeyValue): iScenario;
  setHeader(key: string, value: any): iScenario;
  setMethod(method: HttpMethodVerb): iScenario;
  wait(bool?: boolean): iScenario;
  comment(input: any): iScenario;
  result(result: iAssertionResult): iScenario;
  ignore(assertions?: boolean | Function): iScenario;
  open(url: string, opts?: HttpRequestOptions): iScenario;
  open(link: ValueLink, opts?: HttpRequestOptions): iScenario;
  next(callback: iNextCallback): iScenario;
  next(...callbacks: iNextCallback[]): iScenario;
  next(message: string, callback: iNextCallback): iScenario;
  next(responseValues: { [key: string]: any }): iScenario;
  next(message: string, responseValues: { [key: string]: any }): iScenario;
  nextPrepend(callback: iNextCallback): iScenario;
  nextPrepend(message: string, callback: iNextCallback): iScenario;
  skip(message?: string): Promise<iScenario>;
  abort(message?: string): Promise<iScenario>;
  cancel(message?: string): Promise<iScenario>;
  cancelOrAbort(message?: string): Promise<iScenario>;
  execute(): Promise<iScenario>;
  execute(params: { [key: string]: string | number }): Promise<iScenario>;
  success(message: string, callback: ScenarioCallback): iScenario;
  success(callback: ScenarioCallback): iScenario;
  success(...callbacks: ScenarioCallback[]): iScenario;
  failure(message: string, callback: ScenarioCallback): iScenario;
  failure(callback: ScenarioCallback): iScenario;
  failure(...callbacks: ScenarioCallback[]): iScenario;
  pipe(message: string, callback: ResponsePipe): iScenario;
  pipe(callback: ResponsePipe): iScenario;
  pipe(...callbacks: ResponsePipe[]): iScenario;
  before(message: string, callback: ScenarioCallback): iScenario;
  before(callback: ScenarioCallback): iScenario;
  before(...callbacks: ScenarioCallback[]): iScenario;
  after(message: string, callback: ScenarioCallback): iScenario;
  after(callback: ScenarioCallback): iScenario;
  after(...callbacks: ScenarioCallback[]): iScenario;
  finally(message: string, callback: ScenarioCallback): iScenario;
  finally(callback: ScenarioCallback): iScenario;
  finally(...callbacks: ScenarioCallback[]): iScenario;
  mock(): iScenario;
  mock(content: string): iScenario;
  mock(response: HttpResponseOptions): iScenario;
  local(localPath: string): iScenario;
  webhook(): iScenario;
  webhook(route: string): iScenario;
  webhook(route: string, port: number): iScenario;
  webhook(route: string, port: number, opts: ServerOptions): iScenario;
  webhook(route: string, opts: ServerOptions): iScenario;
  webhook(port: number): iScenario;
  webhook(port: number, opts: ServerOptions): iScenario;
  webhook(opts: ServerOptions): iScenario;
  server(): Promise<WebhookServer>;
  promise(): Promise<iScenario>;
  waitForFinished(): Promise<iScenario>;
  waitForResponse(): Promise<iScenario>;
  waitFor(thatScenario: iScenario): iScenario;
  repeat(): iScenario;
  repeat(count: number): iScenario[];
  go(): void;
}
