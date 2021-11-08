import { Assertion } from "./assertion";
import { AssertionContext } from "./assertioncontext";
import { AssertionResult } from "./logging/assertionresult";
import { BrowserControl } from "./puppeteer/browser-control";
import { BrowserResponse } from "./puppeteer/browser-response";
import { DOMElement } from "./html/dom-element";
import { ExtJSResponse } from "./puppeteer/extjs-response";
import { HtmlResponse } from "./html/html-response";
import { HttpResponse } from "./httpresponse";
import { ImageResponse } from "./image/image-response";
import { JsonResponse } from "./json/json-response";
import { ResourceResponse } from "./resourceresponse";
import { ProtoResponse } from "./response";
import { Suite } from "./suite";
import { Value } from "./value";
import { HLSResponse } from "./media/hls-response";
import { HeadersResponse } from "./headers/headers-response";
import { Flagpole } from "./flagpole";
import {
  iResponse,
  iValue,
  iScenario,
  iSuite,
  BrowserOptions,
  HttpAuth,
} from "./interfaces";
import { HttpRequest } from "./httprequest";
import { FlagpoleExecution } from "./flagpoleexecution";
import { ScenarioType } from "./scenario-types";

// Aliases
const fp = Flagpole;
const execution = FlagpoleExecution.global;

export default Flagpole.suite;

export {
  Flagpole,
  FlagpoleExecution,
  Suite,
  Assertion,
  AssertionContext,
  AssertionResult,
  BrowserControl,
  BrowserOptions,
  BrowserResponse,
  DOMElement,
  ExtJSResponse,
  HtmlResponse,
  ImageResponse,
  JsonResponse,
  ResourceResponse,
  ScenarioType,
  ProtoResponse,
  iResponse,
  HttpRequest,
  HttpResponse,
  HttpAuth,
  iValue,
  Value,
  HLSResponse,
  HeadersResponse,
  iScenario,
  iSuite,
  fp,
  execution,
};
