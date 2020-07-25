import { HtmlResponse } from "./html/htmlresponse";
import { ResourceResponse } from "./resourceresponse";
import { BrowserResponse } from "./puppeteer/browserresponse";
import { CssResponse } from "./css/cssresponse";
import { ImageResponse } from "./imageresponse";
import { JsonResponse } from "./json/jsonresponse";
import { ScriptResponse } from "./scriptresponse";
import { VideoResponse } from "./videoresponse";
import { ExtJSResponse } from "./puppeteer/extjsresponse";
import { ResponseType } from "./enums";
import { iResponse, iScenario } from "./interfaces";
import { XmlResponse } from "./xml/xmlresponse";
import { RssResponse } from "./xml/rssresponse";
import { AtomResponse } from "./xml/atomresponse";

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
  } else if (type == "xml") {
    className = XmlResponse;
  } else if (type == "rss") {
    className = RssResponse;
  } else if (type == "atom") {
    className = AtomResponse;
  } else {
    className = ResourceResponse;
  }
  return new className(scenario);
}
