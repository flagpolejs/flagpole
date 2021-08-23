import { HtmlResponse } from "./html/htmlresponse";
import { ResourceResponse } from "./resourceresponse";
import { BrowserResponse } from "./puppeteer/browserresponse";
import { ImageResponse } from "./imageresponse";
import { JsonResponse } from "./json/jsonresponse";
import { ExtJSResponse } from "./puppeteer/extjsresponse";
import { HttpRequestFetch, iResponse, iScenario } from "./interfaces";
import { XmlResponse } from "./xml/xmlresponse";
import { RssResponse } from "./xml/rssresponse";
import { AtomResponse } from "./xml/atomresponse";
import { HeadersResponse } from "./headersresponse";
import { HLSResponse } from "./media/hlsresponse";
import { FfprobeResponse } from "./media/ffproberesponse";
import { MediaStreamValidatorResponse } from "./media/mediastreamvalidatorresponse";
import { fetchWithNeedle } from "./adapters/needle";
import { fetchWithFfprobe } from "./adapters/ffprobe";
import { fetchWithMediaStreamValidator } from "./adapters/mediastreamvalidator";
import { fetchImageWithNeedle } from "./adapters/image";

const typeToClassMap: { [type: string]: any } = {
  html: HtmlResponse,
  browser: BrowserResponse,
  extjs: ExtJSResponse,
  image: ImageResponse,
  json: JsonResponse,
  xml: XmlResponse,
  rss: RssResponse,
  atom: AtomResponse,
  headers: HeadersResponse,
  hls: HLSResponse,
  ffprobe: FfprobeResponse,
  resource: ResourceResponse,
  mediastreamvalidator: MediaStreamValidatorResponse,
};

const typeToFetchAdapter: { [type: string]: HttpRequestFetch } = {
  html: fetchWithNeedle,
  json: fetchWithNeedle,
  xml: fetchWithNeedle,
  rss: fetchWithNeedle,
  atom: fetchWithNeedle,
  headers: fetchWithNeedle,
  hls: fetchWithNeedle,
  resource: fetchWithNeedle,
  ffprobe: fetchWithFfprobe,
  mediastreamvalidator: fetchWithMediaStreamValidator,
  image: fetchImageWithNeedle,
};

export function createResponse(scenario: iScenario): iResponse {
  const className: any =
    typeToClassMap[scenario.responseType] || ResourceResponse;
  return new className(scenario);
}

export const getRequestAdapter = (scenario: iScenario): HttpRequestFetch => {
  return typeToFetchAdapter[scenario.responseType];
};
