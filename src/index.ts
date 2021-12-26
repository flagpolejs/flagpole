import { Assertion } from "./assertion";
import { AssertionContext } from "./assertion-context";
import { AssertionResult } from "./logging/assertion-result";
import { BrowserControl } from "./puppeteer/browser-control";
import { BrowserResponse } from "./puppeteer/browser-response";
import { DOMElement } from "./html/dom-element";
import { ExtJSResponse } from "./puppeteer/extjs-response";
import { HtmlResponse } from "./html/html-response";
import { HttpResponse } from "./http-response";
import { ImageResponse } from "./visual/image-response";
import { JsonResponse } from "./json/json-response";
import { ResourceResponse } from "./resource-response";
import { ProtoResponse } from "./response";
import { Scenario } from "./scenario";
import { Suite } from "./suite";
import { Value } from "./value";
import { HLSResponse } from "./media/hls-response";
import { HeadersResponse } from "./headers-response";
import { Flagpole } from "./flagpole";
import {
  iResponse,
  iValue,
  iScenario,
  iSuite,
  BrowserOptions,
  HttpAuth,
} from "./interfaces";
import { HttpRequest } from "./http-request";
import { FlagpoleExecution } from "./flagpole-execution";
import { ScenarioType } from "./scenario-types";
import { AppiumResponse } from "./appium/appium-response";

// Aliases
const fp = Flagpole;
const execution = FlagpoleExecution.global;

export default Flagpole.suite;

export {
  Flagpole,
  FlagpoleExecution,
  Suite,
  Scenario,
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
  AppiumResponse,
  iScenario,
  iSuite,
  fp,
  execution,
};
