import { HtmlResponse } from "./htmlresponse";
import { ResourceResponse } from "./resourceresponse";
import { BrowserResponse } from "./browserresponse";
import { CssResponse } from "./cssresponse";
import { ImageResponse } from "./imageresponse";
import { JsonResponse } from "./jsonresponse";
import { ScriptResponse } from "./scriptresponse";
import { VideoResponse } from "./videoresponse";
import { ExtJSResponse } from "./extjsresponse";
import { ResponseType } from "./enums";
import { iResponse, iScenario } from "./interfaces";

export function createResponse(scenario: iScenario): iResponse {
  const type: ResponseType = scenario.responseType;
  let className;
  if (type == "html") {
    className = HtmlResponse;
  } else if (type == "browser") {
    className = BrowserResponse;
  } else if (type == "extjs") {
    className = ExtJSResponse;
  } else if (type == "stylesheet") {
    className = CssResponse;
  } else if (type == "image") {
    className = ImageResponse;
  } else if (type == "json") {
    className = JsonResponse;
  } else if (type == "script") {
    className = ScriptResponse;
  } else if (type == "video") {
    className = VideoResponse;
  } else {
    className = ResourceResponse;
  }
  return new className(scenario);
}
