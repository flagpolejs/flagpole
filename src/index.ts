import { Assertion } from "./assertion";
import { AssertionContext } from "./assertioncontext";
import { AssertionResult } from "./logging/assertionresult";
import { BrowserControl } from "./puppeteer/browsercontrol";
import { BrowserResponse } from "./puppeteer/browserresponse";
import { DOMElement } from "./html/domelement";
import { ExtJSResponse } from "./puppeteer/extjsresponse";
import { HtmlResponse } from "./html/htmlresponse";
import { HttpResponse } from "./httpresponse";
import { ImageResponse } from "./imageresponse";
import { JsonResponse } from "./json/jsonresponse";
import { ResourceResponse } from "./resourceresponse";
import { ProtoResponse } from "./response";
import { Scenario } from "./scenario";
import { Suite } from "./suite";
import { Value } from "./value";
import { HLSResponse } from "./media/hlsresponse";
import { HeadersResponse } from "./headersresponse";
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
  iScenario,
  iSuite,
  fp,
  execution,
};
