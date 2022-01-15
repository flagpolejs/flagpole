import { iSuite } from "./interfaces/isuite";
import { AppiumScenario } from "./appium/appium-scenario";
import { JsonScenario } from "./json/json-scenario";
import { BrowserScenario } from "./puppeteer/browser-scenario";
import { ExtJsScenario } from "./puppeteer/extjs-scenario";
import { HtmlScenario } from "./html/html-scenario";
import { ImageScenario } from "./visual/image-scenario";
import { XmlScenario } from "./xml/xml-scenario";
import { RssScenario } from "./xml/rss-scenario";
import { AtomScenario } from "./xml/atom-scenario";
import { SoapScenario } from "./xml/soap-scenario";
import { HeadersScenario } from "./headers/headers-scenario";
import { HlsScenario } from "./media/hls-scenario";
import { FfprobeScenario } from "./media/ffprobe-scenario";
import { ResourceScenario } from "./resource/resource-scenario";
import { MediaStreamValidatorScenario } from "./media/media-stream-validator-scenario";
import { ScenarioType } from "./scenario-types";
import { ClassConstructor, KeyValue } from "./interfaces/generic-types";
import { iScenario, ScenarioConstructor } from "./interfaces/iscenario";

export const ScenarioTypeMap: {
  [type in ScenarioType]: ScenarioConstructor;
} = {
  html: HtmlScenario,
  browser: BrowserScenario,
  extjs: ExtJsScenario,
  image: ImageScenario,
  json: JsonScenario,
  xml: XmlScenario,
  rss: RssScenario,
  atom: AtomScenario,
  soap: SoapScenario,
  headers: HeadersScenario,
  hls: HlsScenario,
  ffprobe: FfprobeScenario,
  resource: ResourceScenario,
  mediastreamvalidator: MediaStreamValidatorScenario,
  appium: AppiumScenario,
};

export const createScenario = <T extends iScenario>(
  suite: iSuite,
  title: string,
  type: ScenarioType | ClassConstructor<T>,
  opts: KeyValue
): T => {
  const ctor = typeof type == "string" ? ScenarioTypeMap[type] : type;
  return new ctor(suite, title, ctor, opts) as T;
};
