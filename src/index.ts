import { Assertion } from "./assertion";
import { AssertionContext } from "./assertioncontext";
import { AssertionResult } from "./logging/assertionresult";
import {
  iAssertionSchema,
  iAssertionSchemaItem,
  AssertionSchema,
} from "./assertionschema";
import { BrowserControl } from "./browsercontrol";
import { BrowserResponse } from "./browserresponse";
import { CssResponse } from "./cssresponse";
import { DOMElement } from "./domelement";
import { ExtJSResponse } from "./extjsresponse";
import { HtmlResponse } from "./htmlresponse";
import { HttpResponse } from "./httpresponse";
import { ImageResponse } from "./imageresponse";
import { jPath, iJPath } from "./jpath";
import { JsonResponse } from "./jsonresponse";
import { ResourceResponse } from "./resourceresponse";
import { ProtoResponse } from "./response";
import { Scenario } from "./scenario";
import { ScriptResponse } from "./scriptresponse";
import { Suite } from "./suite";
import { Value } from "./value";
import { VideoResponse } from "./videoresponse";
import {
  FlagpoleExecutionOptions,
  FlagpoleOutput,
} from "./flagpoleexecutionoptions";
import { Flagpole } from "./flagpole";
import { ResponseType } from "./enums";
import { iResponse, iValue, iScenario, iSuite } from "./interfaces";
import { BrowserOptions, HttpRequest } from "./httprequest";
import * as Promise from "bluebird";

// Have Bluebird replace default promises
global.Promise = Promise;

// Aliases
const fp = Flagpole;
const suite = (...args: any) => {
  // Not sure why I needed to do this proxy way, but Flagpole was undefined once transpiled if I didn't.
  return Flagpole.suite(args[0], args[1]);
};

export {
  Flagpole,
  FlagpoleExecutionOptions,
  FlagpoleOutput,
  Suite,
  Scenario,
  Assertion,
  AssertionContext,
  AssertionResult,
  iAssertionSchema,
  iAssertionSchemaItem,
  AssertionSchema,
  BrowserControl,
  BrowserOptions,
  BrowserResponse,
  CssResponse,
  DOMElement,
  ExtJSResponse,
  HtmlResponse,
  ImageResponse,
  JsonResponse,
  ResourceResponse,
  ResponseType,
  ProtoResponse,
  iResponse,
  HttpRequest,
  HttpResponse,
  ScriptResponse,
  iValue,
  Value,
  VideoResponse,
  jPath,
  iJPath,
  iScenario,
  iSuite,
  fp,
  suite,
};
