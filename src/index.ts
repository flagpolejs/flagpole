import { Assertion } from "./assertion";
import { AssertionContext } from "./assertion-context";
import { AssertionResult } from "./logging/assertion-result";
import { BrowserControl } from "./puppeteer/browser-control";
import { BrowserResponse } from "./puppeteer/browser-response";
import { BrowserOptions } from "./puppeteer/browser-opts";
import { DOMElement } from "./html/dom-element";
import { ExtJSResponse } from "./puppeteer/extjs-response";
import { HtmlResponse } from "./html/html-response";
import { HttpResponse } from "./http-response";
import { ImageResponse } from "./visual/image-response";
import { JsonResponse } from "./json/json-response";
import { ResourceResponse } from "./resource/resource-response";
import { ProtoResponse } from "./response";
import { ProtoScenario } from "./scenario";
import { Suite } from "./suite";
import { Value } from "./value";
import { ValuePromise } from "./value-promise";
import { HLSResponse } from "./media/hls-response";
import { HlsScenario } from "./media/hls-scenario";
import { HeadersResponse } from "./headers/headers-response";
import { Flagpole } from "./flagpole";
import { iResponse, iValue, iScenario, iSuite, HttpAuth } from "./interfaces";
import { HttpRequest } from "./http-request";
import { FlagpoleExecution } from "./flagpole-execution";
import { ScenarioType } from "./scenario-types";
import { AppiumResponse } from "./appium/appium-response";
import { AppiumScenario } from "./appium/appium-scenario";
import { HtmlScenario } from "./html/html-scenario";
import { JsonScenario } from "./json/json-scenario";

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
  AppiumResponse,
  iScenario,
  iSuite,
  fp,
  execution,
  ProtoScenario,
  ValuePromise,
  AppiumScenario,
  HtmlScenario,
  JsonScenario,
  HlsScenario,
};
