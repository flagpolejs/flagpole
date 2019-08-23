
import { Assertion } from "./assertion";
import { AssertionContext } from "./assertioncontext";
import { AssertionResult } from "./logging/assertionresult";
import { iAssertionSchema, iAssertionSchemaItem, AssertionSchema } from "./assertionschema";
import { Browser, BrowserOptions } from "./browser";
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
import { ResponseType, ProtoResponse, iResponse } from "./response";
import { Scenario } from "./scenario";
import { ScriptResponse } from "./scriptresponse";
import { Suite } from "./suite";
import { Value, iValue } from "./value";
import { VideoResponse } from "./videoresponse";
import { FlagpoleExecutionOptions, FlagpoleOutput } from './flagpoleexecutionoptions';
import { Flagpole } from "./flagpole";

Flagpole.executionOpts = FlagpoleExecutionOptions.createWithArgs(process.argv);

export {
    Flagpole, FlagpoleExecutionOptions, FlagpoleOutput,
    Suite, Scenario,
    Assertion, AssertionContext, AssertionResult, iAssertionSchema, iAssertionSchemaItem, AssertionSchema,
    Browser, BrowserOptions, BrowserResponse, CssResponse, DOMElement, ExtJSResponse,
    HtmlResponse, ImageResponse, JsonResponse, ResourceResponse,
    ResponseType, ProtoResponse, iResponse, HttpResponse,
    ScriptResponse, iValue, Value, VideoResponse,
    jPath, iJPath
};
