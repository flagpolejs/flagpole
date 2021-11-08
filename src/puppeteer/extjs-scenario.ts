import { fetchWithNeedle } from "../adapters/needle";
import { ExtJSResponse } from "./extjs-response";
import { PuppeteerScenario } from "./puppeteer-scenario";

export class ExtJsScenario extends PuppeteerScenario {
  protected responseClass = ExtJSResponse;
  protected requestAdapter = fetchWithNeedle;
}
