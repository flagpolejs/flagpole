import { Flagpole } from "./flagpole";
import { FlagpoleExecution } from "./flagpole-execution";
import { iSuite } from "./interfaces/isuite";
import { iValue } from "./interfaces/ivalue";
import { iResponse } from "./interfaces/iresponse";
import { iScenario } from "./interfaces/iscenario";
import { HttpRequest } from "./http/http-request";
import { Assertion } from "./assertion/assertion";
import { AssertionContext } from "./assertion/assertion-context";
import { AssertionResult } from "./logging/assertion-result";
import { BrowserResponse } from "./puppeteer/browser-response";
import { DOMElement } from "./html/dom-element";
import { ExtJSResponse } from "./puppeteer/extjs-response";
import { HtmlResponse } from "./html/html-response";
import { HttpResponse } from "./http/http-response";
import { ImageResponse } from "./visual/image-response";
import { JsonResponse } from "./json/json-response";
import { ResourceResponse } from "./resource/resource-response";
import { ProtoResponse } from "./response";
import { ProtoScenario } from "./scenario";
import { Suite } from "./suite/suite";
import { Value } from "./value";
import { ValuePromise } from "./value-promise";
import { HlsResponse } from "./media/hls-response";
import { HlsScenario } from "./media/hls-scenario";
import { HeadersResponse } from "./headers/headers-response";
import { AppiumResponse } from "./appium/appium-response";
import { AppiumScenario } from "./appium/appium-scenario";
import { HtmlScenario } from "./html/html-scenario";
import { JsonScenario } from "./json/json-scenario";

// Aliases
const execution = FlagpoleExecution.global;

export default Flagpole.suite;

export {
  Flagpole,
  FlagpoleExecution,
  Suite,
  Assertion,
  AssertionContext,
  AssertionResult,
  BrowserResponse,
  DOMElement,
  ExtJSResponse,
  HtmlResponse,
  ImageResponse,
  JsonResponse,
  ResourceResponse,
  ProtoResponse,
  iResponse,
  HttpRequest,
  HttpResponse,
  iValue,
  Value,
  HlsResponse,
  HeadersResponse,
  AppiumResponse,
  iScenario,
  iSuite,
  execution,
  ProtoScenario,
  ValuePromise,
  AppiumScenario,
  HtmlScenario,
  JsonScenario,
  HlsScenario,
};
