import { HtmlResponse } from "./html/htmlresponse";
import { ResourceResponse } from "./resourceresponse";
import { BrowserResponse } from "./puppeteer/browserresponse";
import { CssResponse } from "./css/cssresponse";
import { ImageResponse } from "./imageresponse";
import { JsonResponse } from "./json/jsonresponse";
import { ScriptResponse } from "./scriptresponse";
import { VideoResponse } from "./media/videoresponse";
import { ExtJSResponse } from "./puppeteer/extjsresponse";
import { ResponseType } from "./enums";
import { iResponse, iScenario } from "./interfaces";
import { XmlResponse } from "./xml/xmlresponse";
import { RssResponse } from "./xml/rssresponse";
import { AtomResponse } from "./xml/atomresponse";
import { HeadersResponse } from "./headersresponse";
import { HLSResponse } from "./media/hlsresponse";
import { FfprobeResponse } from "./media/ffproberesponse";

const typeToClassMap: { [type: string]: any } = {
  html: HtmlResponse,
  browser: BrowserResponse,
  extjs: ExtJSResponse,
  stylesheet: CssResponse,
  image: ImageResponse,
  json: JsonResponse,
  script: ScriptResponse,
  xml: XmlResponse,
  rss: RssResponse,
  atom: AtomResponse,
  headers: HeadersResponse,
  video: VideoResponse,
  hls: HLSResponse,
  ffprobe: FfprobeResponse,
};

export function createResponse(scenario: iScenario): iResponse {
  const className: any =
    typeToClassMap[scenario.responseType] || ResourceResponse;
  return new className(scenario);
}
