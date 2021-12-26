import { HtmlResponse } from "./html/html-response";
import { ResourceResponse } from "./resource-response";
import { BrowserResponse } from "./puppeteer/browser-response";
import { ImageResponse } from "./visual/image-response";
import { JsonResponse } from "./json/json-response";
import { ExtJSResponse } from "./puppeteer/extjs-response";
import { HttpRequestFetch, iResponse, iScenario } from "./interfaces";
import { XmlResponse } from "./xml/xml-response";
import { RssResponse } from "./xml/rss-response";
import { AtomResponse } from "./xml/atom-response";
import { HeadersResponse } from "./headers-response";
import { HLSResponse } from "./media/hls-response";
import { FfprobeResponse } from "./media/ffprobe-response";
import { MediaStreamValidatorResponse } from "./media/media-stream-validator-response";
import { fetchWithNeedle } from "./adapters/needle";
import { fetchWithFfprobe } from "./adapters/ffprobe";
import { fetchWithMediaStreamValidator } from "./adapters/media-stream-validator";
import { fetchImageWithNeedle } from "./adapters/image";
import { SoapResponse } from "./xml/soap-response";
import { AppiumResponse } from "./appium/appium-response";

type ClassDef = new (...args: any[]) => any;

const typeToClassMap: { [type: string]: ClassDef } = {
  html: HtmlResponse,
  browser: BrowserResponse,
  extjs: ExtJSResponse,
  image: ImageResponse,
  json: JsonResponse,
  xml: XmlResponse,
  rss: RssResponse,
  atom: AtomResponse,
  soap: SoapResponse,
  headers: HeadersResponse,
  hls: HLSResponse,
  ffprobe: FfprobeResponse,
  resource: ResourceResponse,
  mediastreamvalidator: MediaStreamValidatorResponse,
  appium: AppiumResponse,
};

const typeToFetchAdapter: { [type: string]: HttpRequestFetch } = {
  html: fetchWithNeedle,
  json: fetchWithNeedle,
  xml: fetchWithNeedle,
  rss: fetchWithNeedle,
  atom: fetchWithNeedle,
  soap: fetchWithNeedle,
  headers: fetchWithNeedle,
  hls: fetchWithNeedle,
  resource: fetchWithNeedle,
  ffprobe: fetchWithFfprobe,
  mediastreamvalidator: fetchWithMediaStreamValidator,
  image: fetchImageWithNeedle,
  appium: fetchWithNeedle,
};

export const getResponseClass = (scenario: iScenario): ClassDef =>
  typeToClassMap[scenario.type] || ResourceResponse;

export function createResponse(scenario: iScenario): iResponse {
  const className = getResponseClass(scenario);
  return new className(scenario);
}

export const getRequestAdapter = (scenario: iScenario): HttpRequestFetch => {
  return typeToFetchAdapter[scenario.type];
};
