import { fetchWithNeedle } from "../adapters/needle";
import { BrowserResponse } from "./browser-response";
import { PuppeteerScenario } from "./puppeteer-scenario";

export class BrowserScenario extends PuppeteerScenario {
  protected responseClass = BrowserResponse;
  protected requestAdapter = fetchWithNeedle;
}
