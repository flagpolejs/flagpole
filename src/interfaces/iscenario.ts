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
import { iAssertionContext, iNextCallback } from "./iassertioncontext";
import { iSuite } from "./isuite";
import { ScenarioType } from "../scenario-types";

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
  typeName: string;
  suite: iSuite;
  context: iAssertionContext<iScenario>;
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
  push(aliasName: string, value: any): this;
  set(aliasName: string, value: any): this;
  get<T = any>(aliasName: string): T;
  getLog(): Promise<iLogItem[]>;
  subscribe(callback: ScenarioStatusCallback): this;
  setJsonBody(jsonObject: any): this;
  setRawBody(str: string): this;
  verifyCert(verify: boolean): this;
  setProxy(proxy: HttpProxy): this;
  setTimeout(timeout: number): this;
  setTimeout(timeout: HttpTimeout): this;
  setFormData(form: FormData): this;
  setFormData(form: KeyValue, isMultipart?: boolean): this;
  setMaxRedirects(n: number): this;
  setBasicAuth(authorization: HttpAuth): this;
  setDigestAuth(authorization: HttpAuth): this;
  setBearerToken(token: string): this;
  setCookies(cookies: KeyValue): this;
  setCookie(key: string, value: string): this;
  setHeaders(headers: KeyValue): this;
  setHeader(key: string, value: any): this;
  setMethod(method: HttpMethodVerb): this;
  wait(bool?: boolean): this;
  comment(input: any): this;
  result(result: iAssertionResult): this;
  ignore(assertions?: boolean | Function): this;
  open(url: string, opts?: HttpRequestOptions): this;
  open(link: ValueLink, opts?: HttpRequestOptions): this;
  next(callback: iNextCallback): this;
  next(...callbacks: iNextCallback[]): this;
  next(message: string, callback: iNextCallback): this;
  next(responseValues: { [key: string]: any }): this;
  next(message: string, responseValues: { [key: string]: any }): this;
  nextPrepend(callback: iNextCallback): this;
  nextPrepend(message: string, callback: iNextCallback): this;
  skip(message?: string): Promise<this>;
  abort(message?: string): Promise<this>;
  cancel(message?: string): Promise<this>;
  cancelOrAbort(message?: string): Promise<this>;
  execute(): Promise<this>;
  execute(params: { [key: string]: string | number }): Promise<this>;
  success(message: string, callback: ScenarioCallback): this;
  success(callback: ScenarioCallback): this;
  success(...callbacks: ScenarioCallback[]): this;
  failure(message: string, callback: ScenarioCallback): this;
  failure(callback: ScenarioCallback): this;
  failure(...callbacks: ScenarioCallback[]): this;
  pipe(message: string, callback: ResponsePipe): this;
  pipe(callback: ResponsePipe): this;
  pipe(...callbacks: ResponsePipe[]): this;
  before(message: string, callback: ScenarioCallback): this;
  before(callback: ScenarioCallback): this;
  before(...callbacks: ScenarioCallback[]): this;
  after(message: string, callback: ScenarioCallback): this;
  after(callback: ScenarioCallback): this;
  after(...callbacks: ScenarioCallback[]): this;
  finally(message: string, callback: ScenarioCallback): this;
  finally(callback: ScenarioCallback): this;
  finally(...callbacks: ScenarioCallback[]): this;
  mock(): this;
  mock(content: string): this;
  mock(response: HttpResponseOptions): this;
  local(localPath: string): this;
  webhook(): this;
  webhook(route: string): this;
  webhook(route: string, port: number): this;
  webhook(route: string, port: number, opts: ServerOptions): this;
  webhook(route: string, opts: ServerOptions): this;
  webhook(port: number): this;
  webhook(port: number, opts: ServerOptions): this;
  webhook(opts: ServerOptions): this;
  server(): Promise<WebhookServer>;
  promise(): Promise<iScenario>;
  waitForFinished(): Promise<this>;
  waitForResponse(): Promise<this>;
  waitFor(thatScenario: iScenario): this;
  repeat(): iScenario;
  repeat(count: number): iScenario[];
  go(): void;
}
